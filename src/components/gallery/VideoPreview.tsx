"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { Play } from "lucide-react";
import VideoPlaceholder from "./VideoPlaceholder";
import { isMobile } from "@/utils";
import { logger } from "@/lib/logger";
import { apiServices } from "@/services/api";

interface VideoPreviewProps {
  mp4Url: string;
  webmUrl?: string;
  posterUrl?: string;
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
  const [mobileVideoFailed, setMobileVideoFailed] = useState(false);
  const [posterVisible, setPosterVisible] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Memoize proxied URLs to prevent excessive re-calculations
  const proxiedMp4Url = useMemo(() => apiServices.imageProxy.getProxiedImageUrl(mp4Url), [mp4Url]);
  const proxiedWebmUrl = useMemo(() => webmUrl ? apiServices.imageProxy.getProxiedImageUrl(webmUrl) : undefined, [webmUrl]);
  const proxiedPosterUrl = useMemo(() => posterUrl ? apiServices.imageProxy.getProxiedImageUrl(posterUrl) : undefined, [posterUrl]);

  useEffect(() => {
    setHasError(false);
    setIsLoading(false);
    setShowFallback(false);
    // Don't show poster overlay if no posterUrl - let video show first frame
    setPosterVisible(!!posterUrl);
    setIsReady(false);
  }, [mp4Url, posterUrl, showControls, autoPlay, fixedAspect, isIOS]);

  // Failsafe: if events never fire, hide overlay after a short delay
  useEffect(() => {
    if (isReady) return;
    // If no poster URL, make video ready immediately to show first frame
    const timeout = posterUrl ? 1000 : 100;
    const t = setTimeout(() => {
      console.log('VideoPreview: Failsafe timeout - hiding overlay', { mp4Url, posterUrl, timeout });
      setIsLoading(false);
      setIsReady(true);
      setPosterVisible(false);
    }, timeout);
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

  const handleVideoError = (e?: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e?.currentTarget || videoRef.current;
    const error = video?.error;
    
    console.error('VideoPreview: Video failed to load', { 
      mp4Url, 
      posterUrl,
      errorCode: error?.code,
      errorMessage: error?.message,
      networkState: video?.networkState,
      readyState: video?.readyState,
      currentSrc: video?.currentSrc,
      isMobile: isMobile(),
      isIOS,
    });
    
    const errorMessage = error?.message || 'Video load failed';
    const errorToLog = new Error(`Video error: ${errorMessage}`);
    
    logger.error('Video failed to load', errorToLog, {
      component: 'VideoPreview',
      mp4Url: mp4Url,
      hasPoster: !!posterUrl,
      errorCode: error?.code,
      errorMessage: error?.message,
      isMobile: isMobile(),
      isIOS,
    });
    
    setHasError(true);
    setIsLoading(false);
    
    // In mobile, show poster image instead of fallback
    if (isMobile()) {
      setMobileVideoFailed(true);
      setShowFallback(false);
      setPosterVisible(true);
    } else {
      setShowFallback(true);
      setPosterVisible(false);
    }
    
    setIsReady(true); // Mark as ready so overlay disappears
    onError?.();
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    console.log('VideoPreview: Metadata loaded', {
      mp4Url,
      duration: video.duration,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      readyState: video.readyState,
      isMobile: isMobile(),
      isIOS,
    });
    
    setIsLoading(false);
    setIsReady(true);
    setPosterVisible(false);
  };

  const handleCanPlay = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (isReady) return; // Prevent multiple calls
    
    setIsLoading(false);
    setIsReady(true);
    const v = e.currentTarget;
    if (v.readyState >= 2) {
      try { v.currentTime = 0.001; } catch {}
    }
    setPosterVisible(false);
    onLoad?.();
  };

  const containerClass = fixedAspect ? `relative aspect-video ${className}` : `relative w-full h-full ${className}`;
  const videoClass = fixedAspect 
    ? "w-full h-auto object-cover" 
    : "w-full h-full object-contain";

  return (
    <div className={containerClass} style={!fixedAspect ? { maxHeight: '100%', display: 'flex', alignItems: 'center' } : undefined}>
      {hasError && posterUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={proxiedPosterUrl}
          alt="Video poster"
          className={fixedAspect ? "absolute inset-0 w-full h-full object-cover" : "w-full h-full object-contain"}
        />
      )}

      {!showFallback && !mobileVideoFailed && (
        <video
          ref={videoRef}
          playsInline
          {...({ 
            'webkit-playsinline': 'true',
            'x-webkit-airplay': 'allow',
          } as Record<string, string>)}
          muted={true}
          loop={!showControls}
          autoPlay={autoPlay}
          preload={posterUrl ? "none" : "metadata"}
          poster={proxiedPosterUrl}
          disableRemotePlayback={false}
          controls={showControls}
          controlsList="nodownload"
          className={videoClass}
          style={!fixedAspect ? { maxHeight: '100%', maxWidth: '100%' } : undefined}
          onLoadStart={() => {
            setIsLoading(true);
          }}
          onLoadedData={() => {
            setIsLoading(false);
            setIsReady(true);
            setPosterVisible(false);
          }}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleCanPlay}
          onError={handleVideoError}
        >
          {!isIOS && proxiedWebmUrl && <source src={proxiedWebmUrl} type="video/webm" />}
          <source 
            src={proxiedMp4Url} 
            type="video/mp4"
          />
        </video>
      )}

      {isLoading && !showFallback && !mobileVideoFailed && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Mobile video fallback - show play button */}
      {isMobile() && mobileVideoFailed && posterUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <button
            onClick={() => {
              console.log('VideoPreview: Retrying video load on mobile', { mp4Url });
              setMobileVideoFailed(false);
              setHasError(false);
              setIsLoading(true);
            }}
            className="w-16 h-16 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300"
          >
            <div className="w-0 h-0 border-l-[12px] border-l-emerald-600 border-y-[8px] border-y-transparent ml-1"></div>
          </button>
        </div>
      )}

      {showFallback && (
        <VideoPlaceholder className="w-full h-full" />
      )}

      {(!showFallback && !hasError && !mobileVideoFailed && !posterUrl && (posterVisible || (!isReady && !isLoading))) && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/30 flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110">
            <Play className="w-7 h-7 text-emerald-600 ml-0.5" />
          </div>
          <div className="text-white text-xs font-medium px-4 py-1.5 bg-black/30 rounded-full backdrop-blur-sm shadow-md">
            לחץ לצפייה
          </div>
        </div>
      )}
    </div>
  );
}
