import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Camera, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { Footer } from "./Footer";

interface LayoutProps {
  children?: React.ReactNode; // Make children optional
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-gold-50" dir="rtl">
      {/* Header */}
      <header className="wedding-gradient border-b border-gold-200 sticky top-0 z-50 glass-effect">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl("Gallery")} className="flex items-center gap-6 group">
              <motion.div 
                className="w-10 h-10 bg-gradient-to-r from-gold-200 to-emerald-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Heart className="w-5 h-5 text-emerald-600 float-animation" />
              </motion.div>
              <div className="flex-shrink-0 pl-1 mr-1">
                <h1 className="text-xl font-bold from-emerald-700 to-gold-400 bg-clip-text text-emerald-700">
                  ספיר & עידן
                </h1>
                <p className="text-xs text-gray-600 font-medium">זכרונות מהחתונה שלנו</p>
              </div>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                to={createPageUrl("Gallery")} 
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                  location.pathname === createPageUrl("Gallery") 
                    ? 'bg-gold-100 text-emerald-700 shadow-lg' 
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-cream-100'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span className="font-medium">הגלריה</span>
              </Link>
              <Link 
                to={createPageUrl("Upload")} 
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                  location.pathname === createPageUrl("Upload") 
                    ? 'bg-gold-100 text-emerald-700 shadow-lg' 
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-cream-100'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span className="font-medium">שיתוף זיכרון</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
        <Outlet /> {/* This will render the nested routes */}
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 glass-effect border-t border-gold-200 p-4">
        <div className="flex justify-center gap-8">
          <Link 
            to={createPageUrl("Gallery")} 
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300 ${
              location.pathname === createPageUrl("Gallery") 
                ? 'bg-gold-100 text-emerald-700 shadow-lg scale-110' 
                : 'text-gray-600'
            }`}
          >
            <Camera className="w-6 h-6" />
            <span className="text-xs font-medium">גלריה</span>
          </Link>
          <Link 
            to={createPageUrl("Upload")} 
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300 ${
              location.pathname === createPageUrl("Upload") 
                ? 'bg-gold-100 text-emerald-700 shadow-lg scale-110' 
                : 'text-gray-600'
            }`}
          >
            <Upload className="w-6 h-6" />
            <span className="text-xs font-medium">שיתוף</span>
          </Link>
        </div>
      </div>
    </div>
  );
}