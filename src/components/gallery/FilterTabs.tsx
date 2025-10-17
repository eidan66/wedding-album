"use client";
import { motion } from "framer-motion";
import { Grid3X3 } from "lucide-react";

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
  totalAll?: number;
  totalPhotos?: number;
  totalVideos?: number;
}

// interface FilterOption {
//   id: 'all' | 'photo' | 'video';
//   label: string;
//   icon: LucideIcon;
//   count: number;
// }

export default function FilterTabs({ media, totalAll, totalPhotos, totalVideos }: Omit<FilterTabsProps, 'activeFilter' | 'onFilterChange'>) {
  const photoCount = totalPhotos ?? media.filter(item => item.media_type === 'photo').length;
  const videoCount = totalVideos ?? media.filter(item => item.media_type === 'video').length;
  const allCount = totalAll ?? (photoCount + videoCount);

  // const filters: FilterOption[] = [
  //   { id: 'all', label: 'כל הזכרונות', icon: Grid3X3, count: allCount },
  //   { id: 'photo', label: 'תמונות', icon: Camera, count: photoCount },
  //   { id: 'video', label: 'סרטונים', icon: Video, count: videoCount },
  // ];

  // FILTERS DISABLED - Show only "All" option
  return (
    <div className="flex flex-wrap gap-2 justify-center sm:justify-start w-full sm:w-auto">
      {/* Show only "All" filter - others commented out */}
      <motion.div
        className="flex items-center gap-2 text-white w-full sm:w-auto justify-center text-base sm:text-lg"
      >
        <Grid3X3 className="w-5 h-5" />
        <span className="font-medium">כל הזכרונות</span>
        <span className="text-sm text-white/80">
          ({allCount})
        </span>
      </motion.div>
      
      {/* Commented out other filters
      {filters.map((filter, index) => (
        <motion.button
          key={`${filter.id}-${index}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onFilterChange(filter.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-300 ${
            activeFilter === filter.id
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg border border-white/40 dark:bg-transparent dark:text-emerald-300 dark:border dark:border-emerald-500 dark:shadow-none'
              : 'bg-white/70 text-emerald-700 hover:bg-gold-100 border border-gold-200 dark:bg-transparent dark:text-slate-300 dark:border-slate-600 dark:hover:bg-transparent'
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
              ? 'bg-white/20 text-white dark:bg-transparent dark:text-emerald-300 dark:border dark:border-white-600'
              : 'bg-white/20 text-gold-700 dark:bg-transparent dark:text-slate-300 dark:border dark:border-slate-600'
          }`}>
            {filter.count}
          </span>
        </motion.button>
      ))}
      */}
    </div>
  );
}