"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, FolderTree, UploadCloud, Heart, Eye } from "lucide-react";

import { useAdminAuth } from "@/lib/admin-auth";

interface MobileNavProps {
  onOpenSync: () => void;
}

export function MobileNav({ onOpenSync }: MobileNavProps) {
  const pathname = usePathname();
  const { isAdmin } = useAdminAuth();

  // Don't show bottom bar when already in full presentation mode
  if (pathname === "/presentation") return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-t border-[#EBE5DD] px-2 py-1.5 shadow-lg safe-area-inset-bottom">
      <div className="flex items-center justify-around">
        {/* Gallery */}
        <Link
          href="/"
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[11px] font-medium transition-colors ${
            pathname === "/" ? "text-[#C5A059]" : "text-stone-500 hover:text-stone-900"
          }`}
        >
          <LayoutGrid className="w-5 h-5 mb-0.5" />
          <span>Gallery</span>
        </Link>

        {/* Categories */}
        <Link
          href="/categories"
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[11px] font-medium transition-colors ${
            pathname === "/categories" ? "text-[#C5A059]" : "text-stone-500 hover:text-stone-900"
          }`}
        >
          <FolderTree className="w-5 h-5 mb-0.5" />
          <span>Categories</span>
        </Link>

        {/* Center Prominent + SYNC Button (Only visible on Mom's phone / Admin mode) */}
        {isAdmin && (
          <button
            onClick={onOpenSync}
            className="flex flex-col items-center -mt-5 group focus:outline-none"
            aria-label="Sync new embroidery designs"
          >
            <div className="w-13 h-13 rounded-full bg-[#1C1917] text-[#FAF8F5] flex items-center justify-center shadow-lg border-2 border-[#C5A059] group-active:scale-95 transition-transform">
              <UploadCloud className="w-6 h-6 text-[#C5A059]" />
            </div>
            <span className="text-[10px] font-bold text-[#1C1917] mt-0.5 tracking-wide uppercase">
              Sync
            </span>
          </button>
        )}

        {/* Favorites */}
        <Link
          href="/favorites"
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[11px] font-medium transition-colors ${
            pathname === "/favorites" ? "text-[#C5A059]" : "text-stone-500 hover:text-stone-900"
          }`}
        >
          <Heart className="w-5 h-5 mb-0.5 text-rose-500" />
          <span>Favorites</span>
        </Link>

        {/* Presentation */}
        <Link
          href="/presentation"
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[11px] font-medium transition-colors ${
            pathname === "/presentation" ? "text-[#C5A059]" : "text-stone-500 hover:text-stone-900"
          }`}
        >
          <Eye className="w-5 h-5 mb-0.5 text-[#C5A059]" />
          <span>Showroom</span>
        </Link>
      </div>
    </div>
  );
}
