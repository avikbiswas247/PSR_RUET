import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { findPasswordReset, consumePasswordReset, changePassword } from "@/lib/services/auth.service";
import { hashPassword } from "@/lib/auth/password";
import { findUserById } from "@/lib/repositories/auth.repository";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token : "";
    const newPassword = typeof body.password === "string" ? body.password : "";

    if (!token) {
      return NextResponse.json({ message: "A reset token is required.", code: "MISSING_TOKEN" }, { status: 400 });
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      return NextResponse.json({ message: "Password must contain between 8 and 128 characters.", code: "WEAK_PASSWORD" }, { status: 422 });
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const reset = await findPasswordReset(tokenHash);

    if (!reset) {
      return NextResponse.json({ message: "Invalid or expired reset token.", code: "INVALID_TOKEN" }, { status: 400 });
    }

    const user = await findUserById(reset.user_id);
    if (!user || user.roles.includes("ADMIN")) {
      return NextResponse.json({ message: "Invalid or expired reset token.", code: "INVALID_TOKEN" }, { status: 400 });
    }

    const newPasswordHash = await hashPassword(newPassword);

    await changePassword({
      userId: reset.user_id,
      newPasswordHash,
    });

    await consumePasswordReset(reset.id);

    return NextResponse.json({ message: "Your password has been reset. You can now sign in with your new password." }, { status: 200 });
  } catch (error) {
    console.error("[ResetPassword] Request failed:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
