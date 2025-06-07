import { useState, useEffect, useRef } from "react";
import { WeddingMedia } from "@/Entities/WeddingMedia";
import type { WeddingMediaItem } from "@/Entities/WeddingMedia";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Heart, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import MediaGrid from "../components/gallery/MediaGrid";
import MediaViewer from "../components/gallery/MediaViewer";
import FilterTabs from "../components/gallery/FilterTabs";
import GalleryHeader from "../components/gallery/GalleryHeader";
import MediaSkeleton from "../components/gallery/MediaSkeleton";

const ITEMS_PER_PAGE = 20; // Define items per page

export const Gallery = () => {
  const [media, setMedia] = useState<WeddingMediaItem[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true); // Loading state for initial load
  const [isLoadingMore, setIsLoadingMore] = useState(false); // Loading state for infinite scroll
  const [page, setPage] = useState(1); // Current page number
  const [hasMore, setHasMore] = useState(true); // Flag to indicate if there are more items to load
  const [selectedMedia, setSelectedMedia] = useState<WeddingMediaItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "photo" | "video">("all");
  const [viewerIndex, setViewerIndex] = useState(0);

  const loader = useRef(null); // Ref for the loading indicator element

  // Function to fetch media with pagination
  const fetchMedia = async (pageToLoad: number) => {
    if (pageToLoad === 1) {
      setIsLoadingInitial(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      // Pass page and limit to the list function
      const fetchedMedia = await WeddingMedia.list("-created_date", pageToLoad, ITEMS_PER_PAGE);
      
      if (pageToLoad === 1) {
        setMedia(fetchedMedia);
      } else {
        setMedia(prevMedia => [...prevMedia, ...fetchedMedia]);
      }

      // Determine if there are more items based on the number of items fetched
      // The server should ideally return a total count or a 'hasMore' flag.
      // For now, assuming if we get less than ITEMS_PER_PAGE, there are no more.
      setHasMore(fetchedMedia.length === ITEMS_PER_PAGE);
      setPage(pageToLoad);

    } catch (error) {
      console.error("Error loading media:", error);
      // Optionally set an error state to display to the user
      setHasMore(false); // Stop trying to load more on error
    }
    
    setIsLoadingInitial(false);
    setIsLoadingMore(false);
  };

  // Initial load
  useEffect(() => {
    fetchMedia(1);
  }, []); // Empty dependency array means this runs once on mount

  // Infinite scrolling logic
  useEffect(() => {
    const options = {
      root: null, // Use the viewport as the root
      rootMargin: "20px", // Load when the loader is within 20px of the viewport
      threshold: 1.0 // Trigger when 100% of the loader is visible
    };

    const observer = new IntersectionObserver((entities) => {
      const target = entities[0];
      // Check if target exists and is intersecting
      if (target && target.isIntersecting && hasMore && !isLoadingInitial && !isLoadingMore) {
        fetchMedia(page + 1);
      }
    }, options);

    // Start observing the loader element
    if (loader.current) {
      observer.observe(loader.current);
    }

    // Clean up the observer on component unmount
    return () => {
      if (loader.current) {
        observer.unobserve(loader.current);
      }
    };
  }, [hasMore, isLoadingInitial, isLoadingMore, page]); // Re-run effect if these dependencies change

  // Filtering logic remains the same, but it now filters the accumulating 'media' state
  const filteredMedia = media.filter(item => {
    if (activeFilter === "all") return true;
    return item.media_type === activeFilter;
  });

  const openViewer = (mediaItem: WeddingMediaItem) => {
    const index = filteredMedia.findIndex(item => item.id === mediaItem.id);
    setViewerIndex(index);
    setSelectedMedia(mediaItem);
  };

  const closeViewer = () => {
    setSelectedMedia(null);
  };

  const navigateViewer = (direction: "next" | "prev") => {
    const newIndex = direction === "next" 
      ? (viewerIndex + 1) % filteredMedia.length
      : (viewerIndex - 1 + filteredMedia.length) % filteredMedia.length;
    
    const newMedia = filteredMedia[newIndex];
    if (newMedia) {
      setViewerIndex(newIndex);
      setSelectedMedia(newMedia);
    }
  };

  return (
    <div className="min-h-screen wedding-gradient">
      <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
        {/* Hero Section */}
        <GalleryHeader mediaCount={media.length} />

        {/* Filters & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <FilterTabs 
            activeFilter={activeFilter} 
            onFilterChange={setActiveFilter}
            media={media}
          />
          
          <Link to={createPageUrl("Upload")}>
            <Button className="hidden sm:inline-flex bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 group">
              <Plus className="w-4 h-4 ml-2 group-hover:rotate-90 transition-transform duration-300" />
              שתפו את הזיכרון שלכם
            </Button>
          </Link>
        </div>

        {/* Media Grid */}
        <AnimatePresence mode="wait">
          {isLoadingInitial ? (
            <MediaSkeleton />
          ) : filteredMedia.length > 0 ? (
            <MediaGrid 
              media={filteredMedia} 
              onMediaClick={openViewer}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
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
              <Link to={createPageUrl("Upload")}>
                <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white">
                  שתפו את הזיכרון הראשון
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading indicator for infinite scroll */}
        {isLoadingMore && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        )}

        {/* Element to observe for infinite scrolling */}
        {hasMore && !isLoadingInitial && !isLoadingMore && filteredMedia.length > 0 && (
          <div ref={loader} className="h-1"></div> // Small, invisible element at the bottom
        )}

        {/* Media Viewer Modal */}
        <MediaViewer
          media={selectedMedia}
          isOpen={!!selectedMedia}
          onClose={closeViewer}
          onNavigate={navigateViewer}
          currentIndex={viewerIndex}
          totalCount={filteredMedia.length}
        />
      </div>
    </div>
  );
}