import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Camera, Image, Video, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UploadZone({ onFileSelect, selectedFiles, fileInputRef }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    onFileSelect(files);
  };

  const handleFileSelect = (e) => {
    onFileSelect(e.target.files);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-gold-100 rounded-full flex items-center justify-center">
          <Heart className="w-8 h-8 text-emerald-600 float-animation" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          שתפו את הזכרונות היפים שלכם
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          העלו תמונות וסרטונים מהיום הקסום הזה כדי ליצור זכרונות נצחיים יחד
        </p>
      </div>

      {/* Upload Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${
          isDragging
            ? 'border-emerald-400 bg-emerald-50 scale-105'
            : 'border-gold-300 hover:border-emerald-400 hover:bg-emerald-50/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="text-center space-y-4">
          <div className="flex justify-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
              <Image className="w-6 h-6 text-blue-600" />
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-purple-600" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {isDragging ? 'שחררו את הזכרונות שלכם כאן!' : 'גררו ושחררו את התמונות והסרטונים שלכם'}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              תומך ב-JPEG, PNG, GIF, MP4, MOV ועוד
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
            >
              <Upload className="w-4 h-4 ml-2" />
              בחרו קבצים
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                // Camera functionality would be implemented here
                fileInputRef.current?.click();
              }}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <Camera className="w-4 h-4 ml-2" />
              צלמו תמונה
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}