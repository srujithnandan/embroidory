"use client";

import React, { useState, useEffect } from "react";
import { Design } from "@/types/design";
import { Category } from "@/types/category";
import { X, Save } from "lucide-react";

interface EditDesignModalProps {
  design: Design | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Design>) => Promise<void>;
}

export function EditDesignModal({
  design,
  categories,
  isOpen,
  onClose,
  onSave,
}: EditDesignModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (design) {
      setName(design.name || "");
      setDescription(design.description || "");
      setCategoryId(design.category_id || "");
      setIsFavorite(design.is_favorite || false);
    }
  }, [design]);

  if (!isOpen || !design) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(design.id, {
        name: name.trim(),
        description: description.trim() || null,
        category_id: categoryId || null,
        is_favorite: isFavorite,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FAF8F5] rounded-2xl max-w-lg w-full p-6 shadow-modal border border-[#EBE5DD] space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-[#EBE5DD] pb-3">
          <div>
            <span className="font-mono font-bold text-xs text-[#C5A059] block">
              {design.design_id}
            </span>
            <h2 className="font-serif-luxury text-xl font-bold text-[#1C1917]">
              Edit Design Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Design Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Design Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EBE5DD] text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EBE5DD] text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Description / Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add stitch details, recommended fabrics, thread colors..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EBE5DD] text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
            />
          </div>

          {/* Favorite Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_favorite"
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
              className="w-4 h-4 rounded text-[#C5A059] focus:ring-[#C5A059] border-stone-300"
            />
            <label htmlFor="is_favorite" className="text-sm font-medium text-stone-700 cursor-pointer">
              Mark as Customer Favorite
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EBE5DD]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1C1917] hover:bg-[#332E2A] text-white text-sm font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#C5A059]" />
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
