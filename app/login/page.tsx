"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/admin-auth";
import { useToast } from "@/components/Toast";
import { Shield, Lock, ArrowRight, CheckCircle2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAdmin, loginWithPin } = useAdminAuth();
  const { success, error } = useToast();
  const [pin, setPin] = useState("");

  // If already logged in on this phone, redirect straight to admin dashboard
  useEffect(() => {
    if (isAdmin) {
      router.push("/admin");
    }
  }, [isAdmin, router]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = loginWithPin(pin);
    if (ok) {
      success("Welcome to Studio Management! Your phone will remember you.");
      router.push("/admin");
    } else {
      error("Incorrect PIN. Please try again.");
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE5DD] shadow-soft max-w-sm w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#1C1917] text-[#C5A059] mx-auto flex items-center justify-center shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="font-serif-luxury text-2xl font-bold text-[#1C1917]">
            Studio Owner Access
          </h1>
          <p className="text-xs text-stone-500">
            Unlock upload and catalog management for this phone.
          </p>
        </div>

        {/* PIN Form */}
        <form onSubmit={handlePinSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2 text-center">
              Enter 4-Digit Studio PIN
            </label>
            <div className="relative">
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full text-center text-2xl font-mono tracking-widest px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DD] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>You only enter this once. Your phone stays unlocked permanently!</span>
          </div>

          <button
            type="submit"
            disabled={!pin}
            className="w-full py-3.5 rounded-2xl bg-[#1C1917] hover:bg-[#332E2A] text-white font-semibold text-xs tracking-wider shadow transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 border border-[#C5A059]/40"
          >
            <span>UNLOCK ON THIS PHONE</span>
            <ArrowRight className="w-4 h-4 text-[#C5A059]" />
          </button>
        </form>
      </div>
    </div>
  );
}
