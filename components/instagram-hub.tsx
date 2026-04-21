"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Instagram,
  Play,
  Heart,
  MessageCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  duration: number; // in seconds
  timestamp: string;
}

interface Post {
  id: string;
  type: "image" | "reel";
  thumbnailUrl: string;
  mediaUrl: string;
  likes: number;
  comments: number;
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

const MOCK_POSTS: Post[] = [
  {
    id: "p1",
    type: "reel",
    thumbnailUrl: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400&h=500&fit=crop",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    likes: 342,
    comments: 28,
    caption: "Momentos del ultimo evento regional",
  },
  {
    id: "p2",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=500&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200",
    likes: 189,
    comments: 15,
    caption: "Coro regional en accion",
  },
  {
    id: "p3",
    type: "reel",
    thumbnailUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=500&fit=crop",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    likes: 567,
    comments: 42,
    caption: "Adoracion en vivo",
  },
  {
    id: "p4",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=500&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200",
    likes: 234,
    comments: 19,
    caption: "Reunion de jovenes",
  },
  {
    id: "p5",
    type: "reel",
    thumbnailUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=500&fit=crop",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    likes: 421,
    comments: 33,
    caption: "Noche de alabanza",
  },
  {
    id: "p6",
    type: "image",
    thumbnailUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c138?w=400&h=500&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c138?w=1200",
    likes: 156,
    comments: 11,
    caption: "Bautizos del mes",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STORY AVATAR COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface StoryAvatarProps {
  story: Story;
  onClick: () => void;
}

function StoryAvatar({ story, onClick }: StoryAvatarProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 min-w-[72px] group"
      aria-label={`Ver historia de ${story.username}`}
    >
      {/* Instagram-style gradient ring */}
      <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-500 group-hover:scale-105 transition-transform duration-200">
        <div className="p-[2px] rounded-full bg-white">
          <div className="relative w-14 h-14 rounded-full overflow-hidden">
            <Image
              src={story.avatarUrl}
              alt={story.username}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
        </div>
        {story.isOfficial && (
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#2f5e93] rounded-full flex items-center justify-center border-2 border-white">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
        )}
      </div>
      <span className="text-[11px] text-[#262626] truncate max-w-[68px] font-medium">
        {story.isOfficial ? "regionmayo" : story.username}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STORY VIEWER MODAL
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
  }, [currentItemIndex, currentStory.items.length, currentStoryIndex, stories.length, onClose]);

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

  // Progress bar logic
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
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentItem, isPaused, goToNextItem]);

  // Reset progress on story/item change
  useEffect(() => {
    setProgress(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [currentStoryIndex, currentItemIndex]);

  // Keyboard navigation
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

    if (isLeftSide) {
      goToPrevItem();
    } else {
      goToNextItem();
    }
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
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 text-white/90 hover:text-white transition-colors"
        aria-label="Cerrar visor de historias"
      >
        <X className="w-7 h-7" />
      </button>

      {/* Navigation arrows (desktop) */}
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

      {/* Story container */}
      <div className="relative w-full max-w-[420px] h-full max-h-[90vh] md:max-h-[85vh] mx-auto">
        {/* Progress bars */}
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

        {/* User info */}
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
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          )}
        </div>

        {/* Media content */}
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

          {/* Gradient overlays */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// POST GRID ITEM
// ─────────────────────────────────────────────────────────────────────────────

interface PostGridItemProps {
  post: Post;
}

function PostGridItem({ post }: PostGridItemProps) {
  return (
    <a
      href={`https://www.instagram.com/mgrregionmayo/`}
      target="_blank"
      rel="noopener noreferrer"
      className="relative aspect-[4/5] group overflow-hidden rounded-[2px] bg-[#f5f5f5]"
      aria-label={`Ver publicacion: ${post.caption}`}
    >
      <Image
        src={post.thumbnailUrl}
        alt={post.caption}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 768px) 50vw, 33vw"
      />

      {/* Reel indicator */}
      {post.type === "reel" && (
        <div className="absolute top-2 right-2 z-10">
          <Play className="w-5 h-5 text-white drop-shadow-md" fill="white" />
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-6">
        <div className="flex items-center gap-1.5 text-white font-semibold">
          <Heart className="w-5 h-5" fill="white" />
          <span>{post.likes}</span>
        </div>
        <div className="flex items-center gap-1.5 text-white font-semibold">
          <MessageCircle className="w-5 h-5" fill="white" />
          <span>{post.comments}</span>
        </div>
      </div>
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN INSTAGRAM HUB COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function InstagramHub() {
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
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

  if (!isClient) {
    return null;
  }

  return (
    <section
      className="w-full py-6 md:py-8 bg-white"
      aria-label="Instagram Hub - Comunidad en redes sociales"
    >
      <div className="max-w-[950px] mx-auto px-4 md:px-6">
        {/* Section header */}
        <div className="flex items-center gap-2.5 mb-5">
          <Instagram className="w-5 h-5 text-[#2f5e93]" />
          <h2 className="text-[15px] font-bold text-[#262626] uppercase tracking-[0.08em]">
            Comunidad en Instagram
          </h2>
        </div>

        {/* Stories strip */}
        <div className="mb-6">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {MOCK_STORIES.map((story, index) => (
              <StoryAvatar
                key={story.id}
                story={story}
                onClick={() => openStoryViewer(index)}
              />
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="relative mb-8 p-5 md:p-6 rounded-[2px] bg-gradient-to-r from-[#2f5e93] to-[#4a7fb8] overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-1/4 w-20 h-20 bg-white/5 rounded-full translate-y-1/2" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-1.5">
                Aparece en la portada
              </h3>
              <p className="text-white/85 text-sm md:text-base max-w-md">
                Sube tu historia del evento y etiqueta a{" "}
                <span className="font-semibold">@mgrregionmayo</span>
              </p>
            </div>
            <Button
              asChild
              className="w-full md:w-auto bg-white hover:bg-white/95 text-[#2f5e93] font-bold rounded-[2px] px-6 h-11 transition-all hover:scale-[1.02]"
            >
              <a
                href="https://www.instagram.com/mgrregionmayo/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <Instagram className="w-5 h-5" />
                <span>Seguir en Instagram</span>
              </a>
            </Button>
          </div>
        </div>

        {/* Posts grid */}
        <div>
          <h3 className="text-[13px] font-semibold text-[#8e8e8e] uppercase tracking-[0.06em] mb-4">
            Publicaciones Recientes
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-1.5">
            {MOCK_POSTS.map((post) => (
              <PostGridItem key={post.id} post={post} />
            ))}
          </div>
        </div>

        {/* View more link */}
        <div className="mt-6 text-center">
          <a
            href="https://www.instagram.com/mgrregionmayo/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#2f5e93] hover:text-[#264d79] transition-colors"
          >
            <span>Ver mas en Instagram</span>
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Story Viewer Modal */}
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
