import { motion } from "framer-motion";
import { Play, Heart, User } from "lucide-react";
import type { WeddingMediaItem } from "@/Entities/WeddingMedia";

interface MediaGridProps {
  media: WeddingMediaItem[];
  onMediaClick: (item: WeddingMediaItem) => void;
}

export default function MediaGrid({ media, onMediaClick }: MediaGridProps) {
  return (
    <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
      {media.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="break-inside-avoid group cursor-pointer"
          onClick={() => onMediaClick(item)}
        >
          <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 glass-effect border border-gold-200 group-hover:border-emerald-300">
            {/* Media Content */}
            <div className="relative">
              {item.media_type === 'photo' ? (
                <img
                  src={item.media_url}
                  alt={item.title || "Wedding memory"}
                  className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
              ) : (
                <div className="relative">
                  <img
                    src={item.thumbnail_url || item.media_url}
                    alt={item.title || "Video thumbnail"}
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors duration-300">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-8 h-8 text-emerald-600 ml-1" />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              {item.title && (
                <p className="font-medium mb-2 text-sm leading-relaxed">
                  {item.title}
                </p>
              )}
              {item.uploader_name && (
                <div className="flex items-center gap-2 text-xs opacity-90">
                  <User className="w-3 h-3" />
                  <span>by {item.uploader_name}</span>
                </div>
              )}
            </div>

            {/* Love Heart Effect */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                <Heart className="w-4 h-4 text-red-500" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}