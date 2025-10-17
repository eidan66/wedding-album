"use client";

import { useCallback, useMemo, useEffect, useRef, useState } from "react";
import { useInfiniteMediaList, useAllMediaCounts } from "@/hooks/useMediaQueries";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import Link from "next/link";
import MediaGrid from "./MediaGrid";
import MediaViewer from "./MediaViewer";
import FilterTabs from "./FilterTabs";
import GalleryHeader from "./GalleryHeader";
import { ShareFAB } from "@/components/ui/ShareFAB";
import type { WeddingMediaItem } from "@/Entities/WeddingMedia";

const ITEMS_PER_PAGE = 50;

export default function GalleryWithReactQuery() {
  const [selectedMedia, setSelectedMedia] = useState<WeddingMediaItem | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // React Query Infinite Query - הדרך המומלצת!
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteMediaList({
    sort: "-created_date",
    limit: ITEMS_PER_PAGE,
    type: undefined,
  });

  const { all: totalCount, photos: photoCount, videos: videoCount } = useAllMediaCounts();

  // Flatten all pages into a single array - TanStack Query מנהל את זה אוטומטית!
  const media = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.items as WeddingMediaItem[]);
  }, [data?.pages]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        
        // Load more when the trigger element is visible
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        root: null,
        rootMargin: '100px', // התחל לטעון קצת לפני שמגיעים לתחתית
        threshold: 0.1,
      }
    );
    
    if (loadMoreTriggerRef.current) {
      observer.observe(loadMoreTriggerRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const openViewer = useCallback((mediaItem: WeddingMediaItem) => {
    setSelectedMedia(mediaItem);
    setViewerIndex(media.findIndex(item => item.id === mediaItem.id));
  }, [media]);

  const closeViewer = useCallback(() => {
    setSelectedMedia(null);
    setViewerIndex(0);
  }, []);

  const navigateViewer = useCallback((direction: "next" | "prev") => {
    if (!selectedMedia) return;
    const currentIndex = media.findIndex(item => item.id === selectedMedia.id);
    const newIndex = direction === "next" 
      ? (currentIndex === media.length - 1 ? 0 : currentIndex + 1) 
      : (currentIndex === 0 ? media.length - 1 : currentIndex - 1);
    setSelectedMedia(media[newIndex]);
    setViewerIndex(newIndex);
  }, [selectedMedia, media]);

  // Filter change disabled - always show "all"
  // const handleFilterChange = useCallback((filter: "all" | "photo" | "video") => {
  //   setActiveFilter(filter);
  // }, []);

  return (
    <div className="min-h-screen wedding-gradient">
      <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 py-6 sm:py-8 pb-24 md:pb-8">
        <GalleryHeader mediaCount={totalCount} />

        {/* Upload Button - Prominent and Always Visible */}
        <div className="mb-6 sm:mb-8">
          <Link href={createPageUrl("Upload")}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto"
            >
              <Button className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 group text-base sm:text-lg font-semibold py-4 sm:py-3 px-6 sm:px-8">
                <Plus className="w-5 h-5 sm:w-4 sm:h-4 ml-2 group-hover:rotate-90 transition-transform duration-300" />
                שתפו את הזיכרון שלכם
              </Button>
            </motion.div>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <FilterTabs 
            media={media}
            totalAll={totalCount}
            totalPhotos={photoCount}
            totalVideos={videoCount}
          />
          
          {/* Hidden on mobile since we have the prominent button above */}
          <Link href={createPageUrl("Upload")}>
            <Button className="hidden lg:inline-flex bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 group">
              <Plus className="w-4 h-4 ml-2 group-hover:rotate-90 transition-transform duration-300" />
              שתפו את הזיכרון שלכם
            </Button>
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="relative overflow-hidden rounded-2xl shadow-lg glass-effect border border-gold-200">
                  <div 
                    className="w-full bg-gradient-to-br from-gold-100 to-cream-100 animate-pulse"
                    style={{ height: `${200 + (i % 3) * 50}px` }}
                  />
                </div>
              ))}
            </div>
          ) : media.length > 0 ? (
            <>
              <MediaGrid media={media} onMediaClick={openViewer} />
              
              {/* Infinite Scroll Trigger */}
              {hasNextPage && (
                <div ref={loadMoreTriggerRef} className="flex justify-center mt-6 sm:mt-8 py-6 sm:py-8">
                  {isFetchingNextPage ? (
                    <div className="flex items-center gap-2 text-gold-600">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-xs sm:text-sm font-medium">טוען עוד זכרונות...</span>
                    </div>
                  ) : (
                    <div className="text-xs sm:text-sm text-gray-500">
                      גלול למטה לעוד זכרונות...
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8 sm:py-12 px-4"
            >
              <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-gold-100 to-cream-100 rounded-full flex items-center justify-center">
                <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-gold-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">
                אין זכרונות עדיין
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto">
                היו הראשונים לשתף זיכרון יפה מהיום המיוחד הזה!
              </p>
              <Link href={createPageUrl("Upload")}>
                <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-sm sm:text-base">
                  שתפו את הזיכרון הראשון
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <MediaViewer
        isOpen={!!selectedMedia}
        onClose={closeViewer}
        media={selectedMedia}
        onNavigate={navigateViewer}
        currentIndex={viewerIndex}
        totalCount={media.length}
      />

      {/* Floating Action Button for Mobile */}
      <ShareFAB />
    </div>
  );
}
