"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Design } from "@/types/design";
import { Heart, Check } from "lucide-react";

interface DesignCardProps {
  design: Design;
  onOpen: (design: Design) => void;
  onToggleFavorite?: (id: string, current: boolean) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  priority?: boolean;
}

export function DesignCard({
  design,
  onOpen,
  onToggleFavorite,
  selectable = false,
  selected = false,
  onToggleSelect,
  priority = false,
}: DesignCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imageUrl = design.thumbnail_url || design.cloudinary_url;

  return (
    <div
      onClick={() => {
        if (selectable && onToggleSelect) {
          onToggleSelect(design.id);
        } else {
          onOpen(design);
        }
      }}
      className={`group relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer flex flex-col ${
        selected
          ? "border-[#C5A059] ring-2 ring-[#C5A059] shadow-md"
          : "border-[#EBE5DD] hover:border-[#C5A059]/60 hover:shadow-card-hover"
      }`}
    >
      {/* Card Image Container */}
      <div className="relative aspect-[4/5] w-full bg-stone-100 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={design.name}
            fill
            unoptimized
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className={`object-cover group-hover:scale-105 transition-all duration-500 ease-out ${
              isLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-95 blur-xs"
            }`}
            priority={priority}
            loading={priority ? "eager" : "lazy"}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
            No image
          </div>
        )}

        {/* Gradient overlay for contrast on badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Top Floating Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          {/* Design ID Badge */}
          <span className="px-2 py-0.5 rounded-md bg-[#1C1917]/85 backdrop-blur-md text-[#FAF8F5] text-[11px] font-mono font-bold tracking-wider shadow-sm border border-white/10">
            {design.design_id}
          </span>

          {/* Selectable Checkbox OR Favorite Heart */}
          <div className="pointer-events-auto flex items-center gap-1.5">
            {selectable ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect?.(design.id);
                }}
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                  selected
                    ? "bg-[#C5A059] text-white"
                    : "bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm"
                }`}
                aria-label="Select design"
              >
                {selected && <Check className="w-4 h-4 stroke-[3]" />}
              </button>
            ) : onToggleFavorite ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(design.id, design.is_favorite);
                }}
                className={`w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-transform active:scale-90 ${
                  design.is_favorite
                    ? "bg-rose-500/90 text-white"
                    : "bg-black/30 text-white/90 hover:bg-black/50"
                }`}
                aria-label={design.is_favorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${design.is_favorite ? "fill-current text-white" : ""}`}
                />
              </button>
            ) : null}
          </div>
        </div>

        {/* Category Chip (floating bottom left inside image) */}
        {design.category && (
          <div className="absolute bottom-2 left-2 pointer-events-none">
            <span className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[#1C1917] text-[10px] font-semibold tracking-wide shadow-sm">
              {design.category.name}
            </span>
          </div>
        )}
      </div>

      {/* Card Info Details */}
      <div className="p-2.5 sm:p-3 flex flex-col justify-between flex-1 bg-white">
        <div>
          <h3
            className="text-xs sm:text-sm font-semibold text-[#1C1917] line-clamp-1 group-hover:text-[#C5A059] transition-colors"
            title={design.name}
          >
            {design.name}
          </h3>
          {design.description && (
            <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5 hidden sm:block">
              {design.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
