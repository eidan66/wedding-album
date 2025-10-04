"use client";

import { useState, useEffect, useCallback } from "react";
import type { WeddingMediaItem } from "@/Entities/WeddingMedia";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Heart, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from "@/lib/logger";
import { apiServices } from "@/services/api";

import { createPageUrl } from "@/utils";
import MediaGrid from "@/components/gallery/MediaGrid";
import MediaViewer from "@/components/gallery/MediaViewer";
import FilterTabs from "@/components/gallery/FilterTabs";
import GalleryHeader from "@/components/gallery/GalleryHeader";

  const ITEMS_PER_PAGE = 50;

export default function GalleryPage() {
  const [media, setMedia] = useState<WeddingMediaItem[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<WeddingMediaItem | null>(null);
  // const [activeFilter, setActiveFilter] = useState<"all" | "photo" | "video">("all");
  const activeFilter = "all"; // Fixed to show all items
  const [viewerIndex, setViewerIndex] = useState(0);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [totals, setTotals] = useState<{ all?: number; photos?: number; videos?: number }>({});
  // Log page load (only once)
  useEffect(() => {
    logger.info('Gallery page loaded', {
      component: 'GalleryPage',
      timestamp: new Date().toISOString(),
    });
  }, []); // Empty dependency array ensures this runs only once

  // No loader ref needed - all items load immediately

  const fetchMedia = useCallback(async (pageToLoad: number, filterType?: 'photo' | 'video') => {
    logger.info('Fetching media data', {
      component: 'GalleryPage',
      page: pageToLoad,
      itemsPerPage: ITEMS_PER_PAGE,
      filterType,
    });
    
    if (pageToLoad === 1) {
      setIsLoadingInitial(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      // Use the new API service with type filtering
      const data = await apiServices.media.getMediaList({
        sort: 'created_date',
        page: pageToLoad,
        limit: ITEMS_PER_PAGE,
        type: filterType, // Pass the filter type to API
      });

      logger.info('Media data fetched successfully', {
        component: 'GalleryPage',
        page: pageToLoad,
        itemsCount: data.items.length,
        filterType,
      });

      console.log('Raw API data:', {
        page: pageToLoad,
        filterType,
        totalItems: data.items.length,
        items: data.items,
        videoItems: data.items.filter((item: unknown) => (item as {type: string}).type === 'video'),
        imageItems: data.items.filter((item: unknown) => (item as {type: string}).type === 'image')
      });
      
      const mappedMedia: WeddingMediaItem[] = data.items.map((item: unknown) => {
          const mappedItem = {
          id: (item as {id: string}).id,
          media_url: (item as {url: string}).url,
          media_type: ((item as {type: string}).type === 'image' ? 'photo' : (item as {type: string}).type === 'video' ? 'video' : 'photo') as 'photo' | 'video',
          title: (item as {title?: string}).title || '',
          uploader_name: (item as {uploader_name?: string}).uploader_name || 'אורח אנונימי',
          created_date: (item as {created_date?: string}).created_date || new Date().toISOString(),
          thumbnail_url: (item as {thumbnail_url?: string}).thumbnail_url,
        };
        console.log('Mapped item:', mappedItem);
        return mappedItem;
      });

      if (pageToLoad === 1) {
        setMedia(mappedMedia);
      } else {
        // Preserve scroll position when adding new media
        const currentScrollPosition = window.pageYOffset;
        setMedia(prevMedia => [...prevMedia, ...mappedMedia]);
        
        // Restore scroll position after state update
        requestAnimationFrame(() => {
          window.scrollTo(0, currentScrollPosition);
        });
      }

      // Prefer server hasMore; fallback: if page returned a full page, assume more
      const anyData = data as unknown as { hasMore?: boolean };
      const more = typeof anyData.hasMore === 'boolean' ? anyData.hasMore : (mappedMedia.length === ITEMS_PER_PAGE);
      setHasMore(more);
      setPage(pageToLoad);

    } catch (error) {
      console.error("Error loading media:", error);
      setHasMore(false);
    }

    setIsLoadingInitial(false);
    setIsLoadingMore(false);
  }, []);

  useEffect(() => {
    fetchMedia(1); // Load all media initially
    // Fetch total counts independently
    Promise.all([
      fetch('/api/media/count').then(r=>r.json()).catch(()=>({})),
      fetch('/api/media/count?type=photo').then(r=>r.json()).catch(()=>({})),
      fetch('/api/media/count?type=video').then(r=>r.json()).catch(()=>({})),
    ]).then(([all, photos, videos]) => {
      if (typeof all.total === 'number') setTotalCount(all.total);
      setTotals({
        all: typeof all.total === 'number' ? all.total : undefined,
        photos: typeof photos.total === 'number' ? photos.total : undefined,
        videos: typeof videos.total === 'number' ? videos.total : undefined,
      });
    });
  }, [fetchMedia]);



  // Load all items immediately - no intersection observer needed
  useEffect(() => {
    // Load all available pages immediately
    const loadAllPages = async () => {
      let currentPage = 1;
      let hasMorePages = true;
      
      while (hasMorePages && !isLoadingInitial) {
        const apiFilterType = activeFilter === 'all' ? undefined : activeFilter;
        try {
          const data = await apiServices.media.getMediaList({
            sort: 'created_date',
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            type: apiFilterType,
          });

          if (data.items.length === 0) {
            hasMorePages = false;
            break;
          }

          const mappedMedia: WeddingMediaItem[] = data.items.map((item: unknown) => ({
            id: (item as {id: string}).id,
            media_url: (item as {url: string}).url,
            media_type: ((item as {type: string}).type === 'image' ? 'photo' : (item as {type: string}).type === 'video' ? 'video' : 'photo') as 'photo' | 'video',
            title: (item as {title?: string}).title || '',
            uploader_name: (item as {uploader_name?: string}).uploader_name || 'אורח אנונימי',
            created_date: (item as {created_date?: string}).created_date || new Date().toISOString(),
            thumbnail_url: (item as {thumbnail_url?: string}).thumbnail_url,
          }));

          if (currentPage === 1) {
            setMedia(mappedMedia);
          } else {
            setMedia(prevMedia => [...prevMedia, ...mappedMedia]);
          }

          // Check if there are more pages
          const anyData = data as unknown as { hasMore?: boolean };
          hasMorePages = typeof anyData.hasMore === 'boolean' ? anyData.hasMore : (mappedMedia.length === ITEMS_PER_PAGE);
          
          currentPage++;
          
          // Small delay to prevent overwhelming the browser
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error("Error loading page:", currentPage, error);
          hasMorePages = false;
        }
      }
      
      setHasMore(false);
      setIsLoadingInitial(false);
    };

    // Only load all pages if we're not already loading
    if (!isLoadingInitial && hasMore) {
      loadAllPages();
    }
  }, [activeFilter, isLoadingInitial, hasMore]);

  const openViewer = (mediaItem: WeddingMediaItem) => {
    setSelectedMedia(mediaItem);
    setViewerIndex(media.findIndex(item => item.id === mediaItem.id));
  };

  const closeViewer = () => {
    setSelectedMedia(null);
    setViewerIndex(0);
  };

  const navigateViewer = (direction: "next" | "prev") => {
    if (!selectedMedia) return;
    const currentIndex = media.findIndex(item => item.id === selectedMedia.id);
    const newIndex = direction === "next" ? (currentIndex === media.length - 1 ? 0 : currentIndex + 1) : (currentIndex === 0 ? media.length - 1 : currentIndex - 1);
    setSelectedMedia(media[newIndex]);
    setViewerIndex(newIndex);
  };

  // No need for frontend filtering since API handles it
  const filteredMedia = media;
    
  console.log('Current state:', {
    activeFilter,
    totalMedia: media.length,
    mediaTypes: media.map(item => item.media_type)
  });

  // Handle filter change with API call - DISABLED
  // const handleFilterChange = useCallback((filter: "all" | "photo" | "video") => {
  //   logger.userAction('Filter changed', {
  //     component: 'GalleryPage',
  //     newFilter: filter,
  //     previousFilter: activeFilter,
  //   });
    
  //   setActiveFilter(filter);
    
  //   // Reset pagination and fetch new data based on filter
  //   setPage(1);
  //   setHasMore(true);
    
  //   // Convert filter to API type parameter
  //   const apiFilterType = filter === 'all' ? undefined : filter;
  //   fetchMedia(1, apiFilterType);
  // }, [activeFilter, fetchMedia]);
  

  return (
    <div className="min-h-screen wedding-gradient">
      <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <GalleryHeader 
          mediaCount={totalCount ?? media.length} 
        />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <FilterTabs 
            media={media}
            totalAll={totals.all}
            totalPhotos={totals.photos}
            totalVideos={totals.videos}
          />
          
          <Link href={createPageUrl("Upload")}>
            <Button className="hidden sm:inline-flex bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 group">
              <Plus className="w-4 h-4 ml-2 group-hover:rotate-90 transition-transform duration-300" />
              שתפו את הזיכרון שלכם
            </Button>
          </Link>
        </div>



        <AnimatePresence mode="wait">
          {isLoadingInitial ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="relative overflow-hidden rounded-2xl shadow-lg glass-effect border border-gold-200">
                  <div 
                    className="w-full bg-gradient-to-br from-gold-100 to-cream-100 animate-pulse"
                    style={{ height: `${200 + (i % 3) * 50}px` }}
                  >
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
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMedia.length > 0 ? (
            <>
              <MediaGrid 
                media={filteredMedia} 
                onMediaClick={openViewer}
              />
              {/* Loading skeleton for additional items */}
              {isLoadingMore && (
                <div className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }, (_, i) => (
                      <div key={`loading-${i}`} className="relative overflow-hidden rounded-2xl shadow-lg glass-effect border border-gold-200">
                        <div 
                          className="w-full bg-gradient-to-br from-gold-100 to-cream-100 animate-pulse"
                          style={{ height: `${200 + (i % 3) * 50}px` }}
                        >
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
                               style={{ 
                                 animation: 'shimmer 2s infinite',
                                 background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'
                               }} />
                          
                          {/* Loading indicator */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
                              <div className="w-4 h-4 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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

        {isLoadingMore && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <div className="relative">
              {/* Background circle */}
              <div className="w-16 h-16 bg-gradient-to-br from-gold-100 to-cream-100 rounded-full flex items-center justify-center shadow-lg border border-gold-200">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full animate-shimmer" 
                   style={{ 
                     animation: 'shimmer 2s infinite',
                     background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)'
                   }} />
            </div>
            <p className="mt-4 text-gray-600 text-sm font-medium">טוען זכרונות נוספים...</p>
          </motion.div>
        )}

        {/* No loader needed - all items load immediately */}
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