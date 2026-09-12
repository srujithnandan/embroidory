import fs from "fs";
import path from "path";
import { Category } from "@/types/category";
import { Design, DesignFilterParams, PaginatedDesignsResponse } from "@/types/design";
import { DuplicateCheckResponse } from "@/types/sync";
import { DEMO_DESIGNS, INITIAL_CATEGORIES } from "./demo-data";
import { isSupabaseConfigured, supabase } from "./supabase/client";
import { cloudinaryStorage } from "./storage/cloudinary";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "catalog.json");

// Persistent Local Data Store (Zero-setup database that saves to disk and works with Cloudinary)
class LocalDataStore {
  private categories: Category[] = [...INITIAL_CATEGORIES];
  private designs: Design[] = [];
  private nextSeq: number = 1;
  private isSyncing: boolean = false;
  private hasSyncedCloud: boolean = false;

  constructor() {
    this.loadFromFile();
    // Non-blocking background sync from Cloudinary backup if available
    this.syncFromCloudinary().catch(() => {});
  }

  async syncFromCloudinary() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      const remoteData = await cloudinaryStorage.restoreCatalog();
      if (remoteData && Array.isArray(remoteData.designs)) {
        // If remote has designs and has at least as many as local, or local is empty
        if (remoteData.designs.length >= this.designs.length) {
          if (remoteData.categories && Array.isArray(remoteData.categories)) {
            this.categories = remoteData.categories;
          }
          this.designs = remoteData.designs;
          if (typeof remoteData.nextSeq === "number") {
            this.nextSeq = remoteData.nextSeq;
          }
          // Persist to local disk cache
          try {
            if (!fs.existsSync(DATA_DIR)) {
              fs.mkdirSync(DATA_DIR, { recursive: true });
            }
            fs.writeFileSync(
              DATA_FILE,
              JSON.stringify(
                {
                  categories: this.categories,
                  designs: this.designs,
                  nextSeq: this.nextSeq,
                  lastSaved: new Date().toISOString(),
                },
                null,
                2
              ),
              "utf-8"
            );
          } catch {}
        }
      }
      this.hasSyncedCloud = true;
    } catch (e) {
      // Ignored
    } finally {
      this.isSyncing = false;
    }
  }

  private lastCloudSync: number = 0;
  private readonly SYNC_INTERVAL_MS = 5000;

  async ensureSynced(force: boolean = false) {
    const now = Date.now();
    if (!force && now - this.lastCloudSync < this.SYNC_INTERVAL_MS) {
      return;
    }
    this.lastCloudSync = now;
    await this.syncFromCloudinary();
  }

  private loadFromFile() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.categories && Array.isArray(parsed.categories)) {
          this.categories = parsed.categories;
        }
        if (parsed.designs && Array.isArray(parsed.designs)) {
          this.designs = parsed.designs;
        }
        if (typeof parsed.nextSeq === "number") {
          this.nextSeq = parsed.nextSeq;
        }
      } else {
        this.saveToFile();
      }
    } catch (err) {
      console.warn("Could not load catalog.json, using initial state:", err);
    }
  }

  private saveToFile() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = {
        categories: this.categories,
        designs: this.designs,
        nextSeq: this.nextSeq,
        lastSaved: new Date().toISOString(),
      };
      const jsonString = JSON.stringify(data, null, 2);
      fs.writeFileSync(DATA_FILE, jsonString, "utf-8");

      // Auto backup to Cloudinary in background so Render server sleep/restart never loses data
      cloudinaryStorage.backupCatalog(jsonString).catch((err) => {
        console.warn("Cloudinary catalog backup error:", err);
      });
    } catch (err) {
      console.warn("Could not save to catalog.json:", err);
    }
  }

  getCategories(): Category[] {
    return this.categories.map((cat) => ({
      ...cat,
      design_count: this.designs.filter((d) => d.category_id === cat.id).length,
    }));
  }

  createCategory(name: string): Category {
    const trimmed = name.trim();
    const existing = this.categories.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) return existing;

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: trimmed,
      created_at: new Date().toISOString(),
      design_count: 0,
    };
    this.categories.push(newCat);
    this.saveToFile();
    return newCat;
  }

  updateCategory(id: string, name: string): Category | null {
    const cat = this.categories.find((c) => c.id === id);
    if (!cat) return null;
    cat.name = name.trim();
    this.saveToFile();
    return cat;
  }

  deleteCategory(id: string): boolean {
    const otherCat = this.categories.find((c) => c.name === "Other");
    // Reassign designs in this category to Other
    this.designs.forEach((d) => {
      if (d.category_id === id) {
        d.category_id = otherCat ? otherCat.id : null;
        d.category = otherCat || null;
      }
    });
    this.categories = this.categories.filter((c) => c.id !== id);
    this.saveToFile();
    return true;
  }

  getDesigns(params: DesignFilterParams): PaginatedDesignsResponse {
    let filtered = [...this.designs];

    // Filter by category
    if (params.category && params.category !== "all") {
      const categoryParam = params.category;
      const categoryParamLower = categoryParam.toLowerCase();
      filtered = filtered.filter((d) => {
        if (!d.category_id && !d.category) return false;
        return (
          d.category_id === categoryParam ||
          d.category?.name.toLowerCase() === categoryParamLower
        );
      });
    }

    // Filter by favorite
    if (params.favorite) {
      filtered = filtered.filter((d) => d.is_favorite);
    }

    // Search
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.design_id.toLowerCase().includes(q) ||
          d.category?.name.toLowerCase().includes(q) ||
          (d.description && d.description.toLowerCase().includes(q)) ||
          d.original_filename.toLowerCase().includes(q)
      );
    }

    // Sorting
    const sort = params.sort || "newest";
    filtered.sort((a, b) => {
      if (sort === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sort === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sort === "name_asc") {
        return a.name.localeCompare(b.name);
      }
      if (sort === "name_desc") {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 36);
    const startIndex = (page - 1) * limit;
    const paginatedItems = filtered.slice(startIndex, startIndex + limit);

    return {
      designs: paginatedItems,
      total: filtered.length,
      page,
      limit,
      hasMore: startIndex + limit < filtered.length,
    };
  }

  getDesignById(id: string): Design | null {
    return this.designs.find((d) => d.id === id || d.design_id === id) || null;
  }

  checkDuplicates(hashes: string[]): DuplicateCheckResponse {
    const existingHashSet = new Set(this.designs.map((d) => d.file_hash));
    const existingHashes: string[] = [];
    const newHashes: string[] = [];

    hashes.forEach((h) => {
      if (existingHashSet.has(h)) {
        existingHashes.push(h);
      } else {
        newHashes.push(h);
      }
    });

    return { existingHashes, newHashes };
  }

  createDesign(
    data: Omit<Design, "id" | "design_id" | "created_at" | "updated_at">
  ): Design {
    // Prevent duplicate hash
    const existing = this.designs.find((d) => d.file_hash === data.file_hash);
    if (existing) {
      throw new Error(`Duplicate image detected (Hash: ${data.file_hash.substring(0, 8)}...)`);
    }

    const nextIdNumber = this.nextSeq++;
    const designId = `EMB-${String(nextIdNumber).padStart(4, "0")}`;
    const category = this.categories.find((c) => c.id === data.category_id) || null;

    const newDesign: Design = {
      ...data,
      id: `des-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      design_id: designId,
      category,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.designs.unshift(newDesign);
    this.saveToFile();
    return newDesign;
  }

  updateDesign(id: string, updates: Partial<Design>): Design | null {
    const design = this.designs.find((d) => d.id === id || d.design_id === id);
    if (!design) return null;

    if (updates.category_id !== undefined) {
      design.category_id = updates.category_id;
      design.category =
        this.categories.find((c) => c.id === updates.category_id) || null;
    }
    if (updates.name !== undefined) design.name = updates.name;
    if (updates.description !== undefined) design.description = updates.description;
    if (updates.is_favorite !== undefined) design.is_favorite = updates.is_favorite;
    design.updated_at = new Date().toISOString();
    this.saveToFile();

    return design;
  }

  deleteDesign(id: string): Design | null {
    const index = this.designs.findIndex((d) => d.id === id || d.design_id === id);
    if (index === -1) return null;
    const deleted = this.designs.splice(index, 1)[0];
    this.saveToFile();
    return deleted;
  }

  bulkDelete(ids: string[]): number {
    const set = new Set(ids);
    const beforeCount = this.designs.length;
    this.designs = this.designs.filter((d) => !set.has(d.id) && !set.has(d.design_id));
    this.saveToFile();
    return beforeCount - this.designs.length;
  }

  bulkUpdateCategory(ids: string[], categoryId: string): number {
    const set = new Set(ids);
    const category = this.categories.find((c) => c.id === categoryId) || null;
    let count = 0;
    this.designs.forEach((d) => {
      if (set.has(d.id) || set.has(d.design_id)) {
        d.category_id = categoryId;
        d.category = category;
        d.updated_at = new Date().toISOString();
        count++;
      }
    });
    this.saveToFile();
    return count;
  }

  bulkFavorite(ids: string[], isFavorite: boolean): number {
    const set = new Set(ids);
    let count = 0;
    this.designs.forEach((d) => {
      if (set.has(d.id) || set.has(d.design_id)) {
        d.is_favorite = isFavorite;
        d.updated_at = new Date().toISOString();
        count++;
      }
    });
    this.saveToFile();
    return count;
  }

  getStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const addedToday = this.designs.filter(
      (d) => new Date(d.created_at).getTime() >= startOfToday
    ).length;

    const favoritesCount = this.designs.filter((d) => d.is_favorite).length;

    // Find the newest design upload date as last sync
    const lastSyncTime =
      this.designs.length > 0 ? this.designs[0].created_at : new Date().toISOString();

    return {
      totalDesigns: this.designs.length,
      addedToday,
      favoritesCount,
      categoriesCount: this.categories.length,
      lastSyncTime,
      storageProvider: "Cloudinary CDN",
      isLiveSupabase: isSupabaseConfigured(),
    };
  }
}

// Global singleton instance for local fallback store
declare global {
  // eslint-disable-next-line no-var
  var __localDataStore: LocalDataStore | undefined;
}

const localStore: LocalDataStore =
  globalThis.__localDataStore || (globalThis.__localDataStore = new LocalDataStore());

/**
 * Unified Database Layer: Automatically delegates to Supabase if configured,
 * or gracefully provides immediate local/demo capability.
 */
export const db = {
  async getCategories(): Promise<Category[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: categories, error } = await supabase
          .from("categories")
          .select("*, designs(count)")
          .order("name", { ascending: true });

        if (!error && categories) {
          return categories.map((c) => ({
            id: c.id,
            name: c.name,
            created_at: c.created_at,
            design_count: c.designs?.[0]?.count || 0,
          }));
        }
      } catch (e) {
        console.warn("Supabase categories query fallback:", e);
      }
    }
    await localStore.ensureSynced();
    return localStore.getCategories();
  },

  async createCategory(name: string): Promise<Category> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from("categories")
          .insert({ name: name.trim() })
          .select()
          .single();
        if (!error && data) return data;
      } catch (e) {
        console.warn("Supabase createCategory error:", e);
      }
    }
    return localStore.createCategory(name);
  },

  async updateCategory(id: string, name: string): Promise<Category | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from("categories")
          .update({ name: name.trim() })
          .eq("id", id)
          .select()
          .single();
        if (!error && data) return data;
      } catch (e) {
        console.warn("Supabase updateCategory error:", e);
      }
    }
    return localStore.updateCategory(id, name);
  },

  async deleteCategory(id: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from("categories").delete().eq("id", id);
        return !error;
      } catch (e) {
        console.warn("Supabase deleteCategory error:", e);
      }
    }
    return localStore.deleteCategory(id);
  },

  async getDesigns(params: DesignFilterParams): Promise<PaginatedDesignsResponse> {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from("designs")
          .select("*, category:categories(*)", { count: "exact" });

        if (params.category && params.category !== "all") {
          query = query.eq("category_id", params.category);
        }

        if (params.favorite) {
          query = query.eq("is_favorite", true);
        }

        if (params.search && params.search.trim()) {
          const s = params.search.trim();
          query = query.or(`name.ilike.%${s}%,design_id.ilike.%${s}%,description.ilike.%${s}%`);
        }

        if (params.sort === "oldest") {
          query = query.order("created_at", { ascending: true });
        } else if (params.sort === "name_asc") {
          query = query.order("name", { ascending: true });
        } else if (params.sort === "name_desc") {
          query = query.order("name", { ascending: false });
        } else {
          query = query.order("created_at", { ascending: false });
        }

        const page = Math.max(1, params.page || 1);
        const limit = Math.max(1, params.limit || 36);
        const start = (page - 1) * limit;
        query = query.range(start, start + limit - 1);

        const { data, count, error } = await query;
        if (!error && data) {
          return {
            designs: data as Design[],
            total: count || 0,
            page,
            limit,
            hasMore: start + data.length < (count || 0),
          };
        }
      } catch (e) {
        console.warn("Supabase getDesigns error:", e);
      }
    }
    await localStore.ensureSynced();
    return localStore.getDesigns(params);
  },

  async getDesignById(id: string): Promise<Design | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from("designs")
          .select("*, category:categories(*)")
          .or(`id.eq.${id},design_id.eq.${id}`)
          .single();
        if (!error && data) return data as Design;
      } catch (e) {
        console.warn("Supabase getDesignById error:", e);
      }
    }
    await localStore.ensureSynced();
    return localStore.getDesignById(id);
  },

  async checkDuplicateHashes(hashes: string[]): Promise<DuplicateCheckResponse> {
    if (hashes.length === 0) {
      return { existingHashes: [], newHashes: [] };
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from("designs")
          .select("file_hash")
          .in("file_hash", hashes);

        if (!error && data) {
          const existingSet = new Set(data.map((r) => r.file_hash));
          const existingHashes: string[] = [];
          const newHashes: string[] = [];
          hashes.forEach((h) => {
            if (existingSet.has(h)) existingHashes.push(h);
            else newHashes.push(h);
          });
          return { existingHashes, newHashes };
        }
      } catch (e) {
        console.warn("Supabase checkDuplicateHashes error:", e);
      }
    }
    await localStore.ensureSynced();
    return localStore.checkDuplicates(hashes);
  },

  async createDesign(
    data: Omit<Design, "id" | "design_id" | "created_at" | "updated_at">
  ): Promise<Design> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: created, error } = await supabase
          .from("designs")
          .insert(data)
          .select("*, category:categories(*)")
          .single();

        if (error) {
          if (error.code === "23505") {
            throw new Error(`This design has already been uploaded previously.`);
          }
          throw error;
        }
        if (created) return created as Design;
      } catch (e: any) {
        if (e.message && e.message.includes("already been uploaded")) throw e;
        console.warn("Supabase createDesign fallback:", e);
      }
    }
    await localStore.ensureSynced();
    return localStore.createDesign(data);
  },

  async updateDesign(id: string, updates: Partial<Design>): Promise<Design | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from("designs")
          .update({
            name: updates.name,
            description: updates.description,
            category_id: updates.category_id,
            is_favorite: updates.is_favorite,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select("*, category:categories(*)")
          .single();

        if (!error && data) return data as Design;
      } catch (e) {
        console.warn("Supabase updateDesign error:", e);
      }
    }
    return localStore.updateDesign(id, updates);
  },

  async deleteDesign(id: string): Promise<Design | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from("designs")
          .delete()
          .eq("id", id)
          .select()
          .single();

        if (!error && data) return data as Design;
      } catch (e) {
        console.warn("Supabase deleteDesign error:", e);
      }
    }
    return localStore.deleteDesign(id);
  },

  async bulkDelete(ids: string[]): Promise<number> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error, count } = await supabase
          .from("designs")
          .delete({ count: "exact" })
          .in("id", ids);

        if (!error) return count || ids.length;
      } catch (e) {
        console.warn("Supabase bulkDelete error:", e);
      }
    }
    return localStore.bulkDelete(ids);
  },

  async bulkUpdateCategory(ids: string[], categoryId: string): Promise<number> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error, count } = await supabase
          .from("designs")
          .update({ category_id: categoryId, updated_at: new Date().toISOString() })
          .in("id", ids);

        if (!error) return count || ids.length;
      } catch (e) {
        console.warn("Supabase bulkUpdateCategory error:", e);
      }
    }
    return localStore.bulkUpdateCategory(ids, categoryId);
  },

  async bulkFavorite(ids: string[], isFavorite: boolean): Promise<number> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error, count } = await supabase
          .from("designs")
          .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
          .in("id", ids);

        if (!error) return count || ids.length;
      } catch (e) {
        console.warn("Supabase bulkFavorite error:", e);
      }
    }
    return localStore.bulkFavorite(ids, isFavorite);
  },

  async getStats() {
    if (isSupabaseConfigured() && supabase) {
      try {
        const [designsCountRes, favoritesRes, categoriesCountRes, recentDesignRes] =
          await Promise.all([
            supabase.from("designs").select("id", { count: "exact", head: true }),
            supabase
              .from("designs")
              .select("id", { count: "exact", head: true })
              .eq("is_favorite", true),
            supabase.from("categories").select("id", { count: "exact", head: true }),
            supabase
              .from("designs")
              .select("created_at")
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const { count: todayCount } = await supabase
          .from("designs")
          .select("id", { count: "exact", head: true })
          .gte("created_at", startOfToday.toISOString());

        return {
          totalDesigns: designsCountRes.count || 0,
          addedToday: todayCount || 0,
          favoritesCount: favoritesRes.count || 0,
          categoriesCount: categoriesCountRes.count || 0,
          lastSyncTime: recentDesignRes.data?.created_at || new Date().toISOString(),
          storageProvider: "Cloudinary CDN",
          isLiveSupabase: true,
        };
      } catch (e) {
        console.warn("Supabase getStats fallback:", e);
      }
    }
    await localStore.ensureSynced();
    return localStore.getStats();
  },
};
