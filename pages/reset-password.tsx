// pages/reset-password.tsx
import { useRouter } from "next/router";
import React, { useState } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const token = (router.query.token as string) || "";
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Eroare");
      setDone(true);
    } catch (e: any) {
      setError(e?.message || "Eroare");
    }
  }

  if (!token) return <div className="min-h-screen grid place-items-center">Token lipsă</div>;

  return (
    <main className="min-h-screen grid place-items-center bg-[#0b0f19] text-white">
      <form onSubmit={submit} className="bg-[#131826] p-8 rounded-2xl w-full max-w-md">
        <h1 className="text-xl mb-4">Setează parolă nouă</h1>
        {error && <div className="mb-3 text-red-400 text-sm">{error}</div>}
        {done ? (
          <div>
            <div className="text-emerald-400 mb-3">Parola a fost resetată.</div>
            <a className="underline" href="/login">Mergi la login</a>
          </div>
        ) : (
          <>
            <input
              type="password"
              className="w-full rounded-lg bg-[#0b0f19] px-4 py-3 outline-none mb-4"
              placeholder="Parolă nouă"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="w-full rounded-lg bg-white/10 hover:bg-white/20 px-4 py-3">
              Salvează
            </button>
          </>
        )}
      </form>
    </main>
  );
}
