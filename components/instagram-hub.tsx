"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Instagram,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  CheckCircle2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — structured for future API integration
// ─────────────────────────────────────────────────────────────────────────────

interface Story {
  id: string;
  username: string;
  avatarUrl: string;
  isOfficial: boolean;
  items: StoryItem[];
}

interface StoryItem {
  id: string;
  type: "image" | "video";
  url: string;
  duration: number;
  timestamp: string;
}

interface Post {
  id: string;
  type: "image" | "reel";
  thumbnailUrl: string;
  caption: string;
}

const MOCK_STORIES: Story[] = [
  {
    id: "official",
    username: "mgrregionmayo",
    avatarUrl: "https://i.pravatar.cc/150?img=68",
    isOfficial: true,
    items: [
      {
        id: "s1-1",
        type: "image",
        url: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1080&h=1920&fit=crop",
        duration: 5,
        timestamp: "2h",
      },
      {
        id: "s1-2",
        type: "image",
        url: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1080&h=1920&fit=crop",
        duration: 5,
        timestamp: "3h",
      },
      {
        id: "s1-3",
        type: "video",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        duration: 15,
        timestamp: "5h",
      },
    ],
  },
  {
    id: "user1",
    username: "coro_voces_mayo",
    avatarUrl: "https://i.pravatar.cc/150?img=32",
    isOfficial: false,
    items: [
      {
        id: "s2-1",
        type: "image",
        url: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1080&h=1920&fit=crop",
        duration: 5,
        timestamp: "1h",
      },
    ],
  },
  {
    id: "user2",
    username: "juventud_mayo",
    avatarUrl: "https://i.pravatar.cc/150?img=47",
    isOfficial: false,
    items: [
      {
        id: "s3-1",
        type: "image",
        url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1080&h=1920&fit=crop",
        duration: 5,
        timestamp: "30m",
      },
      {
        id: "s3-2",
        type: "image",
        url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1080&h=1920&fit=crop",
        duration: 5,
        timestamp: "45m",
      },
    ],
  },
  {
    id: "user3",
    username: "ana_worship",
    avatarUrl: "https://i.pravatar.cc/150?img=5",
    isOfficial: false,
    items: [
      {
        id: "s4-1",
        type: "image",
        url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1080&h=1920&fit=crop",
        duration: 5,
        timestamp: "4h",
      },
    ],
  },
  {
    id: "user4",
    username: "davidpm_foto",
    avatarUrl: "https://i.pravatar.cc/150?img=12",
    isOfficial: false,
    items: [
      {
        id: "s5-1",
        type: "image",
        url: "https://images.unsplash.com/photo-1501281668745-f7f57925c138?w=1080&h=1920&fit=crop",
        duration: 5,
        timestamp: "6h",
      },
    ],
  },
  {
    id: "user5",
    username: "templo_central",
    avatarUrl: "https://i.pravatar.cc/150?img=59",
    isOfficial: false,
    items: [
      {
        id: "s6-1",
        type: "image",
        url: "https://images.unsplash.com/photo-1478147427282-58a87a120781?w=1080&h=1920&fit=crop",
        duration: 5,
        timestamp: "8h",
      },
    ],
  },
];

const MOCK_RECENT_POSTS: Post[] = [
  {
    id: "p1",
    type: "reel",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400&h=400&fit=crop",
    caption: "Momentos del último evento regional",
  },
  {
    id: "p2",
    type: "image",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop",
    caption: "Coro regional en acción",
  },
  {
    id: "p3",
    type: "reel",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=400&fit=crop",
    caption: "Adoración en vivo",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DISCRETE STORY AVATAR — 32px / 40px, no heavy gradient ring
// ─────────────────────────────────────────────────────────────────────────────

interface StoryAvatarProps {
  story: Story;
  onClick: () => void;
}

function StoryAvatar({ story, onClick }: StoryAvatarProps) {
  const isOfficial = story.isOfficial;
  const displayLabel = isOfficial ? "regionmayo" : story.username;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 group shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5e93] rounded-full"
      aria-label={`Ver historia de ${story.username}`}
      title={story.username}
    >
      <span
        className={[
          "relative block overflow-hidden rounded-full bg-white",
          isOfficial
            ? "h-10 w-10 ring-1 ring-[#2f5e93]/50 ring-offset-1 ring-offset-white"
            : "h-8 w-8 border border-[#dce2e9]",
          "group-hover:scale-[1.04] transition-transform duration-200",
        ].join(" ")}
      >
        <Image
          src={story.avatarUrl}
          alt={story.username}
          fill
          sizes={isOfficial ? "40px" : "32px"}
          className="object-cover"
        />
        {isOfficial && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center"
            aria-hidden="true"
          >
            <CheckCircle2 className="w-[14px] h-[14px] text-[#2f5e93]" fill="#2f5e93" color="white" />
          </span>
        )}
      </span>
      {isOfficial && (
        <span className="hidden md:inline text-[12px] font-semibold text-[#1f2833] pr-1">
          @{displayLabel}
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STORY VIEWER MODAL — unchanged (functionality was already solid)
// ─────────────────────────────────────────────────────────────────────────────

interface StoryViewerProps {
  stories: Story[];
  initialStoryIndex: number;
  onClose: () => void;
}

function StoryViewer({ stories, initialStoryIndex, onClose }: StoryViewerProps) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStory = stories[currentStoryIndex];
  const currentItem = currentStory.items[currentItemIndex];

  const goToNextItem = useCallback(() => {
    if (currentItemIndex < currentStory.items.length - 1) {
      setCurrentItemIndex((prev) => prev + 1);
      setProgress(0);
    } else if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
      setCurrentItemIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [
    currentItemIndex,
    currentStory.items.length,
    currentStoryIndex,
    stories.length,
    onClose,
  ]);

  const goToPrevItem = useCallback(() => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex((prev) => prev - 1);
      setProgress(0);
    } else if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
      const prevStory = stories[currentStoryIndex - 1];
      setCurrentItemIndex(prevStory.items.length - 1);
      setProgress(0);
    }
  }, [currentItemIndex, currentStoryIndex, stories]);

  useEffect(() => {
    if (isPaused) return;
    const duration = currentItem.duration * 1000;
    const increment = 100 / (duration / 50);

    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNextItem();
          return 0;
        }
        return prev + increment;
      });
    }, 50);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [currentItem, isPaused, goToNextItem]);

  useEffect(() => {
    setProgress(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [currentStoryIndex, currentItemIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goToNextItem();
      if (e.key === "ArrowLeft") goToPrevItem();
      if (e.key === " ") {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goToNextItem, goToPrevItem]);

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftSide = x < rect.width / 3;
    if (isLeftSide) goToPrevItem();
    else goToNextItem();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Visor de historias"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 text-white/90 hover:text-white transition-colors"
        aria-label="Cerrar visor de historias"
      >
        <X className="w-7 h-7" />
      </button>

      <button
        onClick={goToPrevItem}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Historia anterior"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={goToNextItem}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Historia siguiente"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="relative w-full max-w-[420px] h-full max-h-[90vh] md:max-h-[85vh] mx-auto">
        <div className="absolute top-2 left-2 right-2 z-40 flex gap-1">
          {currentStory.items.map((item, index) => (
            <div
              key={item.id}
              className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-50 ease-linear"
                style={{
                  width:
                    index < currentItemIndex
                      ? "100%"
                      : index === currentItemIndex
                        ? `${progress}%`
                        : "0%",
                }}
              />
            </div>
          ))}
        </div>

        <div className="absolute top-6 left-3 right-12 z-40 flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/50">
            <Image
              src={currentStory.avatarUrl}
              alt={currentStory.username}
              fill
              className="object-cover"
              sizes="36px"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm">
              {currentStory.username}
            </span>
            <span className="text-white/60 text-xs">{currentItem.timestamp}</span>
          </div>
          {currentItem.type === "video" && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="ml-auto p-1.5 text-white/80 hover:text-white"
              aria-label={isMuted ? "Activar sonido" : "Silenciar"}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        <div
          className="relative w-full h-full rounded-lg overflow-hidden cursor-pointer"
          onClick={handleTap}
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0"
            >
              {currentItem.type === "video" ? (
                <video
                  ref={videoRef}
                  src={currentItem.url}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop={false}
                  muted={isMuted}
                  playsInline
                />
              ) : (
                <Image
                  src={currentItem.url}
                  alt="Historia"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 420px"
                  priority
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DISCRETE HUB
// ─────────────────────────────────────────────────────────────────────────────

export function InstagramHub() {
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(
    null,
  );
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const openStoryViewer = (index: number) => {
    setSelectedStoryIndex(index);
    document.body.style.overflow = "hidden";
  };

  const closeStoryViewer = () => {
    setSelectedStoryIndex(null);
    document.body.style.overflow = "";
  };

  if (!isClient) return null;

  return (
    <section
      className="w-full bg-white py-4 md:py-5 border-b border-[#ececec]"
      aria-label="Comunidad en Instagram"
    >
      <div className="px-4 md:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Instagram className="w-4 h-4 text-[#2f5e93]" aria-hidden="true" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#425060]">
              En Instagram
            </h2>
          </div>
          <a
            href="https://www.instagram.com/mgrregionmayo/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] font-semibold text-[#2f5e93] hover:text-[#264d79] transition-colors"
          >
            Ver perfil →
          </a>
        </div>

        {/* Discrete avatar strip */}
        <div
          className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1 mb-4"
          role="list"
          aria-label="Historias recientes"
        >
          {MOCK_STORIES.map((story, index) => (
            <div role="listitem" key={story.id}>
              <StoryAvatar story={story} onClick={() => openStoryViewer(index)} />
            </div>
          ))}
        </div>

        {/* Mini recent posts row — 3 thumbnails, not a big grid */}
        <div className="grid grid-cols-3 gap-2 md:gap-2.5">
          {MOCK_RECENT_POSTS.map((post) => (
            <a
              key={post.id}
              href="https://www.instagram.com/mgrregionmayo/"
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square group overflow-hidden rounded-[2px] bg-[#f1f1f1]"
              aria-label={`Ver publicación: ${post.caption}`}
            >
              <Image
                src={post.thumbnailUrl}
                alt={post.caption}
                fill
                sizes="(max-width: 768px) 33vw, 180px"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              {post.type === "reel" && (
                <div className="absolute top-1.5 right-1.5">
                  <Play
                    className="w-3.5 h-3.5 text-white drop-shadow-md"
                    fill="white"
                  />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </a>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedStoryIndex !== null && (
          <StoryViewer
            stories={MOCK_STORIES}
            initialStoryIndex={selectedStoryIndex}
            onClose={closeStoryViewer}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
