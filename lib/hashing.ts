/**
 * Computes a SHA-256 hex string from a File or Blob using native Web Crypto API.
 * This guarantees content-based duplicate identification regardless of original filenames.
 */
export async function calculateFileHash(file: File | Blob): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**
 * Computes SHA-256 from a Node.js Buffer or string (used in server environments)
 */
export async function calculateBufferHash(buffer: Buffer): Promise<string> {
  const cryptoModule = await import("crypto");
  return cryptoModule.createHash("sha256").update(buffer).digest("hex");
}
