"use client";

import React, { useState } from "react";
import { useAdminAuth } from "@/lib/admin-auth";
import { useToast } from "@/components/Toast";
import { Shield, Lock, X, ArrowRight, CheckCircle2 } from "lucide-react";

interface PinUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PinUnlockModal({ isOpen, onClose, onSuccess }: PinUnlockModalProps) {
  const { loginWithPin } = useAdminAuth();
  const { success, error } = useToast();
  const [pin, setPin] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = loginWithPin(pin);
    if (ok) {
      success("Studio unlocked! Your phone will remember you.");
      setPin("");
      onClose();
      onSuccess?.();
    } else {
      error("Incorrect PIN. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FAF8F5] rounded-3xl max-w-sm w-full p-6 shadow-modal border border-[#EBE5DD] space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-[#EBE5DD] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1C1917] text-[#C5A059] flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-serif-luxury text-lg font-bold text-[#1C1917]">
              Studio Owner Access
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-stone-500 leading-relaxed">
            Enter your 4-digit PIN to unlock upload and management features on this phone.
          </p>

          <div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full text-center tracking-widest text-lg font-mono px-4 py-3 rounded-xl bg-white border border-[#EBE5DD] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 p-2.5 rounded-xl">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>This phone will stay unlocked permanently. Customers you share the link with will never see this.</span>
          </div>

          <button
            type="submit"
            disabled={!pin}
            className="w-full py-3 rounded-xl bg-[#1C1917] hover:bg-[#332E2A] text-white text-xs font-bold tracking-wider shadow cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>UNLOCK STUDIO</span>
            <ArrowRight className="w-4 h-4 text-[#C5A059]" />
          </button>
        </form>
      </div>
    </div>
  );
}
