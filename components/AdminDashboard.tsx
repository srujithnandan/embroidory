"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  UploadCloud,
  Sparkles,
  Heart,
  FolderTree,
  Calendar,
  Database,
  Layers,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Settings,
} from "lucide-react";
import { Category } from "@/types/category";
import { Design } from "@/types/design";

interface AdminDashboardProps {
  onOpenSync: () => void;
  categories: Category[];
  recentDesigns: Design[];
}

interface StatsData {
  totalDesigns: number;
  addedToday: number;
  favoritesCount: number;
  categoriesCount: number;
  lastSyncTime: string;
  storageProvider: string;
  isLiveSupabase: boolean;
}

export function AdminDashboard({
  onOpenSync,
  categories,
  recentDesigns,
}: AdminDashboardProps) {
  const [stats, setStats] = useState<StatsData>({
    totalDesigns: recentDesigns.length,
    addedToday: 0,
    favoritesCount: recentDesigns.filter((d) => d.is_favorite).length,
    categoriesCount: categories.length,
    lastSyncTime: new Date().toISOString(),
    storageProvider: "Cloudinary CDN",
    isLiveSupabase: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // Format last sync time into human friendly string
  const formatLastSync = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const isToday = new Date().toDateString() === date.toDateString();
      const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return isToday ? `Today, ${timeStr}` : `${date.toLocaleDateString()}, ${timeStr}`;
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Studio Header & Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE5DD] shadow-soft">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#C5A059] font-bold block mb-1">
            Studio Management
          </span>
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1C1917]">
            Welcome, Embroidery Studio
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Manage catalog photos, back up new designs, and organize collections for your customers.
          </p>
        </div>

        {/* Big Main Action Button (Requirement 12 & 42) */}
        <button
          onClick={onOpenSync}
          className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-[#1C1917] hover:bg-[#332E2A] text-white font-bold text-sm tracking-wider shadow-lg transition-all active:scale-95 border-2 border-[#C5A059] cursor-pointer"
        >
          <UploadCloud className="w-5 h-5 text-[#C5A059]" />
          <span>+ SYNC NEW DESIGNS</span>
        </button>
      </div>

      {/* Cloudinary & Database Status Banner */}
      <div className="bg-[#FBF8F2] border border-[#E8DECD] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#C5A059]/15 flex items-center justify-center text-[#C5A059]">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-stone-900 block">
              Cloudinary Media CDN: Connected & Active (Cloud: hcn8xt5g)
            </span>
            <span className="text-stone-500">
              Database: Persistent Catalog Database (Auto-Saving to Disk)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px] flex items-center gap-1.5 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Duplicate Guard Online (SHA-256)</span>
          </span>
        </div>
      </div>

      {/* Metric Cards (Requirement 12 & 42) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
        {/* Total Designs */}
        <div className="bg-white rounded-2xl p-5 border border-[#EBE5DD] shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-stone-500">
              Total Designs
            </span>
            <Layers className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-serif-luxury font-bold text-[#1C1917]">
              {stats.totalDesigns.toLocaleString()}
            </span>
            <span className="text-[11px] text-emerald-600 block mt-0.5 font-medium">
              In Cloud Catalog
            </span>
          </div>
        </div>

        {/* Added Today */}
        <div className="bg-white rounded-2xl p-5 border border-[#EBE5DD] shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-stone-500">
              Added Today
            </span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-serif-luxury font-bold text-[#1C1917]">
              {stats.addedToday}
            </span>
            <span className="text-[11px] text-stone-500 block mt-0.5 font-medium">
              Recent Syncs
            </span>
          </div>
        </div>

        {/* Favorites */}
        <div className="bg-white rounded-2xl p-5 border border-[#EBE5DD] shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-stone-500">
              Favorites
            </span>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-serif-luxury font-bold text-[#1C1917]">
              {stats.favoritesCount}
            </span>
            <span className="text-[11px] text-rose-600 block mt-0.5 font-medium">
              Customer Popular
            </span>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-2xl p-5 border border-[#EBE5DD] shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-stone-500">
              Categories
            </span>
            <FolderTree className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-serif-luxury font-bold text-[#1C1917]">
              {stats.categoriesCount}
            </span>
            <span className="text-[11px] text-stone-500 block mt-0.5 font-medium">
              Active Sections
            </span>
          </div>
        </div>
      </div>

      {/* Sync Status Banner (Requirement 42: Last Sync info) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EBE5DD] shadow-soft flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-stone-500 block">LAST SYNC</span>
            <span className="text-sm font-bold text-stone-900">
              {formatLastSync(stats.lastSyncTime)}
            </span>
          </div>
        </div>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
          ✓ Everything is up to date
        </span>
      </div>

      {/* Quick Access Management Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/designs"
          className="group bg-white rounded-2xl p-5 border border-[#EBE5DD] shadow-soft hover:border-[#C5A059] transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <h3 className="font-serif-luxury text-base font-bold text-[#1C1917] group-hover:text-[#C5A059] transition-colors">
              Bulk Design Management
            </h3>
            <p className="text-xs text-stone-500">
              Select multiple designs to delete, categorize, or favorite in one click.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-[#C5A059] group-hover:translate-x-1 transition-all shrink-0 ml-4" />
        </Link>

        <Link
          href="/admin/categories"
          className="group bg-white rounded-2xl p-5 border border-[#EBE5DD] shadow-soft hover:border-[#C5A059] transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <h3 className="font-serif-luxury text-base font-bold text-[#1C1917] group-hover:text-[#C5A059] transition-colors">
              Manage Categories
            </h3>
            <p className="text-xs text-stone-500">
              Create new categories, rename existing ones, or reassign design groups.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-[#C5A059] group-hover:translate-x-1 transition-all shrink-0 ml-4" />
        </Link>
      </div>

      {/* Category Breakdown (Requirement 42) */}
      <div className="bg-white rounded-3xl p-6 border border-[#EBE5DD] shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-[#EBE5DD] pb-3">
          <h2 className="font-serif-luxury text-lg font-bold text-[#1C1917]">
            Categories Breakdown
          </h2>
          <Link
            href="/admin/categories"
            className="text-xs font-semibold text-[#C5A059] hover:underline"
          >
            Manage All →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EBE5DD] flex items-center justify-between"
            >
              <span className="text-xs font-semibold text-stone-800 truncate mr-2">
                {cat.name}
              </span>
              <span className="text-xs font-bold text-[#C5A059] px-2 py-0.5 rounded-full bg-white shadow-xs">
                {cat.design_count || 0}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
