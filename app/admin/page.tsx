import React from "react";
import { db } from "@/lib/db";
import { AdminDashboardClientWrapper } from "./AdminDashboardClientWrapper";

export const metadata = {
  title: "Admin Dashboard • EMBROIDERY STUDIO",
  description: "Manage embroidery catalog, sync photos, and track collection stats.",
};

export default async function AdminPage() {
  const [categories, designsData] = await Promise.all([
    db.getCategories(),
    db.getDesigns({ limit: 12 }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AdminDashboardClientWrapper
        categories={categories}
        recentDesigns={designsData.designs}
      />
    </div>
  );
}
