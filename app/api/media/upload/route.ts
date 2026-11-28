import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/api/guards";
import { uploadImage } from "@/lib/services/media.service";
export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 11 * 1024 * 1024) return NextResponse.json({ success: false, error: { message: "Upload request exceeds the 10 MB image limit." } }, { status: 413 });
    const auth = await requireUser(); if (isResponse(auth)) return auth;
    if (!auth.roles.some((role) => ["CLIENT", "PHOTOGRAPHER", "ADMIN"].includes(role))) {
      return NextResponse.json({ success: false, error: { message: "A client, photographer, or administrator account is required to upload images." } }, { status: 403 });
    }
    const form = await request.formData(); const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ success: false, error: { message: "A file field is required." } }, { status: 422 });
    const asset = await uploadImage({ file, authenticatedUploaderId: auth.id });
    return NextResponse.json({ success: true, data: asset }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image upload failed.";
    console.error("[Media upload]", error);
    const status = /not configured/i.test(message) ? 503 : /unsupported|must be between|required/i.test(message) ? 422 : 500;
    return NextResponse.json({ success: false, error: { message } }, { status });
  }
}
