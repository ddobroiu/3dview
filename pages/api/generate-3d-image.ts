import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/db";
import { getUserCredits, useCredits } from "../../lib/credits";
import { AI3DProviderFactory, calculateProviderCost, type AIProvider } from "../../lib/ai-providers";
import jwt from "jsonwebtoken";
import cookie from "cookie";

// AI Provider is now configurable

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getUserFromToken(req: NextApiRequest): Promise<{ id: string } | null> {
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token;
    
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string };
    return { id: decoded.id };
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Authenticate user
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Parse request body
    const { 
      imageUrl, 
      prompt, 
      quality = "STANDARD",
      provider = "meshy" // Default to Meshy AI
    } = JSON.parse(req.body || '{}');
    
    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    // Check credits with provider-specific costs
    const userCredits = await getUserCredits(user.id);
    if (!userCredits) {
      return res.status(404).json({ error: "User not found" });
    }

    const creditsCost = calculateProviderCost(provider as AIProvider, quality as 'STANDARD' | 'HIGH' | 'ULTRA');
    if (userCredits.credits < creditsCost) {
      return res.status(402).json({ 
        error: "Insufficient credits", 
        required: creditsCost, 
        available: userCredits.credits,
        provider: provider 
      });
    }

    // Create generation record
    const generation = await prisma.generation.create({
      data: {
        userId: user.id,
        originalImageUrl: imageUrl,
        prompt: prompt || "Generate 3D model from image",
        quality,
        creditsCost,
        status: "PROCESSING",
      },
    });

    // Deduct credits
    const creditResult = await useCredits(user.id, creditsCost, generation.id, quality);
    if (!creditResult.success) {
      await prisma.generation.update({
        where: { id: generation.id },
        data: { status: "FAILED", errorMessage: creditResult.error },
      });
      return res.status(400).json({ error: creditResult.error });
    }

    const startTime = Date.now();

    try {
      // Initialize AI provider
      const aiProvider = AI3DProviderFactory.create(provider as AIProvider);
      
      // Start generation
      const task = await aiProvider.generate({
        provider: provider as AIProvider,
        imageUrl,
        prompt: prompt || "Professional 3D model from image",
        quality: quality as 'STANDARD' | 'HIGH' | 'ULTRA'
      });

      // Store task ID for tracking
      await prisma.generation.update({
        where: { id: generation.id },
        data: { 
          prompt: `${prompt || 'Generate 3D model'} | Provider: ${provider} | TaskID: ${task.taskId}`
        },
      });

      // Poll for completion
      let attempts = 0;
      const maxAttempts = provider === 'tripo' ? 24 : 60; // Tripo is faster
      const pollInterval = provider === 'tripo' ? 2500 : 5000;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        if (!task.taskId) {
          throw new Error('No task ID received from provider');
        }

        const status = await aiProvider.checkStatus(task.taskId);
        
        if (status.status === 'completed') {
          const processingTime = Math.floor((Date.now() - startTime) / 1000);
          
          // Update generation with results
          await prisma.generation.update({
            where: { id: generation.id },
            data: {
              status: "COMPLETED",
              modelUrl: status.modelUrl,
              videoUrl: status.thumbnailUrl, // Use thumbnail as preview
              processingTime,
              completedAt: new Date(),
            },
          });

          return res.status(200).json({
            id: generation.id,
            model: status.modelUrl,
            thumbnail: status.thumbnailUrl,
            provider: provider,
            creditsUsed: creditsCost,
            remainingCredits: creditResult.newBalance,
            processingTime,
          });
        }
        
        if (status.status === 'failed') {
          throw new Error(status.errorMessage || 'Generation failed');
        }
        
        // Log progress
        if (status.progress) {
          console.log(`Generation progress (${provider}): ${status.progress}%`);
        }
        
        attempts++;
      }
      
      throw new Error(`Generation timeout (${provider}) - taking too long`);

    } catch (aiError) {
      // AI processing failed - update generation record
      await prisma.generation.update({
        where: { id: generation.id },
        data: { 
          status: "FAILED", 
          errorMessage: aiError instanceof Error ? aiError.message : "AI processing failed"
        },
      });

      // Refund credits on AI failure
      await prisma.$transaction(async (tx: any) => {
        await tx.user.update({
          where: { id: user.id },
          data: { credits: { increment: creditsCost } },
        });

        await tx.creditTransaction.create({
          data: {
            userId: user.id,
            amount: creditsCost,
            type: 'REFUND',
            description: `Refund for failed generation - Generation ID: ${generation.id}`,
          },
        });
      });

      throw aiError;
    }

  } catch (err: unknown) {
    console.error("Generation API error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message || "Eroare internă server." });
  }
}