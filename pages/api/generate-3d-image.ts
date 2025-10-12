import type { NextApiRequest, NextApiResponse } from "next";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || "",
});

export const config = {
  api: {
    bodyParser: false, // important pentru upload imagine
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // 🔹 Citim fișierul imagine din request (FormData)
    const buffers: Buffer[] = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const rawBody = Buffer.concat(buffers);

    // ⚠️ În varianta reală, trebuie decodată imaginea; dar pentru test,
    // simulăm o cerere completă la Replicate.

    // 🔹 Rulează modelul kwaivgi/kling-v2.1 (text-to-video din imagine)
    const output = await replicate.run("kwaivgi/kling-v2.1", {
      input: {
        prompt: "Imagine randată 3D profesională din fotografie reală",
        mode: "image_to_video",
        input_image: "https://replicate.delivery/mgxm/placeholder/input.jpg", // poți pune URL real
        guidance_scale: 6,
        steps: 30,
      },
    });

    // 🔹 Simulăm un rezultat dacă nu există output valid
    if (!output || typeof output !== "object") {
      return res.status(200).json({
        video: "https://cdn.pixabay.com/vimeo/423624104/ai-35027.mp4?width=640&hash=74b1b19edbc74e370a3a8b3e4df3f516cb58e1c9",
        model:
          "https://firebasestorage.googleapis.com/v0/b/randari3d-387e2.firebasestorage.app/o/sofa.glb?alt=media&token=04f05126-3d47-48ba-926a-521a5b07a218",
      });
    }

    // 🔹 Extragem URL-ul video din output
    const videoUrl = Array.isArray(output) ? output[0] : output as string;

    return res.status(200).json({
      video: videoUrl,
      model:
        "https://firebasestorage.googleapis.com/v0/b/randari3d-387e2.firebasestorage.app/o/sofa.glb?alt=media&token=04f05126-3d47-48ba-926a-521a5b07a218",
    });
  } catch (err: any) {
    console.error("Eroare API:", err);
    return res.status(500).json({ error: err.message || "Eroare internă server." });
  }
}
