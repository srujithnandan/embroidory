export type SyncFileStatus = "pending" | "hashing" | "checking" | "uploading" | "uploaded" | "skipped_duplicate" | "error";

export interface SyncFileItem {
  id: string; // client temporary id
  file: File;
  filename: string;
  size: number;
  hash?: string;
  status: SyncFileStatus;
  progress: number;
  errorMessage?: string;
  designId?: string;
  previewUrl?: string;
  isSelected?: boolean;
  isDuplicate?: boolean;
}

export interface DuplicateCheckRequest {
  hashes: string[];
}

export interface DuplicateCheckResponse {
  existingHashes: string[];
  newHashes: string[];
}

export interface SyncSummaryResult {
  totalProcessed: number;
  uploadedCount: number;
  duplicateCount: number;
  failedCount: number;
  uploadedFiles: string[];
  duplicateFiles: string[];
  failedFiles: { filename: string; reason: string }[];
}
