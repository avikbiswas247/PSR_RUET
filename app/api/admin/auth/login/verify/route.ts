import { NextResponse } from "next/server";

import { AdminAuthService } from "@/lib/services";
import { handleApiError, readJson } from "@/lib/api/http";
import { SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/lib/auth/session";

type Body = { userId?: string; otpCode?: string };

export async function POST(request: Request) {
  try {
    const body = await readJson<Body>(request);
    if (!body.userId || !body.otpCode) {
      return NextResponse.json(
        { success: false, error: { message: "User ID and verification code are required.", code: "BAD_REQUEST" } },
        { status: 422 },
      );
    }
    const { token, user } = await AdminAuthService.verifyLogin({
      userId: body.userId,
      otpCode: body.otpCode,
    });

    const response = NextResponse.json(
      { success: true, data: { message: "Admin login successful.", user } },
      { status: 200 },
    );

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    });

    return response;
  } catch (error) { return handleApiError(error); }
}
