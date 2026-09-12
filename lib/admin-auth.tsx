"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AdminAuthContextType {
  isAdmin: boolean;
  loginWithPin: (pin: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_STORAGE_KEY = "embroidery_studio_admin_session";
// Default simple studio PIN (can be customized or changed in .env)
const DEFAULT_STUDIO_PIN = "1234";

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (stored === "true") {
        setIsAdmin(true);
      }
    } catch {
      // Ignore localStorage errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithPin = (pin: string): boolean => {
    if (pin.trim() === DEFAULT_STUDIO_PIN) {
      setIsAdmin(true);
      try {
        localStorage.setItem(ADMIN_STORAGE_KEY, "true");
      } catch {}
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    try {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    } catch {}
  };

  return (
    <AdminAuthContext.Provider value={{ isAdmin, loginWithPin, logout, isLoading }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
