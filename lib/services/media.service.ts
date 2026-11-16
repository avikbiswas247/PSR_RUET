import { createHash } from "node:crypto";
import * as MediaRepo from "@/lib/repositories/media-asset.repository";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string };
function getConfig(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.");
  return { cloudName, apiKey, apiSecret };
}
function sign(params: Record<string, string>, secret: string) {
  const canonical = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join("&");
  return createHash("sha1").update(canonical + secret).digest("hex");
}
export function isCloudinaryImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try { const u = new URL(value); return u.protocol === "https:" && u.hostname === "res.cloudinary.com"; } catch { return false; }
}
export async function uploadImage(input: { file: File; authenticatedUploaderId: string }) {
  const { file, authenticatedUploaderId } = input;
  if (!file || typeof file.arrayBuffer !== "function") throw new Error("An image file is required.");
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error("Unsupported image type. Use JPEG, PNG, WebP, GIF or AVIF.");
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) throw new Error("Image must be between 1 byte and 10 MB.");
  const cfg = getConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params = { folder: "psru", timestamp };
  const form = new FormData();
  form.append("file", file, file.name || "upload"); form.append("api_key", cfg.apiKey);
  form.append("timestamp", timestamp); form.append("folder", params.folder);
  form.append("signature", sign(params, cfg.apiSecret));
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cfg.cloudName)}/image/upload`, { method: "POST", body: form, cache: "no-store" });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok || !result || typeof result !== "object") { console.error("[Cloudinary] Upload failed:", response.status, result); throw new Error("Image upload failed. Please try again."); }
  const data = result as { secure_url?: unknown; public_id?: unknown; format?: unknown; bytes?: unknown };
  if (typeof data.secure_url !== "string" || !isCloudinaryImageUrl(data.secure_url) || typeof data.public_id !== "string" || !data.public_id.trim() || typeof data.bytes !== "number") throw new Error("Cloudinary returned an invalid upload response.");
  return MediaRepo.createMediaAsset({ url: data.secure_url, public_id: data.public_id, file_name: file.name || null, file_type: typeof data.format === "string" ? `image/${data.format}` : file.type, file_size: data.bytes, uploaded_by: authenticatedUploaderId });
}
export async function registerCloudinaryAsset(i: { url: string; publicId: string; fileName?: string | null; fileType?: string | null; fileSize?: number | null; authenticatedUploaderId: string }) {
  if (!isCloudinaryImageUrl(i.url) || !i.publicId.trim()) throw new Error("A valid Cloudinary HTTPS URL and public ID are required.");
  if (i.fileSize != null && (!Number.isSafeInteger(i.fileSize) || i.fileSize < 0)) throw new Error("File size must be a non-negative safe integer.");
  return MediaRepo.createMediaAsset({ url: i.url, public_id: i.publicId, file_name: i.fileName ?? null, file_type: i.fileType ?? null, file_size: i.fileSize ?? null, uploaded_by: i.authenticatedUploaderId });
}
export const getMediaAsset = (id: string) => MediaRepo.getMediaAssetById(id);
export const listMediaAssets = (limit = 50, offset = 0) => {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) throw new Error("Invalid pagination.");
  return MediaRepo.listMediaAssets(limit, offset);
};
export async function removeMediaRecord(id: string, deleteCloudinary: (publicId: string) => Promise<void>) {
  const asset = await MediaRepo.getMediaAssetById(id); if (!asset) return false;
  if (asset.public_id) await deleteCloudinary(asset.public_id);
  return MediaRepo.deleteMediaAsset(id);
}
