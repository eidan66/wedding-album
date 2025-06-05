import { useState, useEffect } from "react";
import { WeddingMedia } from "@/Entities/WeddingMedia";
import type { WeddingMediaItem } from "@/Entities/WeddingMedia";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import MediaGrid from "../components/gallery/MediaGrid";
import MediaViewer from "../components/gallery/MediaViewer";
import FilterTabs from "../components/gallery/FilterTabs";
import GalleryHeader from "../components/gallery/GalleryHeader";
import MediaSkeleton from "../components/gallery/MediaSkeleton";

export const Gallery = () => {
  const [media, setMedia] = useState<WeddingMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<WeddingMediaItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "photo" | "video">("all");
  const [viewerIndex, setViewerIndex] = useState(0);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    setIsLoading(true);
    try {
      const fetchedMedia = await WeddingMedia.list("-created_date");
      setMedia(fetchedMedia);
    } catch (error) {
      console.error("Error loading media:", error);
    }
    setIsLoading(false);
  };

  const filteredMedia = media.filter(item => {
    console.log("Value of media before filter:", media);
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
            <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 group">
              <Plus className="w-4 h-4 ml-2 group-hover:rotate-90 transition-transform duration-300" />
              שתפו את הזיכרון שלכם
            </Button>
          </Link>
        </div>

        {/* Media Grid */}
        <AnimatePresence mode="wait">
          {isLoading ? (
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