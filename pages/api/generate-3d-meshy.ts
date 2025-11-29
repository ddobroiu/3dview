import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/db";
import { getUserCredits, useCredits, calculateGenerationCost } from "../../lib/credits";
import jwt from "jsonwebtoken";
import cookie from "cookie";

async function getUserFromToken(req: NextApiRequest): Promise<{ id: string } | null> {
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token;
    
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    return { id: decoded.userId };
  } catch {
    return null;
  }
}

// Meshy AI API integration
class MeshyAPI {
  private apiKey: string;
  private baseURL = 'https://api.meshy.ai/v1';

  constructor() {
    this.apiKey = process.env.MESHY_API_KEY || '';
  }

  async imageToModel(imageUrl: string, prompt?: string): Promise<{
    taskId: string;
    status: 'pending' | 'running' | 'succeeded' | 'failed';
    modelUrl?: string;
    thumbnailUrl?: string;
  }> {
    const response = await fetch(`${this.baseURL}/image-to-3d`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
        enable_pbr: true, // Physical Based Rendering
        surface_mode: 'organic', // organic | hard_surface
        target_polycount: 10000, // 5k, 10k, 20k, 50k
        prompt: prompt || 'High quality 3D model'
      }),
    });

    if (!response.ok) {
      throw new Error(`Meshy API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async getTaskStatus(taskId: string): Promise<{
    status: 'pending' | 'running' | 'succeeded' | 'failed';
    progress: number;
    modelUrl?: string;
    thumbnailUrl?: string;
    errorMessage?: string;
  }> {
    const response = await fetch(`${this.baseURL}/image-to-3d/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Meshy API error: ${response.statusText}`);
    }

    return await response.json();
  }
}

const meshyAPI = new MeshyAPI();

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

    const { imageUrl, prompt, quality = "STANDARD" } = JSON.parse(req.body || '{}');
    
    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    // Check credits
    const userCredits = await getUserCredits(user.id);
    if (!userCredits) {
      return res.status(404).json({ error: "User not found" });
    }

    const creditsCost = calculateGenerationCost(quality as 'STANDARD' | 'HIGH' | 'ULTRA');
    if (userCredits.credits < creditsCost) {
      return res.status(402).json({ 
        error: "Insufficient credits", 
        required: creditsCost, 
        available: userCredits.credits 
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
      // Start 3D generation with Meshy AI
      const task = await meshyAPI.imageToModel(imageUrl, prompt);
      
      // Update generation with task ID
      await prisma.generation.update({
        where: { id: generation.id },
        data: { 
          // Store task ID in a new field or use existing field creatively
          prompt: `${prompt || 'Generate 3D model'} | TaskID: ${task.taskId}`
        },
      });

      // Poll for completion (you might want to implement webhooks instead)
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max wait
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const status = await meshyAPI.getTaskStatus(task.taskId);
        
        if (status.status === 'succeeded') {
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
            creditsUsed: creditsCost,
            remainingCredits: creditResult.newBalance,
            processingTime,
          });
        }
        
        if (status.status === 'failed') {
          throw new Error(status.errorMessage || 'Generation failed');
        }
        
        // Update progress if available
        if (status.progress) {
          // You could emit progress updates via WebSocket here
          console.log(`Generation progress: ${status.progress}%`);
        }
        
        attempts++;
      }
      
      throw new Error('Generation timeout - taking too long');

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
    return res.status(500).json({ error: message || "Internal server error" });
  }
}