export interface HomepageFeaturedPhoto {
  title: string;
  type: string;
  image: string;
}

export const HOMEPAGE_FEATURED_PHOTOS_KEY = "homepage_featured_photos";

export const DEFAULT_HOMEPAGE_FEATURED_PHOTOS: HomepageFeaturedPhoto[] = [
  {
    title: "Between the frames",
    type: "STREET / DOCUMENTARY",
    image: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1000&q=85",
  },
  {
    title: "Quiet geometry",
    type: "ARCHITECTURE",
    image: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "The human element",
    type: "PORTRAITURE",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Earth in motion",
    type: "LANDSCAPE",
    image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1000&q=85",
  },
];

function normalizeImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const candidate = value.trim();
  if (!candidate || candidate.length > 2048 || candidate.includes("\\")) return null;

  if (candidate.startsWith("/") && !candidate.startsWith("//")) return candidate;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:") return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export function parseHomepageFeaturedPhotos(value: unknown): HomepageFeaturedPhoto[] | null {
  if (!Array.isArray(value) || value.length !== DEFAULT_HOMEPAGE_FEATURED_PHOTOS.length) {
    return null;
  }

  const photos: HomepageFeaturedPhoto[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const record = item as Record<string, unknown>;
    const title = typeof record.title === "string" ? record.title.trim() : "";
    const type = typeof record.type === "string" ? record.type.trim() : "";
    const image = normalizeImageUrl(record.image);

    if (!title || title.length > 100 || !type || type.length > 80 || !image) return null;
    photos.push({ title, type, image });
  }

  return photos;
}
