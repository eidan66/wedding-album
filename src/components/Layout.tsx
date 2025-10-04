"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPageUrl } from "@/utils";
import { Heart, Camera, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { Footer } from "./Footer";
import { ShareFAB } from "./ui/ShareFAB";
import { WeddingDateConfetti } from "./Confetti";
import ThemeToggle from "./ui/ThemeToggle";

interface LayoutProps {
  children?: React.ReactNode; // Make children optional
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-gold-50" dir="rtl">
      {/* Header */}
      <header className="wedding-gradient border-b border-gold-200 sticky top-0 z-50 glass-effect">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <Link href={createPageUrl("Gallery")} className="flex items-center gap-6 group">
              <motion.div 
                className="w-12 h-12 bg-gradient-to-r from-gold-200 to-emerald-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Heart className="w-6 h-6 text-emerald-600 float-animation" />
              </motion.div>
              <div className="flex-shrink-0 pl-1 mr-1">
                <h1 className="text-xl font-bold from-emerald-700 to-gold-400 bg-clip-text text-emerald-700 text-center">
                  ספיר & עידן
                </h1>
                <p className="text-sm text-gray-600 font-medium text-center">זכרונות מהחתונה שלנו</p>
                <div className="relative">
                  <p className="text-sm text-gray-600 font-medium text-center relative z-10">
                    <span className="text-gold-600 font-semibold drop-shadow-sm">20-10-2025</span>
                  </p>
                  <WeddingDateConfetti />
                </div>
              </div>
            </Link>
            
            {/* Navigation Links */}
            <nav className="flex items-center gap-4 lg:gap-6">
              <Link 
                href={createPageUrl("Gallery")} 
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                  pathname === createPageUrl("Gallery") 
                    ? 'bg-gold-100 text-emerald-700 shadow-lg' 
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-cream-100'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span className="text-sm md:font-medium">הגלריה</span>
              </Link>
              <Link 
                href={createPageUrl("Upload")}
                className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                  pathname === createPageUrl("Upload") 
                    ? 'bg-gold-100 text-emerald-700 shadow-lg' 
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-cream-100'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm md:font-medium">שיתוף זיכרון</span>
              </Link>
              
              {/* Theme Toggle */}
              <div className="flex items-center">
                <ThemeToggle />
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <Footer />

      {/* Share FAB for mobile */}
      {pathname !== createPageUrl("Upload") && pathname !== createPageUrl("Download") && <ShareFAB />}
    </div>
  );
}