import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cloudinaryStorage } from "@/lib/storage/cloudinary";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const design = await db.getDesignById(id);
    if (!design) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }
    return NextResponse.json(design);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to retrieve design", message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await db.updateDesign(id, {
      name: body.name,
      description: body.description,
      category_id: body.category_id,
      is_favorite: body.is_favorite,
    });

    if (!updated) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, design: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update design", message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const design = await db.getDesignById(id);

    if (!design) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    // 1. Delete from Cloudinary if not a demo/data-uri image
    if (design.cloudinary_public_id && !design.cloudinary_public_id.startsWith("demo_")) {
      try {
        await cloudinaryStorage.delete(design.cloudinary_public_id);
      } catch (cloudErr) {
        console.warn("Cloudinary delete warning for:", design.cloudinary_public_id, cloudErr);
      }
    }

    // 2. Delete from database
    const deleted = await db.deleteDesign(design.id);

    return NextResponse.json({
      success: true,
      message: "Design deleted successfully",
      deletedDesign: deleted,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete design", message: error.message },
      { status: 500 }
    );
  }
}
