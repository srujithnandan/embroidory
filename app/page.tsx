import React from "react";
import { db } from "@/lib/db";
import { Gallery } from "@/components/Gallery";
import Link from "next/link";
import { Eye, Sparkles } from "lucide-react";

export default async function HomePage() {
  const [designsData, categories] = await Promise.all([
    db.getDesigns({ limit: 36 }),
    db.getCategories(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Editorial Welcome Banner */}
      <div className="text-center py-4 sm:py-8 space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FAF3E7] text-[#C5A059] text-xs font-semibold tracking-wider uppercase border border-[#C5A059]/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Haute Couture & Atelier Embroidery</span>
        </div>
        <h1 className="font-serif-luxury text-3xl sm:text-5xl font-bold tracking-tight text-[#1C1917] leading-tight">
          Exquisite Embroidery Catalog
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 leading-relaxed max-w-lg mx-auto">
          Browse our permanent collection of handcrafted needlework, bridal motifs, and contemporary designs. Every piece cataloged with precision.
        </p>

        {/* Presentation Mode Callout for mom when with a customer */}
        <div className="pt-2">
          <Link
            href="/presentation"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-stone-50 border border-[#C5A059]/40 text-[#9E7A32] text-xs font-semibold shadow-xs transition-all hover:shadow-sm"
          >
            <Eye className="w-4 h-4 text-[#C5A059]" />
            <span>Showing a customer? Open Presentation Showroom</span>
          </Link>
        </div>
      </div>

      {/* Main Gallery with Search, Filters, Lightbox */}
      <Gallery
        initialDesigns={designsData.designs}
        categories={categories}
      />
    </div>
  );
}
