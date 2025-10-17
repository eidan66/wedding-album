"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Image as ImageIcon, Video, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RefObject, DragEvent, ChangeEvent } from 'react';

interface UploadZoneProps {
  onFileSelect: (files: FileList | null) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  currentFileCount?: number;
  maxFiles?: number;
}

export default function UploadZone({
  onFileSelect,
  fileInputRef,
  // currentFileCount = 0, - COMMENTED OUT FOR UNLIMITED FILES
  // maxFiles = 10, - COMMENTED OUT FOR UNLIMITED FILES
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    onFileSelect(files);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center px-2">
        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-1 rounded-full flex items-center justify-center" aria-hidden="true">
          <Heart className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-emerald-600 float-animation" />
        </div>
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2">
          שתפו את הזכרונות היפים שלכם
        </h2>
        <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
          העלו תמונות וסרטונים מהיום הקסום הזה כדי ליצור זכרונות נצחיים יחד
          <br />
          {/* <span className="mt-3 text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            ניתן להעלות עד 10 קבצים בכל פעם
          </span> */}
          {/* <span className="mt-3 text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            אין הגבלה על מספר הקבצים או גודלם
          </span> */}
        </p>
        {/* {currentFileCount >= maxFiles && (
          <div className="mt-3 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
            הגעתם למגבלה של {maxFiles} קבצים. העלו את הקבצים הנוכחיים לפני הוספת עוד
          </div>
        )} */}
      </div>

      {/* Upload Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
        className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-6 md:p-8 transition-all duration-300 ${
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

        <div className="text-center space-y-3 sm:space-y-4">
          <div className="flex justify-center gap-3 sm:gap-4" aria-hidden="true">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
              <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 px-2">
              {isDragging ? 'שחררו את הזכרונות שלכם כאן!' : 'גררו ושחררו את התמונות והסרטונים שלכם'}
            </h3>
            <p className="text-gray-500 text-xs sm:text-sm mb-3 sm:mb-4 px-2">
              תומך ב-JPEG, PNG, GIF, MP4, MOV ועוד
              <br />
              {/* <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                ניתן להעלות עד 10 קבצים בכל פעם
              </span> */}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => fileInputRef.current?.click()}
              // disabled={currentFileCount >= maxFiles} - COMMENTED OUT FOR UNLIMITED FILES
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-sm sm:text-base"
            >
              <Upload className="w-4 h-4 ml-2" />
              {/* {currentFileCount >= maxFiles ? 'הגעתם למגבלה' : 'בחרו קבצים'} */}
              בחרו קבצים
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}