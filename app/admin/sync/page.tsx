"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SyncModal } from "@/components/SyncModal";
import { Category } from "@/types/category";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function AdminSyncPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCategories(data))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Admin Dashboard</span>
      </Link>
      <div className="relative">
        <SyncModal
          isOpen={true}
          onClose={() => router.push("/admin")}
          categories={categories}
          onSyncComplete={() => {
            router.push("/admin");
          }}
        />
      </div>
    </div>
  );
}
