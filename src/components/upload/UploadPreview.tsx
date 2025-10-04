"use client";
/* eslint-disable @next/next/no-img-element */
import { motion } from "framer-motion";
import { X, Image, Video, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { generateVideoThumbnail, isMobile } from "@/utils";

interface UploadPreviewProps {
  files: File[];
  onRemove: (index: number) => void;
  isUploading?: boolean;
}

export default function UploadPreview({ files, onRemove, isUploading }: UploadPreviewProps) {
  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({});
  const [thumbnailLoading, setThumbnailLoading] = useState<Record<string, boolean>>({});

  const getFileIcon = (file: File): LucideIcon => {
    if (file.type.startsWith('image/')) return Image;
    if (file.type.startsWith('video/')) return Video;
    return FileText;
  };

  const getFilePreview = (file: File): string | null => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    if (file.type.startsWith('video/')) {
      // Return thumbnail if available, otherwise return video URL
      return videoThumbnails[file.name] || URL.createObjectURL(file);
    }
    return null;
  };

  // Generate thumbnails for video files with mobile optimization
  useEffect(() => {
    const generateThumbnails = async () => {
      // On mobile, skip thumbnail generation and show videos directly
      if (isMobile()) {
        return;
      }

      const newThumbnails: Record<string, string> = {};
      const newLoading: Record<string, boolean> = {};
      
      for (const file of files) {
        if (file.type.startsWith('video/')) {
          newLoading[file.name] = true;
          try {
            const thumbnail = await generateVideoThumbnail(file);
            newThumbnails[file.name] = thumbnail;
          } catch {
            // Mark as error so we don't keep trying
            // newErrors[file.name] = true; // This line was removed
          } finally {
            newLoading[file.name] = false;
          }
        }
      }
      
      setThumbnailLoading(prev => ({ ...prev, ...newLoading }));
      setVideoThumbnails(prev => ({ ...prev, ...newThumbnails }));
    };

    generateThumbnails();
  }, [files]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {files.map((file, index) => {
        const FileIcon = getFileIcon(file);
        const previewUrl = getFilePreview(file);
        const isVideo = file.type.startsWith('video/');
        const isLoadingThumbnail = thumbnailLoading[file.name];

        return (
          <motion.div
            key={`${file?.name}-${index}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative group"
          >
            <div className="bg-white rounded-2xl border-2 border-gold-200 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
              {/* Preview */}
              <div className="aspect-square bg-gradient-to-br from-cream-100 to-gold-100 relative overflow-hidden">
                {previewUrl ? (
                  isVideo ? (
                    <div className="relative w-full h-full">
                      {/* On mobile, always show video preview. On desktop, show thumbnail if available */}
                      {!isMobile() && videoThumbnails[file.name] ? (
                        <img
                          src={videoThumbnails[file.name]}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {/* Show loading only on desktop when generating thumbnails */}
                          {!isMobile() && isLoadingThumbnail ? (
                            <div className="text-center">
                              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                              <p className="text-xs text-gray-500">יוצר תמונה ממוזערת...</p>
                            </div>
                          ) : (
                            /* Always show video preview on mobile, or if thumbnail generation failed */
                            <video
                              src={previewUrl}
                              controls={false}
                              muted
                              loop
                              autoPlay
                              playsInline
                              {...({ 'webkit-playsinline': 'true' } as Record<string, string>)}
                              preload="metadata"
                              className="w-full h-full object-cover"
                              onCanPlay={(e) => {
                                const v = e.currentTarget as HTMLVideoElement;
                                if (v.readyState >= 2) {
                                  try { v.currentTime = 0.001; } catch {}
                                }
                              }}
                            />
                          )}
                        </div>
                      )}
                      
                      {/* Video indicator overlay */}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                          <Video className="w-6 h-6 text-emerald-600" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={previewUrl}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                
                {/* Remove Button (Always visible in this preview stage) */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(index)}
                  disabled={isUploading}
                  className={`absolute top-2 right-2 w-8 h-8 rounded-full shadow-lg border transition-all duration-200 z-10 ${
                    isUploading 
                      ? 'bg-gray-400 cursor-not-allowed border-gray-300' 
                      : 'bg-red-500 hover:bg-red-600 text-white border-red-400'
                  }`}
                  title={isUploading ? "לא ניתן למחוק בזמן העלאה" : "הסר קובץ"}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* File Info */}
              <div className="p-3 space-y-1">
                <p className="font-medium text-gray-800 text-sm truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-gray-500 text-xs">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}