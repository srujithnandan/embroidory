export interface StorageUploadResult {
  publicId: string;
  url: string;
  thumbnailUrl: string;
  width?: number;
  height?: number;
  format?: string;
  bytes: number;
}

export interface StorageProvider {
  upload(fileBuffer: Buffer, options: { filename: string; folder?: string }): Promise<StorageUploadResult>;
  delete(publicId: string): Promise<boolean>;
  getThumbnailUrl(publicIdOrUrl: string): string;
  getViewerUrl(publicIdOrUrl: string): string;
}
