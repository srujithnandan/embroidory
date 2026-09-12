"use client";

import React, { useState } from "react";
import { AdminDashboard } from "@/components/AdminDashboard";
import { SyncModal } from "@/components/SyncModal";
import { Category } from "@/types/category";
import { Design } from "@/types/design";
import { useRouter } from "next/navigation";

interface AdminDashboardClientWrapperProps {
  categories: Category[];
  recentDesigns: Design[];
}

export function AdminDashboardClientWrapper({
  categories,
  recentDesigns,
}: AdminDashboardClientWrapperProps) {
  const router = useRouter();
  const [syncOpen, setSyncOpen] = useState(false);

  return (
    <>
      <AdminDashboard
        onOpenSync={() => setSyncOpen(true)}
        categories={categories}
        recentDesigns={recentDesigns}
      />

      <SyncModal
        isOpen={syncOpen}
        onClose={() => setSyncOpen(false)}
        categories={categories}
        onSyncComplete={() => {
          router.refresh();
        }}
      />
    </>
  );
}
