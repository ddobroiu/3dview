"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FaUserCircle, FaSignOutAlt, FaSignInAlt, FaCube, FaRocket, FaCog, FaBars, FaTimes } from "react-icons/fa";

type User = {
  id: string;
  username: string;
  email?: string;
};

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

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
    <>
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <FaCube className="text-white text-xl animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-black animate-bounce" />
              </div>
              <div className="hidden sm:block">
                <div className="text-xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                  3DView.ai
                </div>
                <div className="text-xs text-blue-300/80 font-medium">
                  AI-Powered 3D Generation
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link href="/" className="px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 font-medium">
                Home
              </Link>
              <Link href="#features" className="px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 font-medium">
                Features
              </Link>
              <Link href="/purchase-credits" className="px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 font-medium">
                Pricing
              </Link>
              {user && (
                <Link href="/dashboard" className="px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 font-medium flex items-center gap-2">
                  <FaRocket /> Dashboard
                </Link>
              )}
            </nav>

            {/* User Actions */}
            <div className="flex items-center gap-3">
              {!loading && !user && (
                <Link href="/login" className="group relative px-6 py-2.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative flex items-center gap-2">
                    <FaRocket className="text-sm" />
                    <span className="hidden sm:inline">Get Started</span>
                  </span>
                </Link>
              )}

              {!loading && user && (
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl backdrop-blur">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <FaUserCircle className="text-white text-sm" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{user.username}</div>
                      {user.email && <div className="text-xs text-blue-300/80">{user.email}</div>}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 rounded-xl transition-all duration-200 flex items-center gap-2"
                  >
                    <FaSignOutAlt />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              )}

              {loading && <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse" />}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                {mobileMenuOpen ? <FaTimes className="text-white" /> : <FaBars className="text-white" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-0 right-0 w-80 h-full bg-black/90 backdrop-blur-xl border-l border-white/10 p-6">
            <div className="flex flex-col gap-4 mt-16">
              <Link href="/" className="px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link href="#features" className="px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all" onClick={() => setMobileMenuOpen(false)}>
                Features
              </Link>
              <Link href="/purchase-credits" className="px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all" onClick={() => setMobileMenuOpen(false)}>
                Pricing
              </Link>
              {user && (
                <Link href="/dashboard" className="px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <FaRocket /> Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}