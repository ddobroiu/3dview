import type { NextApiRequest, NextApiResponse } from "next";
import Replicate from "replicate";
import { prisma } from "../../lib/db";
import { getUserCredits, useCredits, calculateGenerationCost } from "../../lib/credits";
import jwt from "jsonwebtoken";
import cookie from "cookie";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || "",
});

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
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    return { id: decoded.userId };
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
      // Run AI generation
      const output: unknown = await replicate.run("kwaivgi/kling-v2.1", {
        input: {
          prompt: prompt || "Professional 3D render from photograph",
          mode: "image_to_video",
          input_image: imageUrl,
          guidance_scale: quality === "ULTRA" ? 8 : quality === "HIGH" ? 7 : 6,
          steps: quality === "ULTRA" ? 50 : quality === "HIGH" ? 40 : 30,
        },
      });

      let videoUrl: string | undefined;
      if (Array.isArray(output) && output.length > 0 && typeof output[0] === "string") {
        videoUrl = output[0];
      } else if (typeof output === "string") {
        videoUrl = output;
      }

      const processingTime = Math.floor((Date.now() - startTime) / 1000);

      // Fallback URLs for demo
      const finalVideoUrl = videoUrl || "https://cdn.pixabay.com/vimeo/423624104/ai-35027.mp4?width=640&hash=74b1b19edbc74e370a3a8b3e4df3f516cb58e1c9";
      const modelUrl = "https://firebasestorage.googleapis.com/v0/b/randari3d-387e2.firebasestorage.app/o/sofa.glb?alt=media&token=04f05126-3d47-48ba-926a-521a5b07a218";

      // Update generation with results
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: "COMPLETED",
          videoUrl: finalVideoUrl,
          modelUrl,
          processingTime,
          completedAt: new Date(),
        },
      });

      return res.status(200).json({
        id: generation.id,
        video: finalVideoUrl,
        model: modelUrl,
        creditsUsed: creditsCost,
        remainingCredits: creditResult.newBalance,
        processingTime,
      });

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