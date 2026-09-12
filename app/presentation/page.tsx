import React from "react";
import { db } from "@/lib/db";
import { PresentationMode } from "@/components/PresentationMode";

export const metadata = {
  title: "Showroom • EMBROIDERY STUDIO",
  description: "Browse curated embroidery designs in distraction-free customer showroom mode.",
};

export default async function PresentationPage() {
  const [designsData, categories] = await Promise.all([
    db.getDesigns({ limit: 60 }),
    db.getCategories(),
  ]);

  return (
    <PresentationMode
      initialDesigns={designsData.designs}
      categories={categories}
    />
  );
}
