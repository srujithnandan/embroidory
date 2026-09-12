"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, Info, X, RefreshCw } from "lucide-react";

export type ToastType = "success" | "warning" | "error" | "info" | "duplicate";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  duplicate: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((msg: string) => addToast(msg, "success"), [addToast]);
  const error = useCallback((msg: string) => addToast(msg, "error", 5000), [addToast]);
  const warning = useCallback((msg: string) => addToast(msg, "warning"), [addToast]);
  const duplicate = useCallback((msg: string) => addToast(msg, "duplicate"), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warning, duplicate }}>
      {children}
      {/* Toast Render Area */}
      <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          let icon = <Info className="w-5 h-5 text-[#C5A059] shrink-0" />;
          let bgClass = "bg-[#1C1917] text-white";

          if (t.type === "success") {
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
          } else if (t.type === "warning") {
            icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
          } else if (t.type === "error") {
            icon = <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />;
          } else if (t.type === "duplicate") {
            icon = <RefreshCw className="w-5 h-5 text-amber-300 shrink-0" />;
            bgClass = "bg-[#292524] text-[#F3EFEA] border border-[#C5A059]/40";
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 ${bgClass}`}
            >
              <div className="flex items-center gap-3">
                {icon}
                <span className="text-sm font-medium leading-snug">{t.message}</span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
