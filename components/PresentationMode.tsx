"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Design } from "@/types/design";
import { Category } from "@/types/category";
import { DesignViewer } from "./DesignViewer";
import { useCatalogCache } from "@/lib/image-cache";
import { Search, ChevronLeft, Heart, Sparkles, Filter, CheckCircle2 } from "lucide-react";

interface PresentationModeProps {
  initialDesigns?: Design[];
  categories?: Category[];
}

export function PresentationMode({
  initialDesigns = [],
  categories = [],
}: PresentationModeProps) {
  const [designs, setDesigns] = useState<Design[]>(initialDesigns);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [viewFavoritesOnly, setViewFavoritesOnly] = useState(false);

  // Background caching for showroom
  const { isCached } = useCatalogCache(designs);

  // Fetch designs if not passed or when filters change
  useEffect(() => {
    async function load() {
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.set("category", activeCategory);
      if (searchQuery) params.set("search", searchQuery);
      if (viewFavoritesOnly) params.set("favorite", "true");
      params.set("limit", "500");

      try {
        const res = await fetch(`/api/designs?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setDesigns(data.designs || []);
        }
      } catch (err) {
        console.error("Presentation designs fetch error:", err);
      }
    }
    load();
  }, [activeCategory, searchQuery, viewFavoritesOnly]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex flex-col">
      {/* Luxury Presentation Header (Distraction-Free) */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EBE5DD] py-3.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Back to Studio Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-[#1C1917] py-1.5 px-3 rounded-full hover:bg-stone-200/50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Studio</span>
          </Link>

          {/* Presentation Branding */}
          <div className="text-center">
            <h1 className="font-serif-luxury text-lg sm:text-xl font-bold tracking-wider text-[#1C1917]">
              VIHARI&apos;S EMBROIDERY
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-[#C5A059] font-medium flex items-center justify-center gap-1">
              <span>Exclusive Design Catalog</span>
              {isCached && (
                <span className="text-emerald-700 font-semibold inline-flex items-center gap-0.5">
                  • <CheckCircle2 className="w-2.5 h-2.5" /> Offline Ready
                </span>
              )}
            </p>
          </div>

          {/* Favorites Filter Quick Toggle */}
          <button
            onClick={() => setViewFavoritesOnly(!viewFavoritesOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              viewFavoritesOnly
                ? "bg-rose-50 text-rose-700 border border-rose-200"
                : "text-stone-600 hover:bg-stone-200/50"
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                viewFavoritesOnly ? "fill-rose-500 text-rose-500" : "text-stone-500"
              }`}
            />
            <span className="hidden sm:inline">Favorites</span>
          </button>
        </div>

        {/* Minimal Search & Filter Pills */}
        <div className="max-w-7xl mx-auto mt-3 flex flex-col sm:flex-row items-center gap-2.5">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search designs..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-full bg-white border border-[#EBE5DD] focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar w-full py-0.5">
            <button
              onClick={() => setActiveCategory("all")}
              className={`shrink-0 px-3 py-1 rounded-full text-xs transition-colors ${
                activeCategory === "all"
                  ? "bg-[#1C1917] text-white font-semibold"
                  : "bg-white text-stone-600 border border-[#EBE5DD]"
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs transition-colors ${
                  activeCategory === c.id
                    ? "bg-[#1C1917] text-white font-semibold"
                    : "bg-white text-stone-600 border border-[#EBE5DD]"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Grid of Designs (Large, clear images for customers) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {designs.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-serif-luxury text-xl text-stone-600">No embroidery designs match your selection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
            {designs.map((design) => (
              <div
                key={design.id}
                onClick={() => setSelectedDesign(design)}
                className="group relative bg-white rounded-2xl border border-[#EBE5DD] overflow-hidden shadow-soft hover:shadow-card-hover cursor-pointer transition-all duration-300"
              >
                <div className="aspect-[4/5] relative bg-stone-100 overflow-hidden">
                  <img
                    src={design.thumbnail_url || design.cloudinary_url}
                    alt={design.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#1C1917]/80 backdrop-blur-md text-[#FAF8F5] text-[10px] font-mono font-bold tracking-wider">
                    {design.design_id}
                  </div>
                  {design.category && (
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-white/90 text-[#1C1917] text-[10px] font-semibold shadow-sm">
                      {design.category.name}
                    </div>
                  )}
                </div>

                <div className="p-3 text-center">
                  <h3 className="text-xs sm:text-sm font-semibold text-stone-900 truncate">
                    {design.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox / Fullscreen Viewer for Customer */}
      <DesignViewer
        design={selectedDesign}
        designs={designs}
        onClose={() => setSelectedDesign(null)}
        onNavigate={(d) => setSelectedDesign(d)}
        isAdmin={false} // NEVER show admin controls in presentation mode
      />
    </div>
  );
}
