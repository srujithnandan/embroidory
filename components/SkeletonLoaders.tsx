import React from "react";

export function DesignCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#EBE5DD] overflow-hidden shadow-soft animate-pulse flex flex-col">
      <div className="aspect-[4/5] bg-stone-200/70 w-full" />
      <div className="p-3 sm:p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-16 bg-stone-200 rounded-md" />
          <div className="h-3.5 w-12 bg-stone-200 rounded-md" />
        </div>
        <div className="h-4 w-28 bg-stone-200 rounded-md" />
      </div>
    </div>
  );
}

export function GallerySkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <DesignCardSkeleton key={i} />
      ))}
    </div>
  );
}
