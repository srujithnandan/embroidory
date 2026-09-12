"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Category } from "@/types/category";
import { useToast } from "@/components/Toast";
import {
  FolderPlus,
  Edit2,
  Trash2,
  ChevronLeft,
  Check,
  X,
  FolderTree,
  AlertCircle,
} from "lucide-react";

export default function CategoryManagementPage() {
  const { success, error, warning } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data || []);
      }
    } catch {
      error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim() }),
      });

      if (!res.ok) throw new Error();
      const { category } = await res.json();
      setCategories((prev) => [...prev, category]);
      setNewCatName("");
      success(`✓ Category "${category.name}" created`);
    } catch {
      error("Failed to add category");
    }
  };

  // Save Renamed Category
  const handleSaveRename = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      const res = await fetch("/api/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editingName.trim() }),
      });

      if (!res.ok) throw new Error();
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: editingName.trim() } : c))
      );
      setEditingId(null);
      success("✓ Category updated");
    } catch {
      error("Failed to update category");
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete category "${name}"? Designs in this category will be reassigned to "Other".`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setCategories((prev) => prev.filter((c) => c.id !== id));
      success(`✓ Category "${name}" deleted`);
    } catch {
      error("Failed to delete category");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-20">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 mb-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1C1917]">
          Category Management
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
          Organize your embroidery collection into intuitive categories for customers.
        </p>
      </div>

      {/* Add Category Form */}
      <form
        onSubmit={handleAddCategory}
        className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EBE5DD] shadow-soft flex flex-col sm:flex-row items-center gap-3"
      >
        <input
          type="text"
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          placeholder="New category name (e.g. Sleeves, Zardozi, Festive)..."
          className="w-full sm:flex-1 px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EBE5DD] text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
        />
        <button
          type="submit"
          disabled={!newCatName.trim()}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1C1917] hover:bg-[#332E2A] text-white text-xs font-semibold tracking-wider flex items-center justify-center gap-2 shadow disabled:opacity-50 cursor-pointer"
        >
          <FolderPlus className="w-4 h-4 text-[#C5A059]" />
          <span>ADD CATEGORY</span>
        </button>
      </form>

      {/* Categories List */}
      <div className="bg-white rounded-3xl border border-[#EBE5DD] shadow-soft overflow-hidden divide-y divide-[#EBE5DD]">
        {categories.map((cat) => {
          const isEditing = editingId === cat.id;

          return (
            <div
              key={cat.id}
              className="p-4 sm:px-6 flex items-center justify-between gap-3 hover:bg-stone-50/70 transition-colors"
            >
              {isEditing ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-[#C5A059] text-sm focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveRename(cat.id)}
                    className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                    title="Save"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FAF3E7] text-[#C5A059] flex items-center justify-center">
                    <FolderTree className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-stone-900 block">
                      {cat.name}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      {cat.design_count || 0} designs assigned
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!isEditing && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingId(cat.id);
                      setEditingName(cat.name);
                    }}
                    className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                    title="Rename"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
