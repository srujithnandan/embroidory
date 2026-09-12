import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cloudinaryStorage } from "@/lib/storage/cloudinary";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fileHash = (formData.get("file_hash") as string) || "";
    const categoryId = (formData.get("category_id") as string) || null;
    const customName = (formData.get("name") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!fileHash) {
      return NextResponse.json(
        { error: "Image content hash is required for duplicate checking" },
        { status: 400 }
      );
    }

    // Validate mime type
    const mimeType = file.type.toLowerCase();
    const isAllowed = ALLOWED_MIME_TYPES.includes(mimeType) || file.name.match(/\.(jpe?g|png|webp|heic)$/i);
    if (!isAllowed) {
      return NextResponse.json(
        { error: `Unsupported file format. Please upload JPG, PNG, WEBP, or HEIC images.` },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds the 30MB limit.` },
        { status: 400 }
      );
    }

    // Check duplicate in database first
    const dupCheck = await db.checkDuplicateHashes([fileHash]);
    if (dupCheck.existingHashes.length > 0) {
      return NextResponse.json(
        {
          duplicate: true,
          message: `This embroidery design is already uploaded in your catalog.`,
        },
        { status: 200 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let publicId = `emb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let imageUrl = "";
    let thumbnailUrl = "";
    let width = 1200;
    let height = 1200;

    // Check if Cloudinary is configured with API Secret
    const hasCloudinarySecret = Boolean(process.env.CLOUDINARY_API_SECRET);

    // Determine folder structure based on category
    let targetFolder = "embroidery/designs";
    if (categoryId) {
      try {
        const categories = await db.getCategories();
        const matchedCat = categories.find((c) => c.id === categoryId);
        if (matchedCat) {
          const cleanCat = matchedCat.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
          targetFolder = `embroidery/designs/${cleanCat}`;
        }
      } catch {}
    }

    if (hasCloudinarySecret) {
      try {
        const uploadResult = await cloudinaryStorage.upload(buffer, {
          filename: file.name,
          folder: targetFolder,
        });
        publicId = uploadResult.publicId;
        imageUrl = uploadResult.url;
        thumbnailUrl = uploadResult.thumbnailUrl;
        if (uploadResult.width) width = uploadResult.width;
        if (uploadResult.height) height = uploadResult.height;
      } catch (cloudErr: any) {
        console.error("Cloudinary upload failed:", cloudErr);
        return NextResponse.json(
          { error: "Image storage upload failed", message: cloudErr.message },
          { status: 502 }
        );
      }
    } else {
      // Dev/Demo fallback: convert to base64 data URI so user can still test upload immediately
      const base64Data = buffer.toString("base64");
      const dataUri = `data:${file.type || "image/jpeg"};base64,${base64Data}`;
      imageUrl = dataUri;
      thumbnailUrl = dataUri;
    }

    // Generate human-friendly initial name from filename if not specified
    const fallbackName =
      file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]+/g, " ")
        .replace(/^\w/, (c) => c.toUpperCase())
        .trim() || "Untitled Design";

    const name = customName.trim() || fallbackName;

    // Create record in database
    const design = await db.createDesign({
      name,
      description: null,
      category_id: categoryId,
      cloudinary_public_id: publicId,
      cloudinary_url: imageUrl,
      thumbnail_url: thumbnailUrl,
      original_filename: file.name,
      file_hash: fileHash,
      file_size: file.size,
      width,
      height,
      is_favorite: false,
    });

    return NextResponse.json({
      success: true,
      duplicate: false,
      design,
    });
  } catch (error: any) {
    console.error("Upload handler error:", error);
    return NextResponse.json(
      { error: "Failed to process and save image", message: error.message },
      { status: 500 }
    );
  }
}
