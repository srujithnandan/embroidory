import React from "react";
import { db } from "@/lib/db";
import { Gallery } from "@/components/Gallery";
import { Heart } from "lucide-react";

export const metadata = {
  title: "Favorites • VIHARI'S EMBROIDERY",
  description: "Most loved and popular embroidery designs.",
};

export default async function FavoritesPage() {
  const [designsData, categories] = await Promise.all([
    db.getDesigns({ favorite: true, limit: 500 }),
    db.getCategories(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shadow-xs">
          <Heart className="w-5 h-5 fill-current" />
        </div>
        <div>
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1C1917]">
            Customer Favorites
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Frequently requested patterns and timeless customer favorites.
          </p>
        </div>
      </div>

      <Gallery
        initialDesigns={designsData.designs}
        categories={categories}
      />
    </div>
  );
}
