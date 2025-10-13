// components/AuthForm.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/router";

type Props = { redirectTo?: string };

export default function AuthForm({ redirectTo = "/" }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body: any = { username, password };
      if (mode === "register") body.email = email || undefined;

      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Eroare la autentificare");
      } else {
        // cookie HttpOnly setat de server; pur și simplu redirecționăm
        router.push(redirectTo);
      }
    } catch (err: any) {
      setError(err?.message || "Eroare");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white/5 rounded-lg">
      <h2 className="text-2xl mb-4 font-semibold">{mode === "login" ? "Conectare" : "Creare cont"}</h2>
      {error && <div className="mb-3 text-red-400">{error}</div>}
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username sau email" className="p-2 rounded bg-white/5" />
        {mode === "register" && (
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (opțional)" className="p-2 rounded bg-white/5" />
        )}
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Parolă" className="p-2 rounded bg-white/5" />
        <button disabled={busy} className="mt-2 py-2 px-4 bg-blue-600 rounded">
          {busy ? "Se procesează..." : mode === "login" ? "Conectare" : "Creează cont"}
        </button>
      </form>

      <div className="mt-4 text-sm">
        {mode === "login" ? (
          <>
            Nu ai cont?{" "}
            <button onClick={() => setMode("register")} className="text-blue-400 underline">
              Creează unul
            </button>
          </>
        ) : (
          <>
            Ai deja cont?{" "}
            <button onClick={() => setMode("login")} className="text-blue-400 underline">
              Conectează-te
            </button>
          </>
        )}
      </div>
    </div>
  );
}