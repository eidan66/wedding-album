"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, User, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import type { WeddingMediaItem } from "@/Entities/WeddingMedia";
import VideoPreview from "./VideoPreview";
import { downloadMedia } from "@/utils";
import { apiServices } from "@/services/api";
import { logger } from "@/lib/logger";

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
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  // Memoize proxied URL to prevent excessive re-calculations
  const proxiedMediaUrl = useMemo(
    () => media?.media_url ? apiServices.imageProxy.getProxiedImageUrl(media.media_url) : '',
    [media?.media_url]
  );

  const handleDownload = async () => {
    if (!media || isDownloading) return;
    
    logger.userAction('Download button clicked in MediaViewer', {
      mediaId: media.id,
      mediaType: media.media_type,
      mediaUrl: media.media_url,
      title: media.title,
      uploaderName: media.uploader_name,
      currentIndex,
      totalCount,
    });
    
    setIsDownloading(true);
    try {
      await downloadMedia(
        media.media_url,
        media.media_type,
        media.title,
        media.id
      );
      
      logger.userAction('Download completed successfully in MediaViewer', {
        mediaId: media.id,
        mediaType: media.media_type,
        title: media.title,
        downloadLocation: 'MediaViewer',
      });
    } catch (error) {
      logger.error('Download failed in MediaViewer', error instanceof Error ? error : new Error(String(error)), {
        mediaId: media.id,
        mediaType: media.media_type,
        mediaUrl: media.media_url,
        title: media.title,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      // Error already logged above with logger.error
      // You could add a toast notification here
    } finally {
      setIsDownloading(false);
    }
  };

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

    if (isOpen) {
      // Save current scroll position
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      setScrollPosition(currentScroll);
      
      // Disable scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${currentScroll}px`;
      document.body.style.width = '100%';
      
      window.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      // Cleanup scroll prevention
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isOpen, onClose, onNavigate]);

  // Separate effect to handle scroll restoration only when viewer closes
  useEffect(() => {
    if (!isOpen && scrollPosition > 0) {
      // Re-enable scrolling and restore position only when closing
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      
      // Restore scroll position with requestAnimationFrame for smoother transition
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition);
      });
    }
  }, [isOpen, scrollPosition]);

  if (!media) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
          onClick={onClose}
        >
          {/* Navigation Buttons - Swapped for RTL */}
          {totalCount > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('prev');
                }}
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('next');
                }}
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </Button>
            </>
          )}

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 sm:top-4 left-2 sm:left-4 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm z-20"
            onClick={onClose}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </Button>

          {/* Download Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 sm:top-4 left-12 sm:left-16 md:left-20 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm z-20"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            disabled={isDownloading}
          >
            <Download className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${isDownloading ? 'animate-spin' : ''}`} />
          </Button>

          {/* Counter */}
          {totalCount > 1 && (
            <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-white text-[10px] sm:text-xs md:text-sm font-medium z-20">
              {currentIndex + 1} מתוך {totalCount}
            </div>
          )}

          {/* Media Content Container */}
          <div
            className="relative w-full max-w-screen-xl mx-auto flex flex-col items-center h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Media Content */}
            <motion.div
              key={media.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full h-auto flex items-center justify-center"
              style={{ 
                maxHeight: 'calc(100dvh - 220px)', // Reserve space for buttons and info
              }}
            >
              {media.media_type === 'photo' ? (
                <img
                  src={proxiedMediaUrl}
                  alt={media.title || "זיכרון מהחתונה"}
                  className="w-full h-full object-contain rounded-lg sm:rounded-2xl shadow-2xl"
                  style={{ maxHeight: 'calc(100dvh - 220px)' }}
                />
              ) : (
                <div 
                  className="w-full flex items-center justify-center" 
                  style={{ 
                    height: 'calc(100dvh - 220px)',
                    maxHeight: 'calc(100dvh - 220px)',
                  }}
                >
                  <VideoPreview
                    mp4Url={media.media_url}
                    posterUrl={media.thumbnail_url || undefined}
                    className="rounded-lg sm:rounded-2xl shadow-2xl"
                    fixedAspect={false}
                    showControls={true}
                    autoPlay={false}
                    onLoad={() => {
                      logger.info('Video loaded successfully in MediaViewer', {
                        mediaId: media.id,
                        mediaType: media.media_type,
                        videoUrl: media.media_url,
                        posterUrl: media.thumbnail_url,
                      });
                    }}
                    onError={() => {
                      logger.warn('Video failed to load in MediaViewer', {
                        mediaId: media.id,
                        mediaType: media.media_type,
                        videoUrl: media.media_url,
                        posterUrl: media.thumbnail_url,
                      });
                    }}
                  />
                </div>
              )}
            </motion.div>

            {/* Media Info - Below the media */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full mt-2 sm:mt-4 bg-black/50 backdrop-blur-md border border-white/10 rounded-lg sm:rounded-2xl p-3 sm:p-6 shadow-xl"
            >
              <div className="text-white space-y-2 sm:space-y-3 w-full">
                {media.title && (
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold leading-relaxed break-words">
                    {media.title}
                  </h3>
                )}
                
                <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-4 text-xs sm:text-sm text-white/90 w-full">
                  {media.uploader_name && (
                    <div className="flex items-center gap-2 min-w-0 flex-shrink">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 text-white/80" />
                      <span className="break-words">שותף על ידי {media.uploader_name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 min-w-0 flex-shrink">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 text-white/80" />
                    <span className="break-words">{format(new Date(media.created_date), "d MMMM yyyy 'בשעה' H:mm", { locale: he })}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}