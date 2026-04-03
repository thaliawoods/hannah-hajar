const CDN_BASE = (process.env.NEXT_PUBLIC_BUNNY_CDN_URL ?? "").replace(/\/$/, "");

/**
 * Returns a CDN URL for a given path in the Bunny storage zone.
 * e.g. cdnUrl("/hannah-hajar/images/hannah-01.jpg")
 *   -> "https://your-pullzone.b-cdn.net/hannah-hajar/images/hannah-01.jpg"
 */
export function cdnUrl(path: string): string {
  if (!CDN_BASE) {
    console.warn("[bunny] NEXT_PUBLIC_BUNNY_CDN_URL is not set — falling back to local path");
    return path;
  }
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return `${CDN_BASE}${normalised}`;
}

const STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE ?? "";
const STORAGE_HOST = process.env.BUNNY_STORAGE_HOST ?? "storage.bunnycdn.com";
const STORAGE_PASSWORD = process.env.BUNNY_STORAGE_PASSWORD ?? "";

const storageBase = () => `https://${STORAGE_HOST}/${STORAGE_ZONE}`;

/**
 * List files in a directory of the storage zone.
 * Server-side only (uses BUNNY_STORAGE_PASSWORD).
 */
export async function listFiles(directory = "/") {
  const dir = directory.startsWith("/") ? directory : `/${directory}`;
  const res = await fetch(`${storageBase()}${dir}`, {
    headers: { AccessKey: STORAGE_PASSWORD },
  });
  if (!res.ok) throw new Error(`Bunny list failed: ${res.status} ${res.statusText}`);
  return res.json();
}

/**
 * Upload a file to the storage zone.
 * Server-side only (uses BUNNY_STORAGE_PASSWORD).
 */
export async function uploadFile(remotePath: string, body: BodyInit) {
  const path = remotePath.startsWith("/") ? remotePath : `/${remotePath}`;
  const res = await fetch(`${storageBase()}${path}`, {
    method: "PUT",
    headers: {
      AccessKey: STORAGE_PASSWORD,
      "Content-Type": "application/octet-stream",
    },
    body,
  });
  if (!res.ok) throw new Error(`Bunny upload failed: ${res.status} ${res.statusText}`);
  return res.json();
}

/**
 * Delete a file from the storage zone.
 * Server-side only (uses BUNNY_STORAGE_PASSWORD).
 */
export async function deleteFile(remotePath: string) {
  const path = remotePath.startsWith("/") ? remotePath : `/${remotePath}`;
  const res = await fetch(`${storageBase()}${path}`, {
    method: "DELETE",
    headers: { AccessKey: STORAGE_PASSWORD },
  });
  if (!res.ok) throw new Error(`Bunny delete failed: ${res.status} ${res.statusText}`);
  return res.json();
}