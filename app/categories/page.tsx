import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { FolderTree, Sparkles, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Categories • EMBROIDERY STUDIO",
  description: "Browse embroidery designs categorized by style, garment, and occasion.",
};

export default async function CategoriesPage() {
  const categories = await db.getCategories();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#FAF3E7] text-[#C5A059] flex items-center justify-center shadow-xs">
          <FolderTree className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1C1917]">
            Design Categories
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Explore our embroidery portfolio organized by style, garment type, and occasion.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/?category=${cat.id}`}
            className="group bg-white rounded-2xl p-5 sm:p-6 border border-[#EBE5DD] shadow-soft hover:border-[#C5A059] hover:shadow-card-hover transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] group-hover:bg-[#FAF3E7] text-stone-700 group-hover:text-[#C5A059] flex items-center justify-center transition-colors">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-serif-luxury text-base sm:text-lg font-bold text-[#1C1917] group-hover:text-[#C5A059] transition-colors">
                {cat.name}
              </h3>
            </div>

            <div className="flex items-center justify-between pt-4 mt-2 border-t border-stone-100 text-xs text-stone-500 font-medium">
              <span>{cat.design_count || 0} designs</span>
              <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-[#C5A059] group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
