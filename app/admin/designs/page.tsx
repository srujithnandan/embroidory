"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Design } from "@/types/design";
import { Category } from "@/types/category";
import { DesignCard } from "@/components/DesignCard";
import { DesignViewer } from "@/components/DesignViewer";
import { EditDesignModal } from "@/components/EditDesignModal";
import { useToast } from "@/components/Toast";
import {
  Trash2,
  FolderTree,
  Heart,
  CheckSquare,
  Square,
  ChevronLeft,
  X,
  AlertTriangle,
} from "lucide-react";

export default function BulkDesignsManagementPage() {
  const { success, error } = useToast();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Lightbox & Edit Modals
  const [activeDesign, setActiveDesign] = useState<Design | null>(null);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);

  // Modals for Bulk Action
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategoryToAssign, setSelectedCategoryToAssign] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [desRes, catRes] = await Promise.all([
        fetch("/api/designs?limit=500"),
        fetch("/api/categories"),
      ]);

      if (desRes.ok && catRes.ok) {
        const desData = await desRes.json();
        const catData = await catRes.json();
        setDesigns(desData.designs || []);
        setCategories(catData || []);
      }
    } catch (err) {
      error("Failed to load catalog data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === designs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(designs.map((d) => d.id));
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    try {
      const res = await fetch("/api/designs/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", ids: selectedIds }),
      });
      if (!res.ok) throw new Error();
      success(`✓ ${selectedIds.length} designs deleted successfully`);
      setSelectedIds([]);
      setShowDeleteConfirm(false);
      loadData();
    } catch {
      error("Failed to delete selected designs");
    }
  };

  // Bulk Category Update
  const handleBulkCategory = async () => {
    if (!selectedCategoryToAssign) return;
    try {
      const res = await fetch("/api/designs/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_category",
          ids: selectedIds,
          categoryId: selectedCategoryToAssign,
        }),
      });
      if (!res.ok) throw new Error();
      success(`✓ ${selectedIds.length} designs updated to new category`);
      setSelectedIds([]);
      setShowCategoryModal(false);
      loadData();
    } catch {
      error("Failed to update categories");
    }
  };

  // Bulk Favorite
  const handleBulkFavorite = async (isFavorite: boolean) => {
    try {
      const res = await fetch("/api/designs/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "favorite",
          ids: selectedIds,
          isFavorite,
        }),
      });
      if (!res.ok) throw new Error();
      success(`✓ ${selectedIds.length} designs updated`);
      setSelectedIds([]);
      loadData();
    } catch {
      error("Failed to update favorites");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-28">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1C1917]">
            Bulk Design Management
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Select multiple embroidery designs to perform batch operations.
          </p>
        </div>

        {/* Selection Tools */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#EBE5DD] text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors shadow-xs"
          >
            {selectedIds.length === designs.length && designs.length > 0 ? (
              <>
                <CheckSquare className="w-4 h-4 text-[#C5A059]" />
                <span>Deselect All</span>
              </>
            ) : (
              <>
                <Square className="w-4 h-4 text-stone-400" />
                <span>Select All ({designs.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Gallery Grid in Selectable Mode */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {designs.map((design) => (
          <DesignCard
            key={design.id}
            design={design}
            onOpen={(d) => setActiveDesign(d)}
            selectable
            selected={selectedIds.includes(design.id)}
            onToggleSelect={toggleSelect}
          />
        ))}
      </div>

      {/* Floating Action Bar (Requirement 29: '12 designs selected') */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 max-w-2xl mx-auto z-40 bg-[#1C1917] text-white rounded-2xl p-3 sm:p-4 shadow-2xl border border-[#C5A059]/40 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-[#C5A059] text-[#1C1917] flex items-center justify-center font-bold text-xs">
              {selectedIds.length}
            </span>
            <span className="font-semibold text-sm">
              {selectedIds.length} {selectedIds.length === 1 ? "design" : "designs"} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Move to Category */}
            <button
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
            >
              <FolderTree className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Category</span>
            </button>

            {/* Favorite */}
            <button
              onClick={() => handleBulkFavorite(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
            >
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-current" />
              <span>Favorite</span>
            </button>

            {/* Bulk Delete */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold transition-colors shadow"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            {/* Dismiss Selection */}
            <button
              onClick={() => setSelectedIds([])}
              className="p-1.5 text-stone-400 hover:text-white"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bulk Category Change Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] text-stone-900 rounded-2xl max-w-md w-full p-6 shadow-modal border border-[#EBE5DD] space-y-4">
            <h3 className="font-serif-luxury text-xl font-bold">Move Designs to Category</h3>
            <p className="text-xs text-stone-500">
              Select the category to apply to all {selectedIds.length} selected designs:
            </p>
            <select
              value={selectedCategoryToAssign}
              onChange={(e) => setSelectedCategoryToAssign(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white border border-[#EBE5DD] text-sm focus:ring-2 focus:ring-[#C5A059]"
            >
              <option value="">Select a category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-200"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkCategory}
                disabled={!selectedCategoryToAssign}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#1C1917] text-white shadow disabled:opacity-50"
              >
                Apply Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal (Requirement 29) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] text-stone-900 rounded-2xl max-w-md w-full p-6 shadow-modal border border-[#EBE5DD] space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-serif-luxury text-xl font-bold text-stone-900">
              Delete {selectedIds.length} Designs?
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              This action cannot be undone. All {selectedIds.length} selected designs will be permanently removed from your online catalog and cloud storage.
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-200"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow"
              >
                Delete {selectedIds.length} Designs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      <DesignViewer
        design={activeDesign}
        designs={designs}
        onClose={() => setActiveDesign(null)}
        onNavigate={(d) => setActiveDesign(d)}
        isAdmin
      />
    </div>
  );
}
