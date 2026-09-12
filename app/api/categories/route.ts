import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const categories = await db.getCategories();
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch categories", message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const category = await db.createCategory(name);
    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create category", message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name } = body;
    if (!id || !name?.trim()) {
      return NextResponse.json({ error: "Category ID and name are required" }, { status: 400 });
    }

    const updated = await db.updateCategory(id, name);
    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update category", message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const success = await db.deleteCategory(id);
    return NextResponse.json({ success, message: "Category deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete category", message: error.message },
      { status: 500 }
    );
  }
}
