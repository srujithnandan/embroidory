import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cloudinaryStorage } from "@/lib/storage/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action as "delete" | "change_category" | "favorite";
    const ids = Array.isArray(body.ids) ? body.ids : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: "No design IDs provided" }, { status: 400 });
    }

    if (action === "delete") {
      // Optional: attempt Cloudinary cleanup for non-demo items
      for (const id of ids) {
        const item = await db.getDesignById(id);
        if (item && item.cloudinary_public_id && !item.cloudinary_public_id.startsWith("demo_")) {
          cloudinaryStorage.delete(item.cloudinary_public_id).catch(() => {});
        }
      }
      const count = await db.bulkDelete(ids);
      return NextResponse.json({ success: true, count, message: `${count} designs deleted` });
    }

    if (action === "change_category") {
      const categoryId = body.categoryId;
      if (!categoryId) {
        return NextResponse.json({ error: "Category ID required" }, { status: 400 });
      }
      const count = await db.bulkUpdateCategory(ids, categoryId);
      return NextResponse.json({
        success: true,
        count,
        message: `${count} designs moved to new category`,
      });
    }

    if (action === "favorite") {
      const isFavorite = Boolean(body.isFavorite);
      const count = await db.bulkFavorite(ids, isFavorite);
      return NextResponse.json({
        success: true,
        count,
        message: `${count} designs updated`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Bulk action error:", error);
    return NextResponse.json(
      { error: "Bulk operation failed", message: error.message },
      { status: 500 }
    );
  }
}
