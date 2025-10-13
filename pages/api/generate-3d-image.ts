import type { NextApiRequest, NextApiResponse } from "next";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || "",
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Nu citim rawBody aici dacă nu îl folosești; folosește formidable/busboy dacă vrei upload server-side.

    const output: unknown = await replicate.run("kwaivgi/kling-v2.1", {
      input: {
        prompt: "Imagine randată 3D profesională din fotografie reală",
        mode: "image_to_video",
        input_image: "https://replicate.delivery/mgxm/placeholder/input.jpg",
        guidance_scale: 6,
        steps: 30,
      },
    });

    let videoUrl: string | undefined;
    if (Array.isArray(output) && output.length > 0 && typeof output[0] === "string") {
      videoUrl = output[0];
    } else if (typeof output === "string") {
      videoUrl = output;
    }

    if (!videoUrl) {
      return res.status(200).json({
        video: "https://cdn.pixabay.com/vimeo/423624104/ai-35027.mp4?width=640&hash=74b1b19edbc74e370a3a8b3e4df3f516cb58e1c9",
        model:
          "https://firebasestorage.googleapis.com/v0/b/randari3d-387e2.firebasestorage.app/o/sofa.glb?alt=media&token=04f05126-3d47-48ba-926a-521a5b07a218",
      });
    }

    return res.status(200).json({
      video: videoUrl,
      model:
        "https://firebasestorage.googleapis.com/v0/b/randari3d-387e2.firebasestorage.app/o/sofa.glb?alt=media&token=04f05126-3d47-48ba-926a-521a5b07a218",
    });
  } catch (err: unknown) {
    console.error("Eroare API:", err);
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message || "Eroare internă server." });
  }
}