"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Design, DesignFilterParams } from "@/types/design";
import { Category } from "@/types/category";
import { DesignCard } from "./DesignCard";
import { DesignViewer } from "./DesignViewer";
import { EditDesignModal } from "./EditDesignModal";
import { SearchBar } from "./SearchBar";
import { CategoryFilter } from "./CategoryFilter";
import { GallerySkeletonGrid } from "./SkeletonLoaders";
import { useToast } from "./Toast";
import { useAdminAuth } from "@/lib/admin-auth";
import { useCatalogCache } from "@/lib/image-cache";
import { Sparkles, UploadCloud, ChevronRight, Layers, CheckCircle2 } from "lucide-react";

interface GalleryProps {
  initialDesigns?: Design[];
  categories: Category[];
  onOpenSync?: () => void;
  isAdmin?: boolean;
}

export function Gallery({
  initialDesigns = [],
  categories,
  onOpenSync,
  isAdmin = false,
}: GalleryProps) {
  const { isAdmin: authIsAdmin } = useAdminAuth();
  const effectiveIsAdmin = isAdmin || authIsAdmin;
  const { success, error, warning } = useToast();

  const [designs, setDesigns] = useState<Design[]>(initialDesigns);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(initialDesigns.length);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Background Cache for all designs on device
  const { isCached, cachedCount, totalCount } = useCatalogCache(designs);

  // Filters state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name_asc" | "name_desc">("newest");

  // Lightbox & Modal states
  const [activeDesign, setActiveDesign] = useState<Design | null>(null);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);

  // Debounced fetch
  const fetchDesigns = useCallback(
    async (pageNum = 1, append = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category && category !== "all") params.set("category", category);
        if (search.trim()) params.set("search", search.trim());
        if (sortBy) params.set("sort", sortBy);
        params.set("page", String(pageNum));
        params.set("limit", "500");

        const res = await fetch(`/api/designs?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch designs");
        const data = await res.json();

        if (append) {
          setDesigns((prev) => [...prev, ...(data.designs || [])]);
        } else {
          setDesigns(data.designs || []);
        }
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setHasMore(data.hasMore || false);
      } catch (err: any) {
        error("Could not load designs. Please check your connection.");
      } finally {
        setLoading(false);
      }
    },
    [category, search, sortBy, error]
  );

  // Trigger search on filter changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDesigns(1, false);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchDesigns]);

  // Handle Favorite Toggle
  const handleToggleFavorite = async (id: string, current: boolean) => {
    const nextState = !current;
    // Optimistic UI update
    setDesigns((prev) =>
      prev.map((d) => (d.id === id ? { ...d, is_favorite: nextState } : d))
    );
    if (activeDesign && activeDesign.id === id) {
      setActiveDesign({ ...activeDesign, is_favorite: nextState });
    }

    try {
      const res = await fetch(`/api/designs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: nextState }),
      });
      if (!res.ok) throw new Error();
      if (nextState) {
        success("Added to favorites");
      } else {
        success("Removed from favorites");
      }
    } catch {
      // Revert optimistic update
      setDesigns((prev) =>
        prev.map((d) => (d.id === id ? { ...d, is_favorite: current } : d))
      );
      error("Failed to update favorite status");
    }
  };

  // Handle Delete
  const handleDeleteDesign = async (id: string) => {
    try {
      const res = await fetch(`/api/designs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setDesigns((prev) => prev.filter((d) => d.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      success("✓ Design deleted successfully");
    } catch (err: any) {
      error("Could not delete design. Please try again.");
    }
  };

  // Handle Edit Save
  const handleSaveEdit = async (id: string, updates: Partial<Design>) => {
    try {
      const res = await fetch(`/api/designs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Update failed");
      const { design } = await res.json();

      setDesigns((prev) => prev.map((d) => (d.id === id ? design : d)));
      if (activeDesign && activeDesign.id === id) {
        setActiveDesign(design);
      }
      success("✓ Design updated");
    } catch (err: any) {
      error("Failed to save changes");
    }
  };

  // Recently added items (top 4 newest)
  const recentlyAdded = designs.slice(0, 4);

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* Search & Category Filter Controls */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-[#EBE5DD] shadow-soft space-y-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by ID (e.g. EMB-0027), flower, peacock, blouse..."
        />

        <CategoryFilter
          categories={categories}
          selectedCategory={category}
          onSelectCategory={setCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {/* Recently Added Section (Requirement 25) */}
      {!search && category === "all" && recentlyAdded.length > 0 && page === 1 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <h2 className="font-serif-luxury text-base sm:text-lg font-bold text-[#1C1917] tracking-wide">
                RECENTLY ADDED
              </h2>
            </div>
            <span className="text-xs text-[#C5A059] font-medium tracking-wide">
              Latest Studio Creations
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {recentlyAdded.map((d) => (
              <DesignCard
                key={`recent-${d.id}`}
                design={d}
                onOpen={(design) => setActiveDesign(design)}
                onToggleFavorite={handleToggleFavorite}
                priority
              />
            ))}
          </div>
        </section>
      )}

      {/* Main Grid Header info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#1C1917]">
              {category === "all" ? "All Designs" : categories.find((c) => c.id === category)?.name || "Designs"}
            </h2>
            {isCached ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-medium animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Saved on Device ({designs.length} ready offline)</span>
              </span>
            ) : cachedCount > 0 && cachedCount < totalCount ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-[11px] font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Pre-downloading ({cachedCount}/{totalCount})</span>
              </span>
            ) : null}
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {total} {total === 1 ? "design" : "designs"} available
          </p>
        </div>

        {onOpenSync && effectiveIsAdmin && (
          <button
            onClick={onOpenSync}
            className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C1917] text-white text-xs font-semibold shadow"
          >
            <UploadCloud className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>+ Sync</span>
          </button>
        )}
      </div>

      {/* Design Grid */}
      {loading && designs.length === 0 ? (
        <GallerySkeletonGrid count={12} />
      ) : designs.length === 0 ? (
        /* Empty States (Requirement 39) */
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-[#EBE5DD] shadow-soft space-y-4 max-w-lg mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-[#FAF3E7] text-[#C5A059] mx-auto flex items-center justify-center">
            <Layers className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif-luxury text-xl font-bold text-[#1C1917]">
              {search ? "No designs found" : "No embroidery designs yet"}
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              {search
                ? `No designs match "${search}". Try searching for floral, border, or an ID like EMB-0001.`
                : "Upload your first designs from your phone to start building your digital embroidery catalog."}
            </p>
          </div>

          {onOpenSync && effectiveIsAdmin && !search && (
            <button
              onClick={onOpenSync}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1C1917] hover:bg-[#332E2A] text-white font-semibold text-xs tracking-wider shadow cursor-pointer border border-[#C5A059]/50"
            >
              <UploadCloud className="w-4 h-4 text-[#C5A059]" />
              <span>UPLOAD DESIGNS</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          {designs.map((design) => (
            <DesignCard
              key={design.id}
              design={design}
              onOpen={(d) => setActiveDesign(d)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}

      {/* Load More Button / Pagination */}
      {hasMore && (
        <div className="text-center pt-6">
          <button
            onClick={() => fetchDesigns(page + 1, true)}
            disabled={loading}
            className="px-6 py-2.5 rounded-full bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold border border-[#EBE5DD] shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Loading more designs..." : "Load More Designs"}
          </button>
        </div>
      )}

      {/* Lightbox Design Viewer */}
      <DesignViewer
        design={activeDesign}
        designs={designs}
        onClose={() => setActiveDesign(null)}
        onNavigate={(d) => setActiveDesign(d)}
        onToggleFavorite={handleToggleFavorite}
        onDelete={effectiveIsAdmin ? handleDeleteDesign : undefined}
        onEdit={effectiveIsAdmin ? (d) => setEditingDesign(d) : undefined}
        isAdmin={effectiveIsAdmin}
      />

      {/* Admin Edit Modal */}
      <EditDesignModal
        design={editingDesign}
        categories={categories}
        isOpen={Boolean(editingDesign)}
        onClose={() => setEditingDesign(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
