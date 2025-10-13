"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-[#071027] border-t border-slate-800 text-slate-300 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm">© {new Date().getFullYear()} 3dview — Toate drepturile rezervate.</div>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <a className="hover:text-white" href="mailto:contact@example.com">Contact</a>
        </div>
      </div>
    </footer>
  );
}