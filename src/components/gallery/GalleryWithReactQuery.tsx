"use client";

import { useState, useCallback, useMemo } from "react";
import { useMediaList, useAllMediaCounts, usePrefetchNextPage } from "@/hooks/useMediaQueries";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import Link from "next/link";
import MediaGrid from "./MediaGrid";
import MediaViewer from "./MediaViewer";
import FilterTabs from "./FilterTabs";
import GalleryHeader from "./GalleryHeader";
import type { WeddingMediaItem } from "@/Entities/WeddingMedia";

const ITEMS_PER_PAGE = 20;

export default function GalleryWithReactQuery() {
  const [page, setPage] = useState(1);
  const [activeFilter] = useState<"all" | "photo" | "video">("all");
  const [selectedMedia, setSelectedMedia] = useState<WeddingMediaItem | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);

  // React Query hooks
  const { data: mediaData, isLoading, error } = useMediaList({
    sort: "-created_date",
    page,
    limit: ITEMS_PER_PAGE,
    type: activeFilter === "all" ? undefined : activeFilter,
  });

  const { all: totalCount, photos: photoCount, videos: videoCount } = useAllMediaCounts();
  const prefetchNextPage = usePrefetchNextPage();

  // Extract media items from paginated response
  const media = useMemo(() => (mediaData?.items || []) as WeddingMediaItem[], [mediaData?.items]);
  const hasMore = mediaData?.hasMore ?? false;
  const isFetchingNextPage = false; // Simple pagination, not infinite scroll

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

  // Filter functionality disabled - keeping for future use
  // const handleFilterChange = useCallback((filter: "all" | "photo" | "video") => {
  //   setActiveFilter(filter);
  //   setPage(1); // Reset to first page when filtering
  // }, []);

  const loadMore = useCallback(() => {
    if (hasMore && !isFetchingNextPage) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, isFetchingNextPage]);

  // Prefetch next page when user scrolls near bottom
  const handleScroll = useCallback(() => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    if (scrollPercentage > 0.8) {
      prefetchNextPage({
        sort: "-created_date",
        page: page + 1,
        limit: ITEMS_PER_PAGE,
        type: activeFilter === "all" ? undefined : activeFilter,
      });
    }
  }, [page, activeFilter, prefetchNextPage]);

  // Add scroll listener
  useState(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  if (error) {
    return (
      <div className="min-h-screen wedding-gradient flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">שגיאה בטעינת הגלריה</h2>
          <p className="text-gray-600">{error.message}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            נסה שוב
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen wedding-gradient">
      <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <GalleryHeader mediaCount={totalCount} />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <FilterTabs 
            media={media}
            totalAll={totalCount}
            totalPhotos={photoCount}
            totalVideos={videoCount}
          />
          
          <Link href={createPageUrl("Upload")}>
            <Button className="hidden sm:inline-flex bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 group">
              <Plus className="w-4 h-4 ml-2 group-hover:rotate-90 transition-transform duration-300" />
              שתפו את הזיכרון שלכם
            </Button>
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
              
              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <Button
                    onClick={loadMore}
                    disabled={isFetchingNextPage}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        טוען עוד...
                      </>
                    ) : (
                      'טען עוד זכרונות'
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-0"
            >
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-gold-100 to-cream-100 rounded-full flex items-center justify-center">
                <Heart className="w-16 h-16 text-gold-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                {activeFilter === "all" ? "אין זכרונות עדיין" : `אין ${activeFilter === "photo" ? "תמונות" : "סרטונים"} עדיין`}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                היו הראשונים לשתף זיכרון יפה מהיום המיוחד הזה!
              </p>
              <Link href={createPageUrl("Upload")}>
                <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white">
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
    </div>
  );
}
