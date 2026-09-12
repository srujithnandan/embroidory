"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Design } from "@/types/design";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Heart,
  Download,
  Trash2,
  Edit,
  Share2,
} from "lucide-react";

interface DesignViewerProps {
  design: Design | null;
  designs: Design[];
  onClose: () => void;
  onNavigate: (design: Design) => void;
  onToggleFavorite?: (id: string, current: boolean) => void;
  onDelete?: (id: string) => void;
  onEdit?: (design: Design) => void;
  isAdmin?: boolean;
}

export function DesignViewer({
  design,
  designs,
  onClose,
  onNavigate,
  onToggleFavorite,
  onDelete,
  onEdit,
  isAdmin = false,
}: DesignViewerProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch Swipe navigation support for mobile
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Reset zoom on design change
  useEffect(() => {
    setZoomLevel(1);
    setConfirmDelete(false);
  }, [design?.id]);

  const currentIndex = design
    ? designs.findIndex((d) => d.id === design.id || d.design_id === design.design_id)
    : -1;

  // Smart pre-fetching of adjacent full-resolution images for instantaneous swiping
  useEffect(() => {
    if (currentIndex === -1 || designs.length === 0 || typeof window === "undefined") return;

    // Indices to preload: prev 1, next 1, next 2
    const indicesToPreload = [
      (currentIndex - 1 + designs.length) % designs.length,
      (currentIndex + 1) % designs.length,
      (currentIndex + 2) % designs.length,
    ];

    indicesToPreload.forEach((idx) => {
      const target = designs[idx];
      if (target) {
        const url = target.cloudinary_url || target.thumbnail_url;
        if (url) {
          const img = new window.Image();
          img.decoding = "async";
          img.src = url;
        }
      }
    });
  }, [currentIndex, designs]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(designs[currentIndex - 1]);
    } else if (designs.length > 0) {
      onNavigate(designs[designs.length - 1]); // Wrap around
    }
  }, [currentIndex, designs, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < designs.length - 1) {
      onNavigate(designs[currentIndex + 1]);
    } else if (designs.length > 0) {
      onNavigate(designs[0]); // Wrap around
    }
  }, [currentIndex, designs, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!design) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [design, onClose, handlePrevious, handleNext]);

  // Touch Handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      handleNext(); // Swiped left -> show next
    } else if (diff < -50) {
      handlePrevious(); // Swiped right -> show prev
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const cycleZoom = () => {
    setZoomLevel((prev) => (prev === 1 ? 1.75 : prev === 1.75 ? 2.5 : 1));
  };

  if (!design) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-[#121110]/95 backdrop-blur-xl flex flex-col select-none text-white"
    >
      {/* Top Controls Header */}
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-white/10 shrink-0">
        {/* Left: Design Identifier */}
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-md bg-[#C5A059] text-[#1C1917] font-mono font-bold text-xs tracking-wider">
            {design.design_id}
          </span>
          <div className="hidden sm:block">
            <h2 className="text-sm font-semibold text-white tracking-wide truncate max-w-xs md:max-w-md">
              {design.name}
            </h2>
            {design.category && (
              <span className="text-[11px] text-stone-400">{design.category.name}</span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Favorite Toggle */}
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(design.id, design.is_favorite)}
              className={`p-2.5 rounded-full transition-colors ${
                design.is_favorite ? "text-rose-500 hover:bg-rose-500/20" : "text-stone-300 hover:bg-white/10"
              }`}
              aria-label="Toggle favorite"
            >
              <Heart className={`w-5 h-5 ${design.is_favorite ? "fill-current" : ""}`} />
            </button>
          )}

          {/* Zoom Toggle */}
          <button
            onClick={cycleZoom}
            className="p-2.5 rounded-full text-stone-300 hover:text-white hover:bg-white/10 transition-colors"
            title={`Zoom (${zoomLevel}x)`}
            aria-label="Toggle zoom"
          >
            {zoomLevel > 1 ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="hidden sm:flex p-2.5 rounded-full text-stone-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Toggle Fullscreen"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          {/* Admin Edit */}
          {isAdmin && onEdit && (
            <button
              onClick={() => onEdit(design)}
              className="p-2.5 rounded-full text-stone-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Edit Design Details"
              aria-label="Edit design"
            >
              <Edit className="w-5 h-5" />
            </button>
          )}

          {/* Admin Delete */}
          {isAdmin && onDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-2.5 rounded-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
              title="Delete Design"
              aria-label="Delete design"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2.5 ml-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left Nav Arrow */}
        <button
          onClick={handlePrevious}
          className="absolute left-3 sm:left-6 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
          aria-label="Previous design"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Center Scaled Image */}
        <div
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200"
          style={{
            transform: `scale(${zoomLevel})`,
            cursor: zoomLevel > 1 ? "grab" : "zoom-in",
          }}
          onClick={cycleZoom}
        >
          <img
            src={design.cloudinary_url || design.thumbnail_url}
            alt={design.name}
            className="max-h-[75vh] sm:max-h-[82vh] max-w-[92vw] sm:max-w-[85vw] object-contain rounded-lg shadow-2xl transition-all"
            loading="eager"
            decoding="async"
          />
        </div>

        {/* Right Nav Arrow */}
        <button
          onClick={handleNext}
          className="absolute right-3 sm:right-6 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
          aria-label="Next design"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Design Info Bottom Sheet / Bar */}
      <div className="bg-[#1C1917]/90 backdrop-blur-md border-t border-white/10 px-4 py-3 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="sm:hidden font-mono font-bold text-xs text-[#C5A059]">
              {design.design_id}
            </span>
            <h3 className="text-sm sm:text-base font-medium text-white">{design.name}</h3>
            {design.category && (
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-stone-300 text-[11px]">
                {design.category.name}
              </span>
            )}
          </div>
          {design.description && (
            <p className="text-xs text-stone-400 mt-1 line-clamp-2 max-w-2xl">
              {design.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-stone-400">
          <span>
            {currentIndex + 1} of {designs.length}
          </span>
          <a
            href={design.cloudinary_url}
            target="_blank"
            rel="noreferrer"
            download={`${design.design_id}_${design.name}.jpg`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Download</span>
          </a>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] text-[#1C1917] rounded-2xl max-w-md w-full p-6 shadow-modal border border-[#EBE5DD] space-y-4">
            <h3 className="font-serif-luxury text-xl font-bold text-[#1C1917]">
              Delete this design?
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              This will permanently remove <span className="font-semibold text-stone-900">{design.design_id} ({design.name})</span> from your online embroidery catalog and cloud storage.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmDelete(false);
                  onDelete?.(design.id);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors"
              >
                Delete Design
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
