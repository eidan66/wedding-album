import { motion } from "framer-motion";

export default function MediaSkeleton() {
  const skeletonItems = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
      {skeletonItems.map((item,index) => (
        <motion.div
          key={`${item}-${index}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="break-inside-avoid"
        >
          <div className="glass-effect rounded-2xl border border-gold-200 overflow-hidden">
            <div 
              className="w-full bg-gradient-to-br from-gold-100 to-cream-100 animate-pulse"
              style={{ height: `${Math.floor(Math.random() * 200) + 200}px` }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gold-300 border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gold-200 rounded animate-pulse" />
              <div className="h-3 bg-cream-200 rounded w-2/3 animate-pulse" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}