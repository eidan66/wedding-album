"use client";
import type { WeddingMediaItem } from "@/Entities/WeddingMedia";
import MediaItemWithSkeleton from "./MediaItemWithSkeleton";
import { ResponsiveMasonry } from "react-responsive-masonry";
import Masonry from "react-responsive-masonry";

interface MediaGridProps {
  media: WeddingMediaItem[];
  onMediaClick: (item: WeddingMediaItem) => void;
}

export default function MediaGrid({ media, onMediaClick }: MediaGridProps) {
  return (
    <ResponsiveMasonry
      columnsCountBreakPoints={{ 350: 1, 700: 2, 1024: 4 }}
    >
      <Masonry gutter="20px">
        {media.map((item, index) => (
          <MediaItemWithSkeleton
            key={`${item.id}-${index}`}
            item={item}
            index={index}
            onMediaClick={onMediaClick}
          />
        ))}
      </Masonry>
    </ResponsiveMasonry>
  );
}