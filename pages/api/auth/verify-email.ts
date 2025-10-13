// pages/api/auth/verify-email.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).send("Method not allowed");
  const token = (req.query.token as string) || "";

  try {
    const vt = await prisma.verificationToken.findUnique({ where: { token } });
    if (!vt) return res.status(400).send("Token invalid");
    if (vt.expires < new Date()) return res.status(400).send("Token expirat");

    const user = await prisma.user.findUnique({ where: { email: vt.identifier } });
    if (!user) return res.status(404).send("Utilizator inexistent");

    // marchează email verificat
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    // consumă tokenul
    await prisma.verificationToken.delete({ where: { token } });

    // redirect la login cu mesaj
    res.writeHead(302, { Location: "/login?verified=1" });
    return res.end();
  } catch (e: any) {
    return res.status(500).send("Eroare server");
  }
}
