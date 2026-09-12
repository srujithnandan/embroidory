"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { SyncModal } from "@/components/SyncModal";
import { Category } from "@/types/category";
import { useAdminAuth } from "@/lib/admin-auth";
import { Lock, ShieldCheck } from "lucide-react";

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAdmin } = useAdminAuth();
  const [syncOpen, setSyncOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const isPresentation = pathname === "/presentation";

  // Pre-load categories for sync modal
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCategories(data))
      .catch(() => {});
  }, []);

  return (
    <>
      {!isPresentation && <Header onOpenSync={() => setSyncOpen(true)} />}

      <main className="flex-1">{children}</main>

      {!isPresentation && (
        <footer className="border-t border-[#EBE5DD] py-6 sm:py-8 text-center text-xs text-stone-400 pb-20 sm:pb-8">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-serif-luxury font-medium text-stone-600">
              EMBROIDERY STUDIO — Beautiful Designs • Quality Embroidery
            </span>

            <div className="flex items-center gap-4">
              {isAdmin ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium text-[11px] bg-emerald-50 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Studio Mode Unlocked</span>
                </span>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-stone-400 hover:text-stone-700 text-[11px] transition-colors"
                  title="Studio Owner Access"
                >
                  <Lock className="w-3 h-3" />
                  <span>Studio Access</span>
                </Link>
              )}
            </div>
          </div>
        </footer>
      )}

      {!isPresentation && <MobileNav onOpenSync={() => setSyncOpen(true)} />}

      <SyncModal
        isOpen={syncOpen}
        onClose={() => setSyncOpen(false)}
        categories={categories}
        onSyncComplete={() => {
          window.location.reload();
        }}
      />
    </>
  );
}
