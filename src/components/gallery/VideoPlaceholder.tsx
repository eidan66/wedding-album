"use client";
import { Video } from "lucide-react";

interface VideoPlaceholderProps {
  className?: string;
  showLabel?: boolean;
}

export default function VideoPlaceholder({ 
  className = "", 
  showLabel = true 
}: VideoPlaceholderProps) {
  return (
    <div className={`bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${className}`}>
      <div className="text-center">
        <Video className="w-16 h-16 text-gray-400 mb-2" />
        {showLabel && (
          <p className="text-sm text-gray-500">סרטון</p>
        )}
      </div>
    </div>
  );
}
