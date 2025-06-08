import { motion } from "framer-motion";
import { Camera, Video, Grid3X3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MediaItem {
  id: string;
  media_type: 'photo' | 'video';
  media_url: string;
  title?: string;
  uploader_name?: string;
  created_date: string;
}

interface FilterTabsProps {
  activeFilter: 'all' | 'photo' | 'video';
  onFilterChange: (filter: 'all' | 'photo' | 'video') => void;
  media: MediaItem[];
}

interface FilterOption {
  id: 'all' | 'photo' | 'video';
  label: string;
  icon: LucideIcon;
  count: number;
}

export default function FilterTabs({ activeFilter, onFilterChange, media }: FilterTabsProps) {
  const photoCount = media.filter(item => item.media_type === 'photo').length;
  const videoCount = media.filter(item => item.media_type === 'video').length;

  const filters: FilterOption[] = [
    { id: 'all', label: 'כל הזכרונות', icon: Grid3X3, count: media.length },
    { id: 'photo', label: 'תמונות', icon: Camera, count: photoCount },
    { id: 'video', label: 'סרטונים', icon: Video, count: videoCount },
  ];

  return (
    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
      {filters.map((filter, index) => (
        <motion.button
          key={`${filter.id}-${index}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onFilterChange(filter.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-300 ${
            activeFilter === filter.id
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg'
              : 'bg-white/70 text-gray-700 hover:bg-gold-100 border border-gold-200'
          } ${
            filter.id === 'all' 
              ? 'w-full sm:w-auto' 
              : 'w-[calc(50%-0.25rem)] sm:w-auto'
          } justify-center sm:justify-start`}
        >
          <filter.icon className="w-4 h-4" />
          <span>{filter.label}</span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            activeFilter === filter.id
              ? 'bg-white/20 text-white'
              : 'bg-gold-200 text-gold-700'
          }`}>
            {filter.count}
          </span>
        </motion.button>
      ))}
    </div>
  );
}