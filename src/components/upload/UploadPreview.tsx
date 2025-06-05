import { motion } from "framer-motion";
import { X, Image, Video, FileText, CircleEllipsis, CheckCircle2, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FileUploadState, UploadStatus } from "../../hooks/useBulkUploader";

interface UploadPreviewProps {
  uploads: FileUploadState[];
  onRemove: (index: number) => void;
}

export default function UploadPreview({ uploads, onRemove }: UploadPreviewProps) {
  const getFileIcon = (file: File): LucideIcon => {
    if (file.type.startsWith('image/')) return Image;
    if (file.type.startsWith('video/')) return Video;
    return FileText;
  };

  const getStatusIcon = (status: UploadStatus): LucideIcon => {
    switch (status) {
      case 'pending':
      case 'uploading':
        return CircleEllipsis;
      case 'success':
        return CheckCircle2;
      case 'error':
        return AlertCircle;
      default:
        return FileText;
    }
  };

  const getFilePreview = (file: File): string | null => {
    if (file.type.startsWith('image/')) {
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
      {uploads.map((upload, index) => {
        const FileIcon = getFileIcon(upload.file);
        const previewUrl = getFilePreview(upload.file);
        const StatusIcon = getStatusIcon(upload.status);

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: upload.status === 'error' ? 0.5 : 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative group"
          >
            <div className="bg-white rounded-2xl border-2 border-gold-200 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
              {/* Preview */}
              <div className="aspect-square bg-gradient-to-br from-cream-100 to-gold-100 relative overflow-hidden">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={upload.file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                
                {/* Remove Button (Visible only before upload starts) */}
                {upload.status === 'pending' && (
                   <Button
                     variant="ghost"
                     size="icon"
                     onClick={() => onRemove(index)}
                     className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                   >
                     <X className="w-4 h-4" />
                   </Button>
                )}

                {/* Status Badge */}
                <div className="absolute bottom-2 left-2">
                  <div className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${ upload.status === 'success' ? 'bg-emerald-600 text-white' : upload.status === 'error' ? 'bg-red-500 text-white' : 'bg-black/70 text-white'}`}>
                    <StatusIcon className="w-3 h-3" />
                    {upload.status === 'pending' && 'ממתין...'}
                    {upload.status === 'uploading' && `מעלה (${upload.progress}%)`}
                    {upload.status === 'success' && 'הועלה בהצלחה!'}
                    {upload.status === 'error' && 'שגיאה!'}
                  </div>
                </div>
              </div>

              {/* File Info */}
              <div className="p-3 space-y-1">
                <p className="font-medium text-gray-800 text-sm truncate" title={upload.file.name}>
                  {upload.file.name}
                </p>
                <p className="text-gray-500 text-xs">
                  {formatFileSize(upload.file.size)}
                </p>
                 {upload.status === 'error' && upload.error && (
                    <p className="text-xs text-red-500">שגיאה: {upload.error}</p>
                 )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}