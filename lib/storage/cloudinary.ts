import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { StorageProvider, StorageUploadResult } from "./provider";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "hcn8xt5g";
const apiKey = process.env.CLOUDINARY_API_KEY || "169781418545283";
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Configure Cloudinary only on the server
if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export class CloudinaryStorageProvider implements StorageProvider {
  private isConfigured(): boolean {
    return Boolean(cloudName && apiKey && apiSecret);
  }

  async upload(
    fileBuffer: Buffer,
    options: { filename: string; folder?: string }
  ): Promise<StorageUploadResult> {
    if (!this.isConfigured()) {
      throw new Error(
        "Cloudinary is not fully configured. Please set CLOUDINARY_API_SECRET in your .env.local file."
      );
    }

    const folder = options.folder || "embroidery/designs";
    const cleanFilename = options.filename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: `${cleanFilename}_${Date.now()}`,
          resource_type: "image",
          transformation: [{ quality: "auto", fetch_format: "auto" }],
        },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            reject(error || new Error("Failed to upload image to Cloudinary"));
            return;
          }

          resolve({
            publicId: result.public_id,
            url: result.secure_url,
            thumbnailUrl: this.getThumbnailUrl(result.public_id),
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        }
      );

      uploadStream.end(fileBuffer);
    });
  }

  async delete(publicId: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn("Cloudinary not configured; skipping remote delete for:", publicId);
      return true;
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === "ok" || result.result === "not found";
    } catch (err) {
      console.error("Cloudinary delete error:", err);
      return false;
    }
  }

  getThumbnailUrl(publicIdOrUrl: string): string {
    if (publicIdOrUrl.startsWith("http")) {
      // If it's already a full cloudinary url, apply transformations
      if (publicIdOrUrl.includes("res.cloudinary.com")) {
        return publicIdOrUrl.replace("/image/upload/", "/image/upload/w_500,c_fill,g_auto,q_auto,f_auto/");
      }
      return publicIdOrUrl;
    }
    return `https://res.cloudinary.com/${cloudName}/image/upload/w_500,c_fill,g_auto,q_auto,f_auto/${publicIdOrUrl}`;
  }

  getViewerUrl(publicIdOrUrl: string): string {
    if (publicIdOrUrl.startsWith("http")) {
      if (publicIdOrUrl.includes("res.cloudinary.com")) {
        return publicIdOrUrl.replace("/image/upload/", "/image/upload/w_1600,c_limit,q_auto,f_auto/");
      }
      return publicIdOrUrl;
    }
    return `https://res.cloudinary.com/${cloudName}/image/upload/w_1600,c_limit,q_auto,f_auto/${publicIdOrUrl}`;
  }

  async backupCatalog(catalogJsonString: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const base64Data = Buffer.from(catalogJsonString, "utf-8").toString("base64");
      await cloudinary.uploader.upload(`data:application/json;base64,${base64Data}`, {
        resource_type: "raw",
        public_id: "embroidery_db/catalog.json",
        overwrite: true,
        invalidate: true,
      });
      return true;
    } catch (err) {
      console.warn("Cloudinary catalog backup warning:", err);
      return false;
    }
  }

  async restoreCatalog(): Promise<any | null> {
    if (!this.isConfigured()) return null;
    try {
      const url = `https://res.cloudinary.com/${cloudName}/raw/upload/embroidery_db/catalog.json?t=${Date.now()}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      return data;
    } catch (err) {
      return null;
    }
  }
}

export const cloudinaryStorage = new CloudinaryStorageProvider();
