import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { db } from "@/lib/db";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "hcn8xt5g";
const apiKey = process.env.CLOUDINARY_API_KEY || "169781418545283";
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

/**
 * Scans Cloudinary storage and imports any embroidery photos that might be missing
 * from the database catalog, ensuring 100% of files in storage are captured.
 */
export async function POST() {
  try {
    if (!apiSecret) {
      return NextResponse.json(
        { error: "Cloudinary API Secret is not configured." },
        { status: 400 }
      );
    }

    // 1. Get all current designs from local db
    const existingResult = await db.getDesigns({ limit: 10000 });
    const existingPublicIds = new Set(
      existingResult.designs.map((d) => d.cloudinary_public_id)
    );

    // 2. Query Cloudinary storage for all assets in embroidery/designs
    let allCloudResources: any[] = [];
    let nextCursor: string | undefined = undefined;

    do {
      const result: any = await cloudinary.api.resources({
        type: "upload",
        prefix: "embroidery/designs",
        max_results: 100,
        next_cursor: nextCursor,
      });

      if (result.resources) {
        allCloudResources = allCloudResources.concat(result.resources);
      }
      nextCursor = result.next_cursor;
    } while (nextCursor);

    // 3. Find any images in storage that aren't recorded in the catalog
    const missingInDb = allCloudResources.filter(
      (r) => !existingPublicIds.has(r.public_id)
    );

    let addedCount = 0;

    // 4. Register missing designs into catalog
    for (const res of missingInDb) {
      const cleanName = res.public_id
        .replace(/^embroidery\/designs\//, "")
        .replace(/_[0-9]+$/, "")
        .replace(/_/g, " ")
        .trim();

      const format = res.format || "jpg";
      const fullUrl = res.secure_url;
      const thumbnailUrl = fullUrl.includes("res.cloudinary.com")
        ? fullUrl.replace(
            "/image/upload/",
            "/image/upload/w_500,c_fill,g_auto,q_auto,f_auto/"
          )
        : fullUrl;

      await db.createDesign({
        name: cleanName || "Embroidery Design",
        description: null,
        category_id: null,
        cloudinary_public_id: res.public_id,
        cloudinary_url: fullUrl,
        thumbnail_url: thumbnailUrl,
        original_filename: `${cleanName}.${format}`,
        file_hash: `cloud_${res.asset_id || Date.now()}`,
        file_size: res.bytes || 0,
        width: res.width || 1200,
        height: res.height || 1200,
        is_favorite: false,
      });

      addedCount++;
    }

    const updated = await db.getDesigns({ limit: 10 });

    return NextResponse.json({
      success: true,
      totalInStorage: allCloudResources.length,
      previouslyInCatalog: existingResult.total,
      newlyImported: addedCount,
      currentTotalInCatalog: updated.total,
      message:
        addedCount > 0
          ? `Successfully reconciled ${addedCount} missing designs from Cloudinary storage into your catalog!`
          : `All ${allCloudResources.length} designs in Cloudinary storage are already fully synced!`,
    });
  } catch (error: any) {
    console.error("Reconcile error:", error);
    return NextResponse.json(
      { error: "Failed to reconcile storage", message: error.message },
      { status: 500 }
    );
  }
}
