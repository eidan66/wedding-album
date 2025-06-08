import { motion } from "framer-motion";
import { X, Image, Video, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadPreviewProps {
  files: File[];
  onRemove: (index: number) => void;
}

export default function UploadPreview({ files, onRemove }: UploadPreviewProps) {
  const getFileIcon = (file: File): LucideIcon => {
    if (file.type.startsWith('image/')) return Image;
    if (file.type.startsWith('video/')) return Video;
    return FileText;
  };

  const getFilePreview = (file: File): string | null => {
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

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
                  file.type.startsWith('image/') ? (
                    <img
                      src={previewUrl}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={previewUrl}
                      controls={false}
                      muted
                      loop
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
                     className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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