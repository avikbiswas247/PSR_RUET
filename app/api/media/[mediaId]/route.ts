import { NextResponse } from "next/server";
import { getMediaAsset } from "@/lib/services/media.service";
type Context = { params: Promise<{ mediaId: string }> };
/** Public image fetch: redirects only to the trusted Cloudinary delivery host. */
export async function GET(_request: Request, context: Context) {
  try {
    const { mediaId } = await context.params; const asset = await getMediaAsset(mediaId);
    if (!asset) return NextResponse.json({ success: false, error: { message: "Media not found." } }, { status: 404 });
    const url = new URL(asset.url);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") return NextResponse.json({ success: false, error: { message: "Invalid media origin." } }, { status: 502 });
    return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch (error) { console.error("[Media fetch]", error); return NextResponse.json({ success: false, error: { message: "Unable to fetch media." } }, { status: 500 }); }
}
