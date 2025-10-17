"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { User, Download } from 'lucide-react';
import type { WeddingMediaItem } from '@/Entities/WeddingMedia';
import VideoPreview from './VideoPreview';
import { logger } from '@/lib/logger';
import { downloadMedia } from '@/utils';
import { apiServices } from '@/services/api';

interface MediaItemWithSkeletonProps {
  item: WeddingMediaItem;
  index: number;
  onMediaClick: (item: WeddingMediaItem) => void;
}

export default function MediaItemWithSkeleton({ item, index, onMediaClick }: MediaItemWithSkeletonProps) {
  // const [showSkeleton, setShowSkeleton] = useState(true); // Not used anymore
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // Memoize proxied URLs to prevent excessive re-calculations and logging
  const proxiedImageUrl = useMemo(
    () => apiServices.imageProxy.getProxiedImageUrl(item.media_url),
    [item.media_url]
  );

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the media viewer
    if (isDownloading) return;
    
    logger.userAction('Download button clicked in MediaItemWithSkeleton', {
      mediaId: item.id,
      mediaType: item.media_type,
      mediaUrl: item.media_url,
      title: item.title,
      uploaderName: item.uploader_name,
      itemIndex: index,
      shouldLoad,
      mediaLoaded,
    });
    
    setIsDownloading(true);
    try {
      await downloadMedia(
        item.media_url,
        item.media_type,
        item.title,
        item.id
      );
      
      logger.userAction('Download completed successfully in MediaItemWithSkeleton', {
        mediaId: item.id,
        mediaType: item.media_type,
        title: item.title,
        downloadLocation: 'MediaItemWithSkeleton',
        itemIndex: index,
      });
    } catch (error) {
      logger.error('Download failed in MediaItemWithSkeleton', error instanceof Error ? error : new Error(String(error)), {
        mediaId: item.id,
        mediaType: item.media_type,
        mediaUrl: item.media_url,
        title: item.title,
        itemIndex: index,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      // Error already logged above with logger.error
    } finally {
      setIsDownloading(false);
    }
  };

  // Load ALL items immediately - no lazy loading for better UX
  useEffect(() => {
    setShouldLoad(true);
  }, []);

  // No need for preload strategy - all items load immediately

  // Track when media is actually loaded
  const handleMediaLoad = () => {
    setMediaLoaded(true);
  };

  const handleMediaError = () => {
    setMediaLoaded(true); // Still hide skeleton on error
  };

  return (
    <motion.div
      ref={elementRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group cursor-pointer w-full h-full"
      onClick={() => onMediaClick(item)}
    >
      <div className="relative overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 glass-effect w-full h-full border border-white/10">
        {/* Media Content */}
        <div className="relative w-full h-full">
          <AnimatePresence mode="wait">
            {false ? ( // Never show skeleton - content is preloaded
              // Enhanced Skeleton
              <motion.div
                key="skeleton"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full relative overflow-hidden"
                style={{ height: `${200 + (index % 3) * 50}px` }}
              >
                {/* Main skeleton background */}
                <div className="absolute inset-0 bg-gradient-to-br from-gold-100 to-cream-100 animate-pulse" />
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
                     style={{ 
                       animation: 'shimmer 2s infinite',
                       background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'
                     }} />
                
                {/* Loading indicator */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                </div>
                
                {/* Media type indicator */}
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 bg-white/60 rounded-full flex items-center justify-center">
                    {item.media_type === 'photo' ? (
                      <div className="w-3 h-3 bg-gold-400 rounded-sm" />
                    ) : (
                      <div className="w-3 h-3 bg-emerald-400 rounded-sm" />
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              // Actual Media - Preloaded, show immediately
              <motion.div
                key="media"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {item.media_type === 'photo' ? (
                  true ? ( // Always load photos immediately
                    <Image
                      src={proxiedImageUrl}
                      alt={item.title || "Wedding memory"}
                      width={500}
                      height={500}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading={index < 20 ? "eager" : "lazy"} // Only first 20 images load eagerly
                      priority={index < 10} // Priority for first 10 items only
                      decoding="async"
                      onLoad={handleMediaLoad}
                      onError={handleMediaError}
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-gold-100 to-cream-100 animate-pulse" />
                  )
                ) : (
                  true ? ( // Always load videos immediately
                    <VideoPreview
                      mp4Url={item.media_url}
                      posterUrl={item.thumbnail_url || undefined}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      fixedAspect={false}
                      showControls={false}
                      autoPlay={true}
                      onLoad={handleMediaLoad}
                      onError={handleMediaError}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-gold-100 to-cream-100 animate-pulse flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Download Button - Always visible on mobile, hover on desktop */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="absolute top-2 sm:top-3 right-2 sm:right-3 w-8 h-8 sm:w-9 sm:h-9 bg-white/30 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 disabled:opacity-50 shadow-lg"
          >
            <Download className={`w-4 h-4 ${isDownloading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Content Overlay - Better mobile visibility */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white bg-gradient-to-t from-black/80 via-black/50 to-transparent sm:transform sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-300">
          {item.title && (
            <p className="font-medium mb-1 sm:mb-2 text-xs sm:text-sm leading-relaxed line-clamp-2">
              {item.title}
            </p>
          )}
          {item.uploader_name && (
            <div className="flex items-center gap-1 sm:gap-2 text-xs opacity-90">
              <User className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">על ידי {item.uploader_name}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
