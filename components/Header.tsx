"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FaUserCircle, FaSignOutAlt, FaSignInAlt } from "react-icons/fa";

type User = {
  id: string;
  username: string;
  email?: string;
};

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setUser(data?.user ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (err) {
      // ignore
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <header className="w-full bg-[#071027] border-b border-slate-800 text-white">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
              3D
            </div>
            <div className="hidden sm:block">
              <div className="font-semibold">3dview</div>
              <div className="text-xs text-slate-300">Imagine → Model 3D + Video</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-3 ml-6">
            <Link href="/" className="text-slate-200 hover:text-white px-3 py-1 rounded">Acasă</Link>
            <Link href="#preview" className="text-slate-200 hover:text-white px-3 py-1 rounded">Previzualizare</Link>
            <Link href="#istoric" className="text-slate-200 hover:text-white px-3 py-1 rounded">Istoric</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {!loading && !user && (
            <Link href="/login" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded">
              <FaSignInAlt /> <span className="hidden sm:inline">Login</span>
            </Link>
          )}

          {!loading && user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right mr-2">
                <span className="text-sm font-medium">{user.username}</span>
                {user.email && <span className="text-xs text-slate-300">{user.email}</span>}
              </div>

              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-lg text-slate-200">
                  <FaUserCircle />
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded"
                >
                  <FaSignOutAlt /> <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          )}

          {loading && <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" aria-hidden />}
        </div>
      </div>
    </header>
  );
}