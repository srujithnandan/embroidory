"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/lib/admin-auth";
import { PinUnlockModal } from "./PinUnlockModal";
import {
  UploadCloud,
  FolderTree,
  LayoutGrid,
  Shield,
  Menu,
  X,
  Eye,
  Lock,
  Unlock,
  Heart,
} from "lucide-react";

interface HeaderProps {
  onOpenSync?: () => void;
}

export function Header({ onOpenSync }: HeaderProps) {
  const pathname = usePathname();
  const { isAdmin, logout } = useAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EBE5DD] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#1C1917] to-[#38332F] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 text-[#C5A059]"
              >
                <circle cx="12" cy="12" r="9" strokeOpacity="0.4" />
                <path d="m14 7-8 8" />
                <path d="M14 7a2 2 0 1 0 2-2 2 2 0 0 0-2 2z" />
                <path d="m11 10 3 3" />
                <path d="m8 13 3 3" strokeOpacity="0.6" />
              </svg>
            </div>
            <div>
              <span className="font-serif-luxury text-xl sm:text-2xl font-bold tracking-wider text-[#1C1917] block leading-none">
                VIHARI&apos;S EMBROIDERY
              </span>
              <span className="text-[11px] uppercase tracking-widest text-[#C5A059] font-medium block mt-1">
                Beautiful Designs • Quality Embroidery
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5">
            <Link
              href="/"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/")
                  ? "bg-[#EBE5DD]/60 text-[#1C1917] font-semibold"
                  : "text-stone-600 hover:text-[#1C1917] hover:bg-[#F3EFEA]"
              }`}
            >
              Gallery
            </Link>
            <Link
              href="/categories"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/categories")
                  ? "bg-[#EBE5DD]/60 text-[#1C1917] font-semibold"
                  : "text-stone-600 hover:text-[#1C1917] hover:bg-[#F3EFEA]"
              }`}
            >
              Categories
            </Link>
            <Link
              href="/favorites"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/favorites")
                  ? "bg-[#EBE5DD]/60 text-[#1C1917] font-semibold"
                  : "text-stone-600 hover:text-[#1C1917] hover:bg-[#F3EFEA]"
              }`}
            >
              Favorites
            </Link>
            <Link
              href="/presentation"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive("/presentation")
                  ? "bg-[#C5A059]/15 text-[#9E7A32] font-semibold"
                  : "text-stone-600 hover:text-[#9E7A32] hover:bg-[#FAF3E7]"
              }`}
              title="Customer Presentation Showroom"
            >
              <Eye className="w-4 h-4 text-[#C5A059]" />
              Presentation Mode
            </Link>

            {/* Admin Link - Only visible when Mom unlocks on her device */}
            {isAdmin && (
              <Link
                href="/admin"
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith("/admin")
                    ? "bg-[#EBE5DD]/60 text-[#1C1917] font-semibold"
                    : "text-stone-600 hover:text-[#1C1917] hover:bg-[#F3EFEA]"
                }`}
              >
                <Shield className="w-4 h-4 text-stone-500" />
                Admin
              </Link>
            )}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {isAdmin ? (
              <>
                <button
                  onClick={onOpenSync}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1C1917] hover:bg-[#332E2A] text-[#FAF8F5] text-sm font-semibold shadow-md transition-all transform active:scale-95 cursor-pointer border border-[#C5A059]/40"
                >
                  <UploadCloud className="w-4 h-4 text-[#C5A059]" />
                  <span>+ SYNC DESIGNS</span>
                </button>

                <button
                  onClick={logout}
                  title="Lock Studio on this device"
                  className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
                >
                  <Unlock className="w-4 h-4 text-[#C5A059]" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setPinModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
                title="Studio Owner Unlock"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Studio</span>
              </button>
            )}
          </div>

          {/* Mobile Right */}
          <div className="flex sm:hidden items-center gap-2">
            {isAdmin && (
              <button
                onClick={onOpenSync}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold shadow border border-[#C5A059]/50"
              >
                <UploadCloud className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>+ SYNC</span>
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-700 hover:bg-[#EBE5DD]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#EBE5DD] bg-[#FAF8F5] px-4 pt-2 pb-5 space-y-1">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-800 font-medium hover:bg-[#EBE5DD]/50"
          >
            <LayoutGrid className="w-5 h-5 text-[#C5A059]" />
            <span>Full Catalog Gallery</span>
          </Link>
          <Link
            href="/categories"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-800 font-medium hover:bg-[#EBE5DD]/50"
          >
            <FolderTree className="w-5 h-5 text-[#C5A059]" />
            <span>Browse Categories</span>
          </Link>
          <Link
            href="/favorites"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-800 font-medium hover:bg-[#EBE5DD]/50"
          >
            <Heart className="w-5 h-5 text-rose-500" />
            <span>Customer Favorites</span>
          </Link>
          <Link
            href="/presentation"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-800 font-medium bg-[#FAF3E7] text-[#9E7A32]"
          >
            <Eye className="w-5 h-5 text-[#C5A059]" />
            <span>Presentation Mode (Customer Showroom)</span>
          </Link>

          {isAdmin ? (
            <>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-800 font-medium hover:bg-[#EBE5DD]/50"
              >
                <Shield className="w-5 h-5 text-stone-500" />
                <span>Admin Studio Dashboard</span>
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-500 font-medium hover:bg-stone-100"
              >
                <Lock className="w-4 h-4 text-stone-400" />
                <span>Lock Studio Mode</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setPinModalOpen(true);
              }}
              className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-500 text-xs font-medium hover:bg-stone-100"
            >
              <Lock className="w-4 h-4 text-stone-400" />
              <span>Studio Owner Unlock</span>
            </button>
          )}
        </div>
      )}

      {/* PIN Unlock Modal for Studio Owner */}
      <PinUnlockModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
      />
    </header>
  );
}
