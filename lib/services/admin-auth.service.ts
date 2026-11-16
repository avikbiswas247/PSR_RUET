import * as AdminInvitationRepo from "@/lib/repositories/admin-invitation.repository";
import * as OtpCodeRepo from "@/lib/repositories/otp-code.repository";
import * as RoleRepo from "@/lib/repositories/role.repository";
import * as UserRepo from "@/lib/repositories/user.repository";
import * as AuthRepo from "@/lib/repositories/auth.repository";
import * as UserSessionRepo from "@/lib/repositories/user-session.repository";
import * as AuthService from "@/lib/services/auth.service";
import { createHash, randomBytes } from "node:crypto";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, hashSessionToken, setSessionCookie, clearSessionCookie, getSessionToken } from "@/lib/auth/session";
import { transaction, query } from "@/lib/db";
import { sendAdminOtpEmail } from "@/lib/email/send-admin-otp";

export class AdminAuthError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "AdminAuthError";
  }
}

const ADMIN_MAX = 2;
const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_SEND_RATE_LIMIT_PER_HOUR = 5;
const INVITATION_TTL_HOURS = 48;

/* ============================================
   BOOTSTRAP - First admin creation
   ============================================ */

/**
 * Creates the first administrator account.
 * Requires ADMIN_BOOTSTRAP_SECRET. Rejects if any ADMIN already exists.
 * Uses SELECT FOR UPDATE to prevent concurrent bootstrap races.
 */
export async function bootstrapAdmin(input: {
  bootstrapSecret: string;
  username: string;
  email: string;
  password: string;
}) {
  const expectedSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!expectedSecret) {
    throw new AdminAuthError("Bootstrap is not configured on this server.", "BOOTSTRAP_NOT_CONFIGURED");
  }
  if (input.bootstrapSecret !== expectedSecret) {
    throw new AdminAuthError("Invalid bootstrap secret.", "INVALID_BOOTSTRAP_SECRET");
  }
  if (!input.username.trim() || input.username.length < 2) {
    throw new AdminAuthError("Username must contain at least 2 characters.", "INVALID_USERNAME");
  }
  if (!/^\S+@\S+\.\S+$/.test(input.email)) {
    throw new AdminAuthError("A valid email is required.", "INVALID_EMAIL");
  }
  if (input.password.length < 8 || input.password.length > 128) {
    throw new AdminAuthError("Password must contain between 8 and 128 characters.", "INVALID_PASSWORD");
  }

  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();

  return transaction(async (client) => {
    // Lock existing admin rows to prevent concurrent bootstrap races.
    const existing = await client.query(
      `SELECT u.id FROM users u
       INNER JOIN user_roles ur ON ur.user_id = u.id
       INNER JOIN roles r ON r.id = ur.role_id
       WHERE r.name = 'ADMIN'
       FOR UPDATE`,
    );
    if (existing.rows.length >= ADMIN_MAX) {
      throw new AdminAuthError("Maximum administrator accounts already exist.", "ADMIN_LIMIT_REACHED");
    }
    // Bootstrap is only available for the first administrator.
    if (existing.rows.length > 0) {
      throw new AdminAuthError("Bootstrap is only available for the first administrator.", "BOOTSTRAP_NOT_ALLOWED");
    }
    // Check if this email is already taken.
    const existingUser = await client.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email],
    );
    if (existingUser.rows.length > 0) {
      throw new AdminAuthError("An account with this email already exists.", "EMAIL_TAKEN");
    }
    // Check if this username is already taken.
    const existingUsername = await client.query(
      `SELECT id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
      [username],
    );
    if (existingUsername.rows.length > 0) {
      throw new AdminAuthError("An account with this username already exists.", "USERNAME_TAKEN");
    }

    const passwordHash = await hashPassword(input.password);

    const inserted = await client.query(
      `INSERT INTO users (username, full_name, email, password_hash, email_verified_at)
       VALUES ($1, $2, LOWER($3), $4, NULL)
       RETURNING id, username, full_name, email`,
      [username, input.username.trim(), email, passwordHash],
    );
    const user = inserted.rows[0];
    if (!user) throw new AdminAuthError("Account creation failed.", "CREATE_FAILED");

    const adminRole = await client.query(
      "SELECT id FROM roles WHERE name = 'ADMIN' LIMIT 1",
    );
    if (!adminRole.rows[0]) throw new AdminAuthError("ADMIN role not found.", "ROLE_NOT_FOUND");

    await client.query(
      "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [user.id, adminRole.rows[0].id],
    );

    return {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
    };
  });
}

/* ============================================
   INVITATION - Second admin by existing admin
   ============================================ */

/**
 * Creates a single-use invitation for the second admin slot.
 * Requires the caller to be an existing verified ADMIN.
 */
export async function inviteAdmin(input: {
  authenticatedAdminId: string;
  email: string;
}) {
  const inviter = await UserRepo.getUserById(input.authenticatedAdminId);
  if (!inviter) throw new AdminAuthError("Inviter not found.", "USER_NOT_FOUND");
  const isAdmin = await RoleRepo.userHasRole(input.authenticatedAdminId, "ADMIN");
  if (!isAdmin) throw new AdminAuthError("Only administrators can invite.", "FORBIDDEN");
  if (!inviter.email_verified_at) throw new AdminAuthError("Inviter email is not verified.", "EMAIL_NOT_VERIFIED");

  const email = input.email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new AdminAuthError("A valid email is required.", "INVALID_EMAIL");
  }

  // Count existing admins (including pending invitations as reserved slots).
  const adminCount = await countAdminSlotsReserved();
  if (adminCount >= ADMIN_MAX) {
    throw new AdminAuthError("Maximum administrator accounts already exist.", "ADMIN_LIMIT_REACHED");
  }

  // Don't invite an email that already has an account or a pending invitation.
  const existingUser = await AuthRepo.findUserForLogin(email);
  if (existingUser) {
    throw new AdminAuthError("An account with this email already exists.", "EMAIL_TAKEN");
  }
  const pendingInvites = await AdminInvitationRepo.countValidInvitationsByEmail(email);
  if (pendingInvites > 0) {
    throw new AdminAuthError("An invitation already exists for this email.", "INVITATION_EXISTS");
  }

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + INVITATION_TTL_HOURS * 60 * 60 * 1000).toISOString();

  await AdminInvitationRepo.createAdminInvitation({
    email,
    inviter_id: input.authenticatedAdminId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  return { token: rawToken, email, expires_at: expiresAt };
}

/**
 * Counts existing admins plus pending invitations as reserved slots.
 */
async function countAdminSlotsReserved(): Promise<number> {
  const result = await query(
    `SELECT (
      (SELECT COUNT(*) FROM users u
       INNER JOIN user_roles ur ON ur.user_id = u.id
       INNER JOIN roles r ON r.id = ur.role_id
       WHERE r.name = 'ADMIN')
      +
      (SELECT COUNT(*) FROM admin_invitations
       WHERE used_at IS NULL AND expires_at > NOW())
    ) AS total`,
  );
  return parseInt(result.rows[0]?.total ?? "0", 10);
}

/**
 * Public: count admin slots (used/total) without authentication.
 * Returns registration mode and whether bootstrap is configured.
 */
export async function getAdminSlots(): Promise<{
  used: number;
  total: number;
  registrationMode: "BOOTSTRAP" | "INVITATION" | "CLOSED";
  bootstrapConfigured: boolean;
  registrationAvailable: boolean;
}> {
  const used = await countAdminSlotsReserved();
  const bootstrapConfigured = !!process.env.ADMIN_BOOTSTRAP_SECRET;
  let registrationMode: "BOOTSTRAP" | "INVITATION" | "CLOSED";
  if (used >= ADMIN_MAX) {
    registrationMode = "CLOSED";
  } else if (used === 0) {
    registrationMode = "BOOTSTRAP";
  } else {
    registrationMode = "INVITATION";
  }
  return {
    used,
    total: ADMIN_MAX,
    registrationMode,
    bootstrapConfigured,
    registrationAvailable: used < ADMIN_MAX,
  };
}

/* ============================================
   REGISTRATION - Complete admin registration via invitation or bootstrap
   ============================================ */

/**
 * Completes admin registration using either an invitation token or bootstrap secret.
 * Creates the user account with ADMIN role but does NOT verify email yet.
 * The user must verify their email via OTP before the account is active.
 */
export async function completeAdminRegistration(input: {
  invitationToken?: string;
  bootstrapSecret?: string;
  username: string;
  email: string;
  password: string;
}) {
  if (!input.username.trim() || input.username.length < 2) {
    throw new AdminAuthError("Username must contain at least 2 characters.", "INVALID_USERNAME");
  }
  if (!/^\S+@\S+\.\S+$/.test(input.email)) {
    throw new AdminAuthError("A valid email is required.", "INVALID_EMAIL");
  }
  if (input.password.length < 8 || input.password.length > 128) {
    throw new AdminAuthError("Password must contain between 8 and 128 characters.", "INVALID_PASSWORD");
  }

  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();

  return transaction(async (client) => {
    // Lock existing admin rows to prevent concurrent registration races.
    const existing = await client.query(
      `SELECT u.id FROM users u
       INNER JOIN user_roles ur ON ur.user_id = u.id
       INNER JOIN roles r ON r.id = ur.role_id
       WHERE r.name = 'ADMIN'
       FOR UPDATE`,
    );
    if (existing.rows.length >= ADMIN_MAX) {
      throw new AdminAuthError("Maximum administrator accounts already exist.", "ADMIN_LIMIT_REACHED");
    }

    const emailTaken = await client.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email],
    );
    if (emailTaken.rows.length > 0) {
      throw new AdminAuthError("An account with this email already exists.", "EMAIL_TAKEN");
    }

    const usernameTaken = await client.query(
      `SELECT id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
      [username],
    );
    if (usernameTaken.rows.length > 0) {
      throw new AdminAuthError("An account with this username already exists.", "USERNAME_TAKEN");
    }

    // Determine authorization: bootstrap secret OR invitation token
    let invitationId: string | null = null;

    if (input.bootstrapSecret) {
      // Bootstrap mode: first admin only
      const expectedSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
      if (!expectedSecret) {
        throw new AdminAuthError("Bootstrap is not configured on this server.", "BOOTSTRAP_NOT_CONFIGURED");
      }
      if (input.bootstrapSecret !== expectedSecret) {
        throw new AdminAuthError("Invalid bootstrap secret.", "INVALID_BOOTSTRAP_SECRET");
      }
      // Bootstrap only allowed if no admins exist yet
      if (existing.rows.length > 0) {
        throw new AdminAuthError("Bootstrap is only available for the first administrator.", "BOOTSTRAP_NOT_ALLOWED");
      }
    } else if (input.invitationToken) {
      // Invitation mode: second admin
      const tokenHash = createHash("sha256").update(input.invitationToken).digest("hex");
      const invitation = await AdminInvitationRepo.findValidInvitation(tokenHash);
      if (!invitation) {
        throw new AdminAuthError("Invalid or expired invitation.", "INVALID_INVITATION");
      }
      // Verify the invitation email matches
      if (invitation.email.toLowerCase() !== email) {
        throw new AdminAuthError("Invitation email does not match registration email.", "INVITATION_EMAIL_MISMATCH");
      }
      invitationId = invitation.id;
    } else {
      throw new AdminAuthError("Either bootstrap secret or invitation token is required.", "MISSING_AUTHORIZATION");
    }

    const passwordHash = await hashPassword(input.password);

    const inserted = await client.query(
      `INSERT INTO users (username, full_name, email, password_hash, email_verified_at)
       VALUES ($1, $2, LOWER($3), $4, NULL)
       RETURNING id, username, full_name, email`,
      [username, input.username.trim(), email, passwordHash],
    );
    const user = inserted.rows[0];
    if (!user) throw new AdminAuthError("Account creation failed.", "CREATE_FAILED");

    const adminRole = await client.query(
      "SELECT id FROM roles WHERE name = 'ADMIN' LIMIT 1",
    );
    if (!adminRole.rows[0]) throw new AdminAuthError("ADMIN role not found.", "ROLE_NOT_FOUND");

    await client.query(
      "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [user.id, adminRole.rows[0].id],
    );

    // Mark invitation as used if applicable
    if (invitationId) {
      await client.query(
        `UPDATE admin_invitations SET used_at = NOW() WHERE id = $1`,
        [invitationId],
      );
    }

    return {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
    };
  });
}

/* ============================================
   OTP - Email verification and password reset
   ============================================ */

/**
 * Generates a 6-digit OTP, hashes it, stores it, and returns the plain code
 * for email delivery.
 */
export async function generateOtp(input: {
  userId: string;
  purpose: "email_verification" | "password_reset" | "login";
}) {
  // Rate limit: max OTP_SEND_RATE_LIMIT_PER_HOUR sends per user per hour.
  const recentSends = await OtpCodeRepo.countOtpCodesSince(
    input.userId,
    input.purpose,
    new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  );
  if (recentSends >= OTP_SEND_RATE_LIMIT_PER_HOUR) {
    throw new AdminAuthError(
      "Too many verification codes sent. Please try again later.",
      "OTP_RATE_LIMITED",
    );
  }

  // Invalidate older unused OTPs for this purpose.
  await OtpCodeRepo.invalidateOldOtps(input.userId, input.purpose);

  // Check resend cooldown: if a code was created within the last 60s, block.
  const existing = await OtpCodeRepo.findValidOtpCode(input.userId, input.purpose);
  if (existing) {
    const createdAt = new Date(existing.created_at).getTime();
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - createdAt) / 1000);
    if (elapsedSeconds < OTP_RESEND_COOLDOWN_SECONDS) {
      const remaining = OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds;
      throw new AdminAuthError(
        `Please wait ${remaining}s before requesting a new code.`,
        "OTP_RESEND_COOLDOWN",
      );
    }
    // Invalidate the old code since we're issuing a new one.
    await OtpCodeRepo.markOtpUsed(existing.id);
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = createHash("sha256").update(code).digest("hex");
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

  await OtpCodeRepo.createOtpCode({
    user_id: input.userId,
    purpose: input.purpose,
    code_hash: codeHash,
    expires_at: expiresAt,
    max_attempts: OTP_MAX_ATTEMPTS,
  });

  return { code, expires_at: expiresAt };
}

/**
 * Verifies a 6-digit OTP code.
 */
export async function verifyOtp(input: {
  userId: string;
  purpose: "email_verification" | "password_reset" | "login";
  code: string;
}) {
  const otp = await OtpCodeRepo.findValidOtpCode(input.userId, input.purpose);
  if (!otp) {
    throw new AdminAuthError("No valid code found. Request a new one.", "OTP_NOT_FOUND");
  }
  if (otp.attempts >= otp.max_attempts) {
    throw new AdminAuthError("Maximum verification attempts reached. Request a new code.", "OTP_MAX_ATTEMPTS");
  }

  const codeHash = createHash("sha256").update(input.code).digest("hex");
  if (codeHash !== otp.code_hash) {
    await OtpCodeRepo.incrementOtpAttempts(otp.id);
    const remaining = otp.max_attempts - (otp.attempts + 1);
    throw new AdminAuthError(`Invalid code. ${remaining} attempt(s) remaining.`, "OTP_INVALID");
  }

  await OtpCodeRepo.markOtpUsed(otp.id);
  return { verified: true };
}

/**
 * Marks the user's email as verified after successful OTP verification.
 */
export async function markEmailVerified(userId: string) {
  const updated = await UserRepo.updateUser(userId, { email_verified_at: new Date().toISOString() });
  if (!updated) throw new AdminAuthError("User not found.", "USER_NOT_FOUND");
  return { id: updated.id, email_verified_at: updated.email_verified_at };
}

/**
 * Activates a pending admin account after successful email OTP verification.
 * Rechecks the two-administrator limit transactionally before activating.
 */
export async function activateAdminAccount(userId: string) {
  const result = await transaction(async (client) => {
    // Recheck the two-admin limit transactionally.
    const existing = await client.query(
      `SELECT u.id FROM users u
       INNER JOIN user_roles ur ON ur.user_id = u.id
       INNER JOIN roles r ON r.id = ur.role_id
       WHERE r.name = 'ADMIN'
       FOR UPDATE`,
    );
    if (existing.rows.length > ADMIN_MAX) {
      throw new AdminAuthError("Maximum administrator accounts already exist.", "ADMIN_LIMIT_REACHED");
    }

    // Verify this user is an admin.
    const isAdmin = await RoleRepo.userHasRole(userId, "ADMIN");
    if (!isAdmin) {
      throw new AdminAuthError("This account is not an administrator.", "FORBIDDEN");
    }

    const user = await AuthRepo.findUserById(userId);
    if (!user || !user.is_active) {
      throw new AdminAuthError("User not found or inactive.", "USER_NOT_FOUND");
    }

    // Mark email as verified.
    const updated = await client.query(
      `UPDATE users SET email_verified_at = NOW() WHERE id = $1 RETURNING id, email_verified_at`,
      [userId],
    );
    if (!updated.rows[0]) throw new AdminAuthError("User not found.", "USER_NOT_FOUND");

    return {
      id: updated.rows[0].id,
      email_verified_at: updated.rows[0].email_verified_at,
    };
  });

  // Create authenticated session after successful activation.
  const token = await createSession(result.id);
  await setSessionCookie(token);

  const user = await AuthRepo.findUserById(result.id);
  return {
    id: result.id,
    email_verified_at: result.email_verified_at,
    roles: user?.roles ?? [],
  };
}

/* ============================================
   LOGIN - Admin authentication
   ============================================ */

/**
 * Authenticates an admin: verifies email/password and ADMIN role.
 * Does NOT create a session yet. Generates and sends a login OTP.
 * The session is created only after successful OTP verification via verifyLogin.
 */
export async function adminLogin(input: {
  email: string;
  password: string;
}) {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password) {
    throw new AdminAuthError("Email and password are required.", "MISSING_CREDENTIALS");
  }

  const user = await AuthRepo.findUserForLogin(email);
  if (!user || !user.is_active) {
    throw new AdminAuthError("Invalid email or password.", "INVALID_CREDENTIALS");
  }
  if (!(await verifyPassword(input.password, user.password_hash))) {
    throw new AdminAuthError("Invalid email or password.", "INVALID_CREDENTIALS");
  }
  const isAdmin = await RoleRepo.userHasRole(user.id, "ADMIN");
  if (!isAdmin) {
    throw new AdminAuthError("This account is not an administrator.", "FORBIDDEN");
  }

  // Generate and send login OTP (two-factor). Session is created only after OTP verification.
  const otp = await generateOtp({ userId: user.id, purpose: "login" });
  const userRecord = await UserRepo.getUserById(user.id);
  if (userRecord) {
    try {
      await sendAdminOtpEmail({
        to: userRecord.email,
        userId: user.id,
        code: otp.code,
        purpose: "login",
        expiresInMinutes: 10,
      });
    } catch (mailErr) {
      console.error("[AdminLogin] OTP mail send failed:", mailErr instanceof Error ? mailErr.message : mailErr);
    }
  }

  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    requiresOtp: true,
  };
}

/**
 * Verifies login OTP and creates an admin session.
 * Re-checks ADMIN role before creating the session.
 */
export async function verifyLogin(input: {
  userId: string;
  otpCode: string;
}) {
  await verifyOtp({
    userId: input.userId,
    purpose: "login",
    code: input.otpCode,
  });

  // Re-check ADMIN role before creating session
  const isAdmin = await RoleRepo.userHasRole(input.userId, "ADMIN");
  if (!isAdmin) {
    throw new AdminAuthError("This account is not an administrator.", "FORBIDDEN");
  }

  const user = await AuthRepo.findUserById(input.userId);
  if (!user || !user.is_active) {
    throw new AdminAuthError("User not found or inactive.", "USER_NOT_FOUND");
  }

  const token = await createSession(input.userId);

  return {
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      roles: user.roles,
    },
  };
}

/**
 * Logs out the current admin by revoking the session and clearing the cookie.
 */
export async function adminLogout() {
  const token = await getSessionToken();
  if (token) {
    const session = await UserSessionRepo.findValidSession(hashSessionToken(token));
    if (session) await UserSessionRepo.revokeSession(session.id);
  }
  await clearSessionCookie();
  return { ok: true };
}

/* ============================================
   PASSWORD RESET (admin)
   ============================================ */

/**
 * Initiates password reset: generates OTP for the admin's email.
 * Returns userId if the email belongs to an active admin, null otherwise
 * (generic response to prevent email enumeration).
 */
export async function adminForgotPassword(input: { email: string }) {
  const email = input.email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new AdminAuthError("A valid email is required.", "INVALID_EMAIL");
  }

  const user = await AuthRepo.findUserForLogin(email);
  if (user && user.is_active) {
    const isAdmin = await RoleRepo.userHasRole(user.id, "ADMIN");
    if (isAdmin) {
      const otp = await generateOtp({ userId: user.id, purpose: "password_reset" });
      return { userId: user.id, otpExpiresAt: otp.expires_at };
    }
  }
  // Generic response: don't reveal whether email exists.
  return { userId: null };
}

/**
 * Resets password after OTP verification.
 */
export async function adminResetPassword(input: {
  userId: string;
  otpCode: string;
  newPassword: string;
}) {
  if (input.newPassword.length < 8 || input.newPassword.length > 128) {
    throw new AdminAuthError("Password must contain between 8 and 128 characters.", "INVALID_PASSWORD");
  }

  await verifyOtp({
    userId: input.userId,
    purpose: "password_reset",
    code: input.otpCode,
  });

  const newPasswordHash = await hashPassword(input.newPassword);
  await AuthService.changePassword({
    userId: input.userId,
    newPasswordHash,
  });
  return { ok: true };
}
