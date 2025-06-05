import { motion } from "framer-motion";
import { Camera, Heart, Users } from "lucide-react";

interface GalleryHeaderProps {
  mediaCount: number;
}

export default function GalleryHeader({ mediaCount }: GalleryHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-12"
    >
      <div className="relative">
        {/* Decorative hearts */}
        <div className="absolute -top-4 right-1/4 text-gold-400 opacity-30 float-animation">
          <Heart className="w-8 h-8" />
        </div>
        <div className="absolute -top-2 left-1/3 text-emerald-400 opacity-30 float-animation" style={{ animationDelay: '1s' }}>
          <Heart className="w-6 h-6" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-emerald-700 via-gold-400 to-emerald-600 bg-clip-text text-transparent mb-4">
          זכרונות מהחתונה שלנו
        </h1>
        <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
          כל חיוך, כל דמעה, כל רגע קסום מהיום המיוחד שלנו, 
          נתפס ומשותף באהבה על ידי המשפחה והחברים היקרים שלנו.
        </p>
        
        <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-gold-100 to-emerald-100 rounded-full flex items-center justify-center">
              <Camera className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="font-medium">{mediaCount} זכרונות שותפו</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-100 to-gold-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-gold-400" />
            </div>
            <span className="font-medium">על ידי האהובים שלנו</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}