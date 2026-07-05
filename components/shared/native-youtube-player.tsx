"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Gauge,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Settings,
  Share2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Image as ImageIcon } from "lucide-react";
import { ShareModal } from "@/components/layout/album-section-nav-bar/share-popup-modal";

type YoutubeStateChangeEvent = {
  data: number;
};

type YoutubePlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  getVolume: () => number;
  setVolume: (volume: number) => void;
  isMuted: () => boolean;
  mute: () => void;
  unMute: () => void;
  getPlaybackRate: () => number;
  setPlaybackRate: (rate: number) => void;
  getAvailablePlaybackRates: () => number[];
  getPlaybackQuality: () => string;
  setPlaybackQuality: (quality: string) => void;
  getAvailableQualityLevels: () => string[];
  destroy: () => void;
};

type YoutubePlayerConstructor = new (
  element: HTMLElement,
  options: {
    videoId: string;
    host?: string;
    playerVars?: Record<string, string | number>;
    events?: {
      onReady?: (event: { target: YoutubePlayer }) => void;
      onStateChange?: (event: YoutubeStateChangeEvent) => void;
    };
  },
) => YoutubePlayer;

declare global {
  interface Window {
    YT?: {
      Player: YoutubePlayerConstructor;
      PlayerState?: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface NativeYoutubePlayerProps {
  videoId: string;
  title: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
  isPortrait?: boolean;
  enableShare?: boolean;
  shareLabel?: string;
}

const PLAYING_STATE = 1;
const PAUSED_STATE = 2;
const ENDED_STATE = 0;
const SEEK_BACK_SECONDS = 5;
const SEEK_FORWARD_SECONDS = 15;
const SPEED_OPTIONS = [2, 1.8, 1.6, 1.4, 1.2, 1.1, 1, 0.9, 0.8, 0.7, 0.6];
const QUALITY_LABELS: Record<string, string> = {
  highres: "Alta",
  hd2160: "2160p",
  hd1440: "1440p",
  hd1080: "1080p",
  hd720: "720p",
  large: "480p",
  medium: "360p",
  small: "240p",
  tiny: "144p",
  auto: "Auto",
  default: "Auto",
};

let youtubeApiPromise: Promise<void> | null = null;

function loadYoutubeApi() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve();
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    if (existingScript) return;

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  });

  return youtubeApiPromise;
}

function formatTime(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPointPercent(event: PointerEvent<HTMLElement>, element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0) return 0;
  return clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
}

function qualityLabel(quality: string) {
  return QUALITY_LABELS[quality] || quality;
}

function speedLabel(rate: number) {
  return rate === 1 ? "1x · Normal" : `${rate}x`;
}

const playerButtonClass =
  "flex h-10 w-10 items-center justify-center bg-transparent text-white transition-colors hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80";

export function NativeYoutubePlayer({
  videoId,
  title,
  thumbnailUrl,
  downloadUrl,
  isPortrait = false,
  enableShare = true,
  shareLabel,
}: NativeYoutubePlayerProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const playerMountRef = useRef<HTMLDivElement | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null);
  const playerRef = useRef<YoutubePlayer | null>(null);
  const touchControlsTimerRef = useRef<number | null>(null);
  const fullscreenControlsTimerRef = useRef<number | null>(null);
  const bodyOverflowBeforeFullscreenRef = useRef<string | null>(null);
  const htmlOverflowBeforeFullscreenRef = useRef<string | null>(null);
  const suppressVideoLayerClickRef = useRef(false);
  const isScrubbingRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [touchControlsActive, setTouchControlsActive] = useState(false);
  const [timelineScrubHidesOverlay, setTimelineScrubHidesOverlay] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [availableRates, setAvailableRates] = useState<number[]>(SPEED_OPTIONS);
  const [quality, setQuality] = useState("auto");
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<"main" | "speed" | "quality">("main");
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPercent, setHoverPercent] = useState(0);
  const [volumeHover, setVolumeHover] = useState<number | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenControlsActive, setFullscreenControlsActive] = useState(false);
  const [settingsPanelStyle, setSettingsPanelStyle] = useState<CSSProperties>({});

  const progressPercent = duration > 0 ? clamp((currentTime / duration) * 100, 0, 100) : 0;
  const activeQualities = availableQualities.length > 0 ? availableQualities : ["auto"];
  const qrUrl = currentUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=10&data=${encodeURIComponent(currentUrl)}`
    : "";

  const aspectClass = isPortrait
    ? "mx-auto aspect-[9/16] w-full max-w-[420px]"
    : "aspect-video min-h-[260px] w-full sm:min-h-0";
  const controlsAreActive = !isPlaying || touchControlsActive || settingsOpen || fullscreenControlsActive;
  const controlsVisibilityClass = controlsAreActive
    ? "opacity-100"
    : isFullscreen
      ? "opacity-0"
      : "opacity-0 group-hover/native-player:opacity-100";
  const controlsPointerClass = controlsAreActive
    ? "pointer-events-auto"
    : isFullscreen
      ? "pointer-events-none"
      : "pointer-events-none md:group-hover/native-player:pointer-events-auto";
  const overlayVisibilityClass =
    !isPlaying || settingsOpen
      ? "opacity-100"
      : timelineScrubHidesOverlay
        ? "opacity-0"
        : touchControlsActive || fullscreenControlsActive
          ? "opacity-100"
          : isFullscreen
            ? "opacity-0"
            : "opacity-0 md:group-hover/native-player:opacity-100";
  const fullscreenCursorClass =
    isFullscreen && isPlaying && !fullscreenControlsActive && !settingsOpen
      ? "cursor-none"
      : "";

  const clearTouchControlsTimer = () => {
    if (touchControlsTimerRef.current === null) return;
    window.clearTimeout(touchControlsTimerRef.current);
    touchControlsTimerRef.current = null;
  };

  const showTouchControls = () => {
    clearTouchControlsTimer();
    setTouchControlsActive(true);

    if (!isPlaying || settingsOpen) return;
    touchControlsTimerRef.current = window.setTimeout(() => {
      setTouchControlsActive(false);
    }, 3500);
  };

  const clearFullscreenControlsTimer = () => {
    if (fullscreenControlsTimerRef.current === null) return;
    window.clearTimeout(fullscreenControlsTimerRef.current);
    fullscreenControlsTimerRef.current = null;
  };

  const showFullscreenControls = () => {
    if (!isFullscreen) return;

    clearFullscreenControlsTimer();
    setFullscreenControlsActive(true);

    if (!isPlaying || settingsOpen) return;
    fullscreenControlsTimerRef.current = window.setTimeout(() => {
      setFullscreenControlsActive(false);
    }, 2400);
  };

  const updateSettingsPanelPosition = () => {
    if (!settingsButtonRef.current) return;

    const rect = settingsButtonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const panelWidth = 260;
    const margin = 12;
    const bottom = Math.max(window.innerHeight - rect.top + 8, margin);

    if (viewportWidth <= panelWidth + margin * 2) {
      setSettingsPanelStyle({
        bottom,
        left: margin,
        right: margin,
      });
      return;
    }

    setSettingsPanelStyle({
      bottom,
      right: clamp(window.innerWidth - rect.right, margin, viewportWidth - panelWidth - margin),
      width: panelWidth,
    });
  };

  const lockYoutubeIframeInput = () => {
    const iframe = playerMountRef.current?.querySelector("iframe");
    if (!iframe) return;

    iframe.setAttribute("tabindex", "-1");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.pointerEvents = "none";
    iframe.addEventListener("focus", () => shellRef.current?.focus(), { once: true });
  };

  const cleanupFullscreenState = () => {
    clearFullscreenControlsTimer();
    setFullscreenControlsActive(false);
    setTouchControlsActive(false);
    setSettingsOpen(false);
    setSettingsView("main");
    setHoverTime(null);
    setVolumeHover(null);
    suppressVideoLayerClickRef.current = false;
    isScrubbingRef.current = false;

    if (bodyOverflowBeforeFullscreenRef.current !== null) {
      document.body.style.overflow = bodyOverflowBeforeFullscreenRef.current;
      bodyOverflowBeforeFullscreenRef.current = null;
    }

    if (htmlOverflowBeforeFullscreenRef.current !== null) {
      document.documentElement.style.overflow = htmlOverflowBeforeFullscreenRef.current;
      htmlOverflowBeforeFullscreenRef.current = null;
    }

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement && shellRef.current?.contains(activeElement)) {
      activeElement.blur();
    }
  };

  useEffect(() => {
    setCurrentUrl(window.location.href);
    void loadYoutubeApi();
  }, []);

  useEffect(() => {
    setStarted(false);
    setIsReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setSettingsOpen(false);
    setSettingsView("main");
    setTouchControlsActive(false);
    setTimelineScrubHidesOverlay(false);
    setFullscreenControlsActive(false);
    clearTouchControlsTimer();
    clearFullscreenControlsTimer();
    playerRef.current?.destroy();
    playerRef.current = null;
  }, [videoId]);

  useEffect(() => {
    if (!isPlaying) {
      clearTouchControlsTimer();
      setTouchControlsActive(true);
      setTimelineScrubHidesOverlay(false);
      clearFullscreenControlsTimer();
      setFullscreenControlsActive(false);
      return;
    }

    if (!settingsOpen) {
      setTouchControlsActive(false);
    }

    if (isFullscreen && !settingsOpen) {
      clearFullscreenControlsTimer();
      setFullscreenControlsActive(true);
      fullscreenControlsTimerRef.current = window.setTimeout(() => {
        setFullscreenControlsActive(false);
      }, 2400);
    }
  }, [isPlaying, settingsOpen, isFullscreen]);

  useEffect(() => {
    return () => {
      clearTouchControlsTimer();
      clearFullscreenControlsTimer();
    };
  }, []);

  useEffect(() => {
    if (!started || !playerMountRef.current) return;
    let cancelled = false;

    loadYoutubeApi().then(() => {
      if (cancelled || !window.YT?.Player || !playerMountRef.current) return;

      const player = new window.YT.Player(playerMountRef.current, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 1,
          cc_load_policy: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          origin: window.location.origin,
          playsinline: 1,
          rel: 0,
          showinfo: 0,
        },
        events: {
          onReady: (event) => {
            if (cancelled) return;
            playerRef.current = event.target;
            lockYoutubeIframeInput();
            setIsReady(true);
            setDuration(event.target.getDuration() || 0);
            setVolumeState(event.target.getVolume());
            setIsMuted(event.target.isMuted());
            setPlaybackRateState(event.target.getPlaybackRate() || 1);
            setAvailableRates(event.target.getAvailablePlaybackRates?.() || SPEED_OPTIONS);
            setAvailableQualities(event.target.getAvailableQualityLevels?.() || []);
            setQuality(event.target.getPlaybackQuality?.() || "auto");
            event.target.playVideo();
            window.setTimeout(lockYoutubeIframeInput, 0);
          },
          onStateChange: (event) => {
            lockYoutubeIframeInput();
            setIsPlaying(event.data === PLAYING_STATE);
            if (event.data === ENDED_STATE) {
              setCurrentTime(0);
            }
            if (event.data === PLAYING_STATE || event.data === PAUSED_STATE) {
              const playerNow = playerRef.current;
              if (!playerNow) return;
              setDuration(playerNow.getDuration() || 0);
              setQuality(playerNow.getPlaybackQuality?.() || "auto");
              setAvailableQualities(playerNow.getAvailableQualityLevels?.() || []);
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
    };
  }, [started, videoId]);

  useEffect(() => {
    if (!isReady) return;

    const interval = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      setCurrentTime(player.getCurrentTime() || 0);
      setDuration(player.getDuration() || 0);
      setIsMuted(player.isMuted());
      setVolumeState(player.getVolume());
    }, 350);

    return () => window.clearInterval(interval);
  }, [isReady]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!settingsOpen || !settingsRef.current) return;
      if (settingsButtonRef.current?.contains(event.target as Node)) return;
      if (!settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
        setSettingsView("main");
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSettingsOpen(false);
        setSettingsView("main");
        setIsShareOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [settingsOpen]);

  useEffect(() => {
    if (!settingsOpen) return;

    updateSettingsPanelPosition();
    window.addEventListener("resize", updateSettingsPanelPosition);
    window.addEventListener("scroll", updateSettingsPanelPosition, true);
    return () => {
      window.removeEventListener("resize", updateSettingsPanelPosition);
      window.removeEventListener("scroll", updateSettingsPanelPosition, true);
    };
  }, [settingsOpen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const nextIsFullscreen = document.fullscreenElement === shellRef.current;
      setIsFullscreen(nextIsFullscreen);
      clearFullscreenControlsTimer();

      if (!nextIsFullscreen) {
        cleanupFullscreenState();
        return;
      }

      setFullscreenControlsActive(true);

      if (nextIsFullscreen && isPlaying && !settingsOpen) {
        fullscreenControlsTimerRef.current = window.setTimeout(() => {
          setFullscreenControlsActive(false);
        }, 2400);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isPlaying, settingsOpen]);

  const togglePlay = () => {
    if (!started) {
      setStarted(true);
      return;
    }

    const player = playerRef.current;
    if (!player) return;

    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const handleVideoLayerPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    suppressVideoLayerClickRef.current = false;

    if (!started || !isPlaying || controlsAreActive) return;

    event.preventDefault();
    event.stopPropagation();
    suppressVideoLayerClickRef.current = true;
    showTouchControls();
  };

  const handleVideoLayerClick = () => {
    if (suppressVideoLayerClickRef.current) {
      suppressVideoLayerClickRef.current = false;
      return;
    }

    if (isPlaying) {
      showTouchControls();
    }
  };

  const seekBy = (seconds: number) => {
    const player = playerRef.current;
    if (!player) return;
    const nextTime = clamp(player.getCurrentTime() + seconds, 0, player.getDuration() || 0);
    player.seekTo(nextTime, true);
    setCurrentTime(nextTime);
  };

  const seekToPercent = (percent: number) => {
    const player = playerRef.current;
    if (!player || duration <= 0) return;
    const nextTime = (percent / 100) * duration;
    player.seekTo(nextTime, true);
    setCurrentTime(nextTime);
  };

  const scrubToPointer = (event: PointerEvent<HTMLElement>) => {
    const percent = getPointPercent(event, event.currentTarget);
    setHoverPercent(percent);
    setHoverTime((percent / 100) * duration);
    if (isPlaying) {
      setTimelineScrubHidesOverlay(true);
    }
    seekToPercent(percent);
  };

  const toggleMute = () => {
    const player = playerRef.current;
    if (!player) return;
    if (player.isMuted() || volume === 0) {
      player.unMute();
      if (volume === 0) player.setVolume(60);
    } else {
      player.mute();
    }
    setIsMuted(player.isMuted());
    setVolumeState(player.getVolume());
  };

  const setVolume = (nextVolume: number) => {
    const player = playerRef.current;
    if (!player) return;
    const safeVolume = clamp(Math.round(nextVolume), 0, 100);
    player.setVolume(safeVolume);
    if (safeVolume === 0) {
      player.mute();
    } else {
      player.unMute();
    }
    setVolumeState(safeVolume);
    setIsMuted(player.isMuted());
  };

  const setSpeed = (rate: number) => {
    const player = playerRef.current;
    if (!player) return;
    player.setPlaybackRate(rate);
    setPlaybackRateState(rate);
    setSettingsOpen(false);
    setSettingsView("main");
  };

  const setQualityLevel = (nextQuality: string) => {
    const player = playerRef.current;
    if (!player) return;
    player.setPlaybackQuality(nextQuality);
    setQuality(nextQuality);
    setSettingsOpen(false);
    setSettingsView("main");
  };

  const copyLink = async () => {
    if (!currentUrl) return;
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const toggleFullscreen = async () => {
    if (!shellRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      bodyOverflowBeforeFullscreenRef.current = document.body.style.overflow;
      htmlOverflowBeforeFullscreenRef.current = document.documentElement.style.overflow;
      await shellRef.current.requestFullscreen();
    }
  };

  const visibleRates = useMemo(() => {
    const merged = Array.from(new Set([...availableRates, 1])).filter(Boolean);
    return SPEED_OPTIONS.filter((rate) => merged.includes(rate));
  }, [availableRates]);

  return (
    <>
      <div
        ref={shellRef}
        className={`${aspectClass} ${fullscreenCursorClass} group/native-player relative overflow-hidden bg-black text-white`}
        onPointerMove={(event) => {
          if (event.pointerType === "mouse") {
            showFullscreenControls();
          }
        }}
      >
        {!started ? (
          <button
            type="button"
            className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#777] bg-cover bg-center text-white transition-colors hover:bg-[#5f5f5f] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            style={
              thumbnailUrl
                ? { backgroundImage: `url("${thumbnailUrl}")` }
                : undefined
            }
            onClick={() => setStarted(true)}
            aria-label={`Reproducir ${title}`}
          >
            <span className="absolute inset-0 bg-black/25 transition-colors hover:bg-black/45" aria-hidden="true" />
            <span className="relative flex h-20 w-20 items-center justify-center bg-black/55">
              <Play className="h-12 w-12 fill-none" strokeWidth={1.7} aria-hidden="true" />
            </span>
          </button>
        ) : (
          <div className="h-full w-full">
            <div
              ref={playerMountRef}
              className="h-full w-full [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:scale-[1.18] [&_iframe]:pointer-events-none"
            />
          </div>
        )}

        {started ? (
          <button
            type="button"
            className={`native-player-video-hit-area absolute inset-0 z-[7] bg-transparent ${
              fullscreenCursorClass || "cursor-default"
            }`}
            onPointerDown={handleVideoLayerPointerDown}
            onClick={handleVideoLayerClick}
            aria-label={isPlaying ? "Pausar video" : "Reproducir video"}
          />
        ) : null}

        {started ? (
          <div
            className={`pointer-events-none absolute inset-0 z-[8] transition-opacity duration-200 ${overlayVisibilityClass}`}
            aria-hidden="true"
          >
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/86 to-transparent" />
          </div>
        ) : null}

        {started ? (
          <div
            data-native-player-controls
            className={`absolute inset-x-0 bottom-0 z-10 px-3 pb-2 transition-opacity duration-200 ${controlsVisibilityClass} ${controlsPointerClass}`}
          >
            <div
              className="group/progress relative mb-1 h-5 cursor-pointer touch-none"
              onPointerMove={(event) => {
                if (isScrubbingRef.current) {
                  scrubToPointer(event);
                  return;
                }
                const percent = getPointPercent(event, event.currentTarget);
                setHoverPercent(percent);
                setHoverTime((percent / 100) * duration);
              }}
              onPointerLeave={() => {
                if (!isScrubbingRef.current) {
                  setHoverTime(null);
                }
              }}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                isScrubbingRef.current = true;
                event.currentTarget.setPointerCapture(event.pointerId);
                scrubToPointer(event);
              }}
              onPointerUp={(event) => {
                event.preventDefault();
                event.stopPropagation();
                isScrubbingRef.current = false;
                scrubToPointer(event);
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
                setHoverTime(null);
              }}
              onPointerCancel={(event) => {
                isScrubbingRef.current = false;
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
                setHoverTime(null);
              }}
            >
              <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-white/65 transition-all group-hover/progress:h-[3px] group-hover/progress:bg-white" />
              <div
                className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 bg-brand transition-all group-hover/progress:h-1"
                style={{ width: `${progressPercent}%` }}
              />
              <div
                className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand transition-all group-hover/progress:h-3.5 group-hover/progress:w-3.5"
                style={{ left: `${progressPercent}%` }}
              />
              {hoverTime !== null ? (
                <div
                  className="pointer-events-none absolute bottom-4 flex -translate-x-1/2 flex-col items-center"
                  style={{ left: `${hoverPercent}%` }}
                >
                  <span className="bg-black px-1.5 py-0.5 text-[11px] font-semibold text-white">
                    {formatTime(hoverTime)}
                  </span>
                  <span className="h-3 w-px bg-black" />
                </div>
              ) : null}
            </div>

            <div className="mb-1 flex items-center justify-between gap-3 text-[12px] font-semibold">
              <p className="min-w-0 truncate">{title}</p>
              <span className="shrink-0">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center">
                <button type="button" className={playerButtonClass} onClick={togglePlay} aria-label={isPlaying ? "Pausar" : "Reproducir"}>
                  {isPlaying ? <Pause className="h-6 w-6" aria-hidden="true" /> : <Play className="h-6 w-6" aria-hidden="true" />}
                </button>
                <button type="button" className={playerButtonClass} onClick={() => seekBy(-SEEK_BACK_SECONDS)} aria-label="Retroceder 5 segundos">
                  <RotateCcw className="h-5 w-5" aria-hidden="true" />
                </button>
                <button type="button" className={playerButtonClass} onClick={() => seekBy(SEEK_FORWARD_SECONDS)} aria-label="Adelantar 15 segundos">
                  <RotateCw className="h-5 w-5" aria-hidden="true" />
                </button>
                <button type="button" className={`${playerButtonClass} md:hidden`} onClick={toggleMute} aria-label={isMuted ? "Activar sonido" : "Silenciar"}>
                  {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" aria-hidden="true" /> : <Volume2 className="h-5 w-5" aria-hidden="true" />}
                </button>
                <div className="group/volume hidden items-center md:flex">
                  <button type="button" className={playerButtonClass} onClick={toggleMute} aria-label={isMuted ? "Activar sonido" : "Silenciar"}>
                    {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" aria-hidden="true" /> : <Volume2 className="h-5 w-5" aria-hidden="true" />}
                  </button>
                  <div
                    className="relative hidden h-10 w-28 cursor-pointer touch-none items-center group-hover/volume:flex"
                    onPointerMove={(event) => {
                      const percent = getPointPercent(event, event.currentTarget);
                      setVolumeHover(Math.round(percent));
                    }}
                    onPointerLeave={() => setVolumeHover(null)}
                    onPointerDown={(event) => {
                      event.currentTarget.setPointerCapture(event.pointerId);
                      setVolume(getPointPercent(event, event.currentTarget));
                    }}
                  >
                    <div className="h-0.5 w-full bg-white/45" />
                    <div className="absolute left-0 h-0.5 bg-brand" style={{ width: `${isMuted ? 0 : volume}%` }} />
                    <div className="absolute h-3 w-3 -translate-x-1/2 rounded-full bg-brand" style={{ left: `${isMuted ? 0 : volume}%` }} />
                    {volumeHover !== null ? (
                      <span
                        className="pointer-events-none absolute bottom-8 -translate-x-1/2 bg-black px-1.5 py-0.5 text-[11px] font-semibold text-white"
                        style={{ left: `${volumeHover}%` }}
                      >
                        {volumeHover}%
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <div ref={settingsRef} className="relative">
                  <button
                    ref={settingsButtonRef}
                    type="button"
                    className={playerButtonClass}
                    onClick={() => {
                      setSettingsOpen((open) => {
                        if (!open) updateSettingsPanelPosition();
                        return !open;
                      });
                      setSettingsView("main");
                    }}
                    aria-label="Configuracion"
                    aria-expanded={settingsOpen}
                  >
                    <Settings className="h-5 w-5" aria-hidden="true" />
                  </button>
                  {settingsOpen ? (
                    <div
                      className="fixed z-[10000] max-h-[calc(100dvh-24px)] overflow-y-auto border border-white/15 bg-[#141414] p-4 text-white shadow-[0_20px_45px_rgba(0,0,0,0.45)]"
                      style={settingsPanelStyle}
                    >
                      {settingsView === "main" ? (
                        <>
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <h3 className="text-[17px] font-bold">Configuracion</h3>
                            <button type="button" className="flex h-10 w-10 items-center justify-center bg-brand-active text-white" onClick={() => setSettingsOpen(false)} aria-label="Cerrar configuracion">
                              <X className="h-6 w-6" aria-hidden="true" />
                            </button>
                          </div>
                          <div className="space-y-1">
                            {enableShare ? (
                              <button
                                type="button"
                                className="flex w-full items-center gap-3 bg-transparent px-1 py-2 text-left text-[16px] text-[#a9c7ff] hover:bg-brand-hover hover:text-white"
                                onClick={() => {
                                  setSettingsOpen(false);
                                  setIsShareOpen(true);
                                }}
                              >
                                <Share2 className="h-5 w-5 text-white" aria-hidden="true" />
                                Compartir
                              </button>
                            ) : null}
                            <button type="button" className="flex w-full items-center gap-3 bg-transparent px-1 py-2 text-left text-[16px] hover:bg-brand-hover" onClick={() => setSettingsView("speed")}>
                              <Gauge className="h-5 w-5" aria-hidden="true" />
                              <span className="flex-1 text-[#a9c7ff]">Velocidad</span>
                              <span className="text-sm text-white/80">{speedLabel(playbackRate)}</span>
                              <ChevronRight className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button type="button" className="flex w-full items-center gap-3 bg-transparent px-1 py-2 text-left text-[16px] hover:bg-brand-hover" onClick={() => setSettingsView("quality")}>
                              <Settings className="h-5 w-5" aria-hidden="true" />
                              <span className="flex-1 text-[#a9c7ff]">Calidad</span>
                              <span className="text-sm text-white/80">{qualityLabel(quality)}</span>
                              <ChevronRight className="h-4 w-4" aria-hidden="true" />
                            </button>
                            {downloadUrl ? (
                              <a className="flex w-full items-center gap-3 bg-transparent px-1 py-2 text-left text-[16px] text-[#a9c7ff] hover:bg-brand-hover hover:text-white" href={downloadUrl} target="_blank" rel="noreferrer">
                                <Download className="h-5 w-5 text-white" aria-hidden="true" />
                                Descargar
                              </a>
                            ) : null}
                          </div>
                        </>
                      ) : null}

                      {settingsView === "speed" ? (
                        <>
                          <SettingsPanelHeader title="Velocidad" onBack={() => setSettingsView("main")} onClose={() => setSettingsOpen(false)} />
                          <div className="space-y-1">
                            {visibleRates.map((rate) => (
                              <button key={rate} type="button" className="flex w-full items-center gap-3 px-1 py-1.5 text-left text-[15px] hover:bg-brand-hover" onClick={() => setSpeed(rate)}>
                                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white">
                                  {playbackRate === rate ? <Check className="h-4 w-4 text-[#a9c7ff]" aria-hidden="true" /> : null}
                                </span>
                                {speedLabel(rate)}
                              </button>
                            ))}
                          </div>
                        </>
                      ) : null}

                      {settingsView === "quality" ? (
                        <>
                          <SettingsPanelHeader title="Calidad" onBack={() => setSettingsView("main")} onClose={() => setSettingsOpen(false)} />
                          <div className="space-y-1">
                            {activeQualities.map((item) => (
                              <button key={item} type="button" className="flex w-full items-center gap-3 px-1 py-1.5 text-left text-[15px] hover:bg-brand-hover" onClick={() => setQualityLevel(item)}>
                                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white">
                                  {quality === item ? <Check className="h-4 w-4 text-[#a9c7ff]" aria-hidden="true" /> : null}
                                </span>
                                {qualityLabel(item)}
                              </button>
                            ))}
                          </div>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <button type="button" className={playerButtonClass} onClick={toggleFullscreen} aria-label={isFullscreen ? "Minimizar" : "Expandir"}>
                  {isFullscreen ? <Minimize2 className="h-5 w-5" aria-hidden="true" /> : <Maximize2 className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <ShareModal
        isMounted={true}
        isOpen={isShareOpen}
        currentLabel={shareLabel || title}
        currentUrl={currentUrl}
        qrUrl={qrUrl}
        copied={copied}
        icon={ImageIcon}
        onClose={() => setIsShareOpen(false)}
        onCopyLink={copyLink}
      />
    </>
  );
}

function SettingsPanelHeader({
  title,
  onBack,
  onClose,
}: {
  title: string;
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <button type="button" className="flex h-9 w-9 items-center justify-center bg-transparent hover:bg-brand-hover" onClick={onBack} aria-label="Volver">
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <h3 className="flex-1 text-[17px] font-bold">{title}</h3>
      <button type="button" className="flex h-9 w-9 items-center justify-center bg-transparent hover:bg-brand-hover" onClick={onClose} aria-label="Cerrar">
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
