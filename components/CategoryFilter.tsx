"use client";

import React from "react";
import { Category } from "@/types/category";
import { SlidersHorizontal } from "lucide-react";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  sortBy: string;
  onSortChange: (sort: "newest" | "oldest" | "name_asc" | "name_desc") => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  sortBy,
  onSortChange,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Category Pills (Horizontal scrolling with touch gestures) */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => onSelectCategory("all")}
          className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
            selectedCategory === "all"
              ? "bg-[#1C1917] text-[#FAF8F5] shadow-sm"
              : "bg-white text-stone-600 border border-[#EBE5DD] hover:bg-[#F3EFEA]"
          }`}
        >
          All Designs
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all flex items-center gap-1.5 ${
                isSelected
                  ? "bg-[#1C1917] text-[#FAF8F5] shadow-sm font-semibold"
                  : "bg-white text-stone-600 border border-[#EBE5DD] hover:bg-[#F3EFEA]"
              }`}
            >
              <span>{cat.name}</span>
              {typeof cat.design_count === "number" && cat.design_count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? "bg-[#C5A059] text-[#1C1917]"
                      : "bg-[#F3EFEA] text-stone-500"
                  }`}
                >
                  {cat.design_count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sort Selector */}
      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <SlidersHorizontal className="w-3.5 h-3.5 text-[#C5A059]" />
        <span className="text-xs text-stone-500 font-medium hidden sm:inline">Sort:</span>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as any)}
          className="bg-white border border-[#EBE5DD] rounded-lg px-2.5 py-1.5 text-xs text-stone-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#C5A059] shadow-sm cursor-pointer"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name_asc">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
        </select>
      </div>
    </div>
  );
}
