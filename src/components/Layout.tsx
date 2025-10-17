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
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <Link href={createPageUrl("Gallery")} className="flex items-center gap-2 sm:gap-4 md:gap-6 group">
              <motion.div 
                className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-gold-200 to-emerald-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 float-animation" />
              </motion.div>
              <div className="flex-shrink-0 min-w-0">
                <h1 className="text-base sm:text-lg md:text-xl font-bold from-emerald-700 to-gold-400 bg-clip-text text-emerald-700 text-center whitespace-nowrap">
                  ספיר & עידן
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 font-medium text-center whitespace-nowrap">זכרונות מהחתונה שלנו</p>
                <div className="relative">
                  <p className="text-xs sm:text-sm text-gray-600 font-medium text-center relative z-10 whitespace-nowrap">
                    <span className="text-gold-600 font-semibold drop-shadow-sm">20-10-2025</span>
                  </p>
                  <WeddingDateConfetti />
                </div>
              </div>
            </Link>
            
            {/* Navigation Links */}
            <nav className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6">
              <Link 
                href={createPageUrl("Gallery")} 
                className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-300 ${
                  pathname === createPageUrl("Gallery") 
                    ? 'bg-gold-100 text-emerald-700 shadow-lg' 
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-cream-100'
                }`}
              >
                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm md:font-medium">הגלריה</span>
              </Link>
              <Link 
                href={createPageUrl("Upload")}
                className={`hidden md:flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-300 ${
                  pathname === createPageUrl("Upload") 
                    ? 'bg-gold-100 text-emerald-700 shadow-lg' 
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-cream-100'
                }`}
              >
                <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm md:font-medium">שיתוף זיכרון</span>
              </Link>
              
              {/* Theme Toggle */}
              <div className="flex items-center flex-shrink-0">
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