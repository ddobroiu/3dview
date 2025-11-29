"use client";

import Link from "next/link";
import { FaCube, FaTwitter, FaDiscord, FaGithub, FaHeart, FaRocket } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-black/50 to-black border-t border-white/10 text-white">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
                <FaCube className="text-white text-xl" />
              </div>
              <div>
                <div className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                  3DView.ai
                </div>
                <div className="text-sm text-blue-300/80">
                  AI-Powered 3D Generation
                </div>
              </div>
            </div>
            <p className="text-gray-400 max-w-md leading-relaxed">
              Transform your images into stunning 3D models and videos with cutting-edge AI technology. 
              Fast, reliable, and incredibly easy to use.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a href="#" className="w-10 h-10 rounded-xl bg-white/10 hover:bg-blue-500/20 flex items-center justify-center transition-all duration-300 hover:scale-110">
                <FaTwitter className="text-blue-400" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/10 hover:bg-purple-500/20 flex items-center justify-center transition-all duration-300 hover:scale-110">
                <FaDiscord className="text-purple-400" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/10 hover:bg-gray-500/20 flex items-center justify-center transition-all duration-300 hover:scale-110">
                <FaGithub className="text-gray-400" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Product</h3>
            <div className="space-y-3">
              <Link href="#features" className="block text-gray-400 hover:text-white transition-colors">Features</Link>
              <Link href="#pricing" className="block text-gray-400 hover:text-white transition-colors">Pricing</Link>
              <Link href="/dashboard" className="block text-gray-400 hover:text-white transition-colors">Dashboard</Link>
              <Link href="#api" className="block text-gray-400 hover:text-white transition-colors">API</Link>
            </div>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Support</h3>
            <div className="space-y-3">
              <Link href="/help" className="block text-gray-400 hover:text-white transition-colors">Help Center</Link>
              <Link href="/privacy" className="block text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="block text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
              <a href="mailto:support@3dview.ai" className="block text-gray-400 hover:text-white transition-colors">Contact Us</a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <span>© {new Date().getFullYear()} 3DView.ai</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Made with <FaHeart className="text-red-400 text-sm animate-pulse" /> for creators
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-gray-400">All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}