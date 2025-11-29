import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs/promises";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filename: (name, ext, part) => {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2);
        return `${timestamp}-${randomStr}${ext}`;
      },
    });

    const [fields, files] = await form.parse(req);
    
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
    
    if (!imageFile) {
      return res.status(400).json({ error: "No image file uploaded" });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(imageFile.mimetype || '')) {
      // Delete uploaded file
      await fs.unlink(imageFile.filepath);
      return res.status(400).json({ error: "Invalid file type. Only JPG, PNG, and WebP are allowed." });
    }

    // Generate public URL
    const filename = path.basename(imageFile.filepath);
    const imageUrl = `/uploads/${filename}`;

    return res.status(200).json({ 
      imageUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${imageUrl}`,
      filename 
    });

  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return res.status(500).json({ error: message });
  }
}