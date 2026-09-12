"use client";

import { useEffect, useState } from "react";
import { Design } from "@/types/design";

const CACHE_NAME = "vihari-gallery-cache-v1";

/**
 * Pre-downloads an array of design thumbnails into the browser's persistent CacheStorage
 * and warms up browser image decoding memory.
 */
export async function preloadCatalogToDeviceCache(
  designs: Design[],
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  if (typeof window === "undefined" || !designs || designs.length === 0) return;

  const urls = designs
    .map((d) => d.thumbnail_url || d.cloudinary_url)
    .filter((url): url is string => Boolean(url));

  const total = urls.length;
  let loaded = 0;

  // 1. Check if CacheStorage is supported
  const hasCacheStorage = "caches" in window;
  let cache: Cache | null = null;

  if (hasCacheStorage) {
    try {
      cache = await window.caches.open(CACHE_NAME);
    } catch {
      cache = null;
    }
  }

  // 2. Process in non-blocking batches of 6
  const BATCH_SIZE = 6;
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (url) => {
        try {
          if (cache) {
            const match = await cache.match(url);
            if (!match) {
              const res = await fetch(url, { mode: "cors", cache: "force-cache" });
              if (res.ok) {
                await cache.put(url, res.clone());
              }
            }
          }

          // Pre-warm browser in-memory image decoder
          const img = new Image();
          img.decoding = "async";
          img.src = url;
        } catch {
          // Ignore individual fetch errors quietly
        } finally {
          loaded++;
          onProgress?.(loaded, total);
        }
      })
    );

    // Yield back to the browser event loop so user interactions are 100% fluid
    await new Promise((resolve) => {
      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback(resolve, { timeout: 100 });
      } else {
        setTimeout(resolve, 30);
      }
    });
  }
}

/**
 * React Hook that automatically triggers background pre-caching for designs
 * and returns the caching status.
 */
export function useCatalogCache(designs: Design[]) {
  const [isCached, setIsCached] = useState(false);
  const [cachedCount, setCachedCount] = useState(0);

  useEffect(() => {
    if (!designs || designs.length === 0) return;

    let isMounted = true;

    preloadCatalogToDeviceCache(designs, (count, total) => {
      if (isMounted) {
        setCachedCount(count);
        if (count >= total) {
          setIsCached(true);
        }
      }
    }).then(() => {
      if (isMounted) {
        setIsCached(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [designs]);

  return { isCached, cachedCount, totalCount: designs.length };
}
