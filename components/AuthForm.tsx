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
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body: any = mode === "login"
        ? { username: username || undefined, email: email || undefined, password }
        : { username, email, password };

      console.log("AuthForm - Sending request to:", url);
      console.log("AuthForm - Body:", body);
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      
      console.log("AuthForm - Response status:", res.status);
      console.log("AuthForm - Response data:", data);
      if (!res.ok) {
        setError(data.error || "Eroare");
      } else {
        if (mode === "register") {
          setInfo("Cont creat. Verifică emailul pentru confirmare.");
          setMode("login");
        } else {
          router.push(redirectTo);
        }
      }
    } catch (err: any) {
      setError("Eroare de rețea");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-[#131826] text-white rounded-2xl p-8 shadow-xl">
      <h1 className="text-2xl font-semibold mb-6">{mode === "login" ? "Conectează-te" : "Creează cont"}</h1>
      {error && <div className="mb-4 text-sm text-red-400">{error}</div>}
      {info && <div className="mb-4 text-sm text-emerald-400">{info}</div>}

      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "register" && (
          <input
            className="w-full rounded-lg bg-[#0b0f19] px-4 py-3 outline-none"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        )}

        <input
          className="w-full rounded-lg bg-[#0b0f19] px-4 py-3 outline-none"
          placeholder="Email (sau username la login)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required={mode === "register"}
        />

        <input
          className="w-full rounded-lg bg-[#0b0f19] px-4 py-3 outline-none"
          placeholder="Parola"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-white/10 hover:bg-white/20 transition px-4 py-3"
        >
          {busy ? "Se procesează..." : mode === "login" ? "Login" : "Register"}
        </button>
      </form>

      <div className="mt-4 text-sm">
        {mode === "login" ? (
          <>
            Nu ai cont?{" "}
            <button onClick={() => setMode("register")} className="text-blue-400 underline">
              Creează unul
            </button>
            <div className="mt-2">
              <ForgotPassword />
            </div>
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

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sent" | "busy" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setState("sent");
    } catch {
      setState("error");
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        className="flex-1 rounded-lg bg-[#0b0f19] px-3 py-2 outline-none"
        placeholder="Email pentru resetare"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        required
      />
      <button className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-2">
        {state === "busy" ? "..." : "Trimite"}
      </button>
      {state === "sent" && <span className="text-emerald-400 ml-2">Trimis!</span>}
      {state === "error" && <span className="text-red-400 ml-2">Eroare</span>}
    </form>
  );
}
