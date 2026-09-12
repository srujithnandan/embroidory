import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const hashes = Array.isArray(body.hashes) ? body.hashes : [];

    if (hashes.length === 0) {
      return NextResponse.json({ existingHashes: [], newHashes: [] });
    }

    const result = await db.checkDuplicateHashes(hashes);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Duplicate check error:", error);
    return NextResponse.json(
      { error: "Failed to check duplicates", message: error.message },
      { status: 500 }
    );
  }
}
