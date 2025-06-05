import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import type { WeddingMediaItem } from "@/Entities/WeddingMedia";

interface MediaViewerProps {
  media: WeddingMediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: "next" | "prev") => void;
  currentIndex: number;
  totalCount: number;
}

export default function MediaViewer({ 
  media, 
  isOpen, 
  onClose, 
  onNavigate, 
  currentIndex, 
  totalCount 
}: MediaViewerProps) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          // RTL: Left arrow goes to next
          onNavigate('next');
          break;
        case 'ArrowRight':
          // RTL: Right arrow goes to previous
          onNavigate('prev');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose, onNavigate]);

  if (!media) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Navigation Buttons - Swapped for RTL */}
          {totalCount > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('prev');
                }}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('next');
                }}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
            </>
          )}

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 w-12 h-12 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Counter */}
          {totalCount > 1 && (
            <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-white text-sm font-medium">
              {currentIndex + 1} מתוך {totalCount}
            </div>
          )}

          {/* Media Content */}
          <motion.div
            key={media.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative max-w-5xl max-h-[80vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {media.media_type === 'photo' ? (
              <img
                src={media.media_url}
                alt={media.title || "זיכרון מהחתונה"}
                className="w-full h-full object-contain rounded-2xl shadow-2xl"
              />
            ) : (
              <video
                src={media.media_url}
                controls
                className="w-full h-full object-contain rounded-2xl shadow-2xl"
                autoPlay
              />
            )}

            {/* Media Info */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-2xl"
            >
              <div className="text-white space-y-2">
                {media.title && (
                  <h3 className="text-lg font-semibold leading-relaxed">
                    {media.title}
                  </h3>
                )}
                
                <div className="flex items-center gap-4 text-sm opacity-90 flex-wrap">
                  {media.uploader_name && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>שותף על ידי {media.uploader_name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(media.created_date), "d MMMM yyyy 'בשעה' H:mm", { locale: he })}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}