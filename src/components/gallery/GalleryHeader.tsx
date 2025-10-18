"use client";
import { motion } from "framer-motion";
import { Heart, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface GalleryHeaderProps {
  mediaCount: number;
}

export default function GalleryHeader({ mediaCount }: GalleryHeaderProps) {
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Wedding event: October 20, 2025 at 20:00 (Israel time)
    const weddingDate = new Date('2025-10-20T20:00:00+03:00');
    const downloadDate = new Date(weddingDate.getTime() + (25 * 60 * 60 * 1000)); // +25 hours
    
    const checkDownloadAvailability = () => {
      const now = new Date();
      
      if (now >= downloadDate) {
        setShowDownloadButton(true);
      }
    };

    checkDownloadAvailability();
    const interval = setInterval(checkDownloadAvailability, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const handleDownloadPage = () => {
    router.push('/download');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-12"
    >
      <div className="relative">
        {/* Decorative hearts - Hidden on mobile */}
        <div className="hidden md:block absolute -top-4 right-1/4 text-gold-400 opacity-30 float-animation">
          <Heart className="w-8 h-8" />
        </div>
        <div className="hidden md:block absolute -top-2 left-1/3 text-emerald-400 opacity-30 float-animation" style={{ animationDelay: '1s' }}>
          <Heart className="w-6 h-6" />
        </div>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-emerald-700 via-gold-400 to-emerald-600 bg-clip-text text-transparent mb-4 px-2">
          זכרונות מהחתונה שלנו
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto leading-relaxed px-4">
          כל חיוך, כל דמעה, כל רגע קסום מהיום המיוחד שלנו, 
          נתפס ומשותף באהבה על ידי המשפחה והחברים היקרים שלנו.
        </p>
        
        {/* Download Info Banner */}
        <div className="bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-600 rounded-lg p-3 mb-6 max-w-2xl mx-4 md:mx-auto">
          <div className="text-center" dir="rtl">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              💡 לחיצה על תמונה או סרטון מאפשרת לצפות ולהוריד אותה
            </p>
          </div>
        </div>
        
        {/* Hidden Download Button - Only visible after 25 hours */}
        {showDownloadButton && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8"
          >
            <motion.button
              onClick={handleDownloadPage}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 py-3 rounded-full font-semibold shadow-lg transition-all duration-300 flex items-center gap-3 mx-auto"
            >
              <Download className="w-5 h-5" />
              הורד את כל הזיכרונות שלנו
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}