"use client";
import { useState, useEffect, useRef } from "react";
import { Play } from "lucide-react";
import VideoPlaceholder from "./VideoPlaceholder";
import { isMobile } from "@/utils";
import { logger } from "@/lib/logger";
import { apiServices } from "@/services/api";

interface VideoPreviewProps {
  mp4Url: string;
  webmUrl?: string;
  posterUrl: string;
  className?: string;
  onError?: () => void;
  onLoad?: () => void;
  fixedAspect?: boolean; // if true, wrap with aspect-video
  showControls?: boolean; // if true, show video controls
  autoPlay?: boolean; // if true, autoplay video
}

export default function VideoPreview({ 
  mp4Url, 
  webmUrl, 
  posterUrl, 
  className = "", 
  onError,
  onLoad,
  fixedAspect = true,
  showControls = false,
  autoPlay = false,
}: VideoPreviewProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [posterVisible, setPosterVisible] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    setHasError(false);
    setIsLoading(!isMobile());
    setShowFallback(false);
    setPosterVisible(true);
    setIsReady(false);
  }, [mp4Url]);

  // Failsafe: if events never fire, hide overlay after a short delay
  useEffect(() => {
    if (isReady) return;
    const t = setTimeout(() => setIsReady(true), 3000);
    return () => clearTimeout(t);
  }, [isReady, mp4Url, posterUrl]);

  // Optional: log video element errors
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onErr = () => {
      const err = v.error;
      console.debug("video error", err?.code, err?.message, { readyState: v.readyState, networkState: v.networkState, src: v.currentSrc });
    };
    v.addEventListener("error", onErr);
    return () => v.removeEventListener("error", onErr);
  }, []);

  const handleVideoError = () => {
    logger.warn('Video failed to load', {
      component: 'VideoPreview',
      mp4Url: mp4Url,
      hasPoster: !!posterUrl,
    });
    setHasError(true);
    setIsLoading(false);
    setShowFallback(!posterUrl);
    setPosterVisible(true);
    onError?.();
  };

  const handleLoadedMetadata = () => {
    setIsReady(true);
    setPosterVisible(false);
  };

  const handleCanPlay = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setIsLoading(false);
    setIsReady(true);
    const v = e.currentTarget;
    if (v.readyState >= 2) {
      try { v.currentTime = 0.001; } catch {}
    }
    setPosterVisible(false);
    onLoad?.();
  };

  const containerClass = fixedAspect ? `relative aspect-video ${className}` : `relative ${className}`;

  return (
    <div className={containerClass}>
      {hasError && posterUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={apiServices.imageProxy.getProxiedImageUrl(posterUrl)}
          alt="Video poster"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {!showFallback && (
        <video
          ref={videoRef}
          playsInline
          {...({ 'webkit-playsinline': 'true' } as Record<string, string>)}
          muted={!showControls}
          loop={!showControls}
          autoPlay={autoPlay}
          preload="metadata"
          poster={apiServices.imageProxy.getProxiedImageUrl(posterUrl)}
          disableRemotePlayback
          controls={showControls}
          className="w-full h-auto object-cover"
          onLoadStart={() => setIsLoading(true)}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleCanPlay}
          onError={handleVideoError}
        >
          {!isIOS && webmUrl && <source src={apiServices.imageProxy.getProxiedImageUrl(webmUrl)} type="video/webm" />}
          <source src={apiServices.imageProxy.getProxiedImageUrl(mp4Url)} type="video/mp4" />
        </video>
      )}

      {isLoading && !showFallback && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {showFallback && (
        <VideoPlaceholder className="w-full h-full" />
      )}

      {(!showFallback && (isLoading || posterVisible || !isReady || (hasError && !!posterUrl))) && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <Play className="w-8 h-8 text-emerald-600 ml-1" />
          </div>
        </div>
      )}
    </div>
  );
}
