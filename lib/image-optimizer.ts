/**
 * Client-side high-quality image compressor and optimizer.
 * Scales huge camera photos (12MP - 48MP, 10MB - 30MB) down to crisp 2048px JPEGs (~500KB - 800KB).
 * - Avoids Cloudinary Free tier 10MB file size rejection.
 * - Prevents mobile browser memory crashes and timeouts.
 * - Preserves maximum embroidery thread & stitch detail.
 */
export async function optimizeImageForUpload(file: File): Promise<File> {
  // If not in browser environment or not an image, return as is
  if (typeof window === "undefined" || typeof document === "undefined") {
    return file;
  }

  // If already small (under 800KB) and standard format, no need to touch
  if (file.size < 800 * 1024 && (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp")) {
    return file;
  }

  return new Promise((resolve) => {
    // Only process supported image types
    if (!file.type.startsWith("image/") && !file.name.match(/\.(jpe?g|png|webp|heic|heif|bmp)$/i)) {
      resolve(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const maxDimension = 2200; // Ultra high-definition embroidery preview
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(file);
        return;
      }

      // Smooth scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // Export as high-grade JPEG (0.86 quality gives pristine embroidery detail at ~600KB)
      canvas.toBlob(
        (blob) => {
          if (blob && (blob.size < file.size || file.size > 8 * 1024 * 1024)) {
            const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            const optimizedFile = new File([blob], cleanName, {
              type: "image/jpeg",
              lastModified: file.lastModified,
            });
            resolve(optimizedFile);
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        0.86
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // Fallback to original file on decode error
    };

    img.src = objectUrl;
  });
}
