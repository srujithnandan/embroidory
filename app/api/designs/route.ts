import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DesignFilterParams } from "@/types/design";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const favoriteParam = searchParams.get("favorite");
    const favorite = favoriteParam === "true" ? true : undefined;
    const sort = (searchParams.get("sort") as DesignFilterParams["sort"]) || "newest";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "36", 10);

    const result = await db.getDesigns({
      category,
      search,
      favorite,
      sort,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/designs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch designs", message: error.message },
      { status: 500 }
    );
  }
}
