import * as AuditRepo from "@/lib/repositories/audit-log.repository";
import * as RoleRepo from "@/lib/repositories/role.repository";
import * as ApplicationRepo from "@/lib/repositories/membership-application.repository";
import * as UserRepo from "@/lib/repositories/user.repository";
import * as ProfileRepo from "@/lib/repositories/photographer-profile.repository";
import * as PortfolioRepo from "@/lib/repositories/portfolio.repository";
import * as PhotoRepo from "@/lib/repositories/photo.repository";
import * as BookingRepo from "@/lib/repositories/booking.repository";
import { query, transaction } from "@/lib/db";
/** Call these only from server routes/actions after verifying the actor's ADMIN role. */
export const hasAdminRole=(userId:string)=>RoleRepo.userHasRole(userId,"ADMIN");
export async function recordAdminAction(i:{authenticatedAdminId:string;action:string;targetType?:string|null;targetId?:string|null;metadata?:Record<string,unknown>}) { if(!i.action.trim()) throw new Error("Audit action is required."); return AuditRepo.createAuditLog({admin_id:i.authenticatedAdminId,action:i.action.trim(),target_type:i.targetType??null,target_id:i.targetId??null,metadata:i.metadata??{}}); }
export const listApplications=(limit=50,offset=0)=>ApplicationRepo.listMembershipApplications(Math.min(Math.max(limit,1),100),Math.max(offset,0));
export const listAuditLogs=(limit=50,offset=0)=>AuditRepo.listAuditLogs(Math.min(Math.max(limit,1),100),Math.max(offset,0));

export type AdminUser = {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  roles: string[];
  email_verified_at: string | Date | null;
  created_at: string | Date;
};

export async function listAdminUsers(limit = 50, offset = 0) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
    throw new Error("Invalid pagination.");
  }
  const users = await UserRepo.listUsers(limit, offset);
  const result: AdminUser[] = [];
  for (const u of users) {
    const roles = await RoleRepo.getUserRoles(u.id);
    result.push({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      is_active: u.is_active,
      roles: roles.map((r) => r.name),
      email_verified_at: u.email_verified_at,
      created_at: u.created_at,
    });
  }
  return result;
}

export async function updateUserRole(input: {
  authenticatedAdminId: string;
  userId: string;
  roleName: string;
  action: "ASSIGN" | "REVOKE";
}) {
  if (input.userId === input.authenticatedAdminId && input.roleName === "ADMIN" && input.action === "REVOKE") {
    throw new Error("You cannot remove your own administrator access.");
  }
  if (input.roleName === "ADMIN" && input.action === "REVOKE" && await isFounderAdmin(input.userId)) {
    throw new Error("Transfer Founder Admin status before removing this account's administrator role.");
  }
  const targetUser = await UserRepo.getUserById(input.userId);
  if (!targetUser) throw new Error("User not found.");
  const role = await RoleRepo.getRoleByName(input.roleName);
  if (!role) throw new Error(`Role "${input.roleName}" does not exist.`);
  if (input.action === "ASSIGN") {
    await RoleRepo.assignRole(input.userId, role.id);
  } else {
    await RoleRepo.removeRole(input.userId, role.id);
  }
  await recordAdminAction({
    authenticatedAdminId: input.authenticatedAdminId,
    action: `user_role_${input.action.toLowerCase()}`,
    targetType: "user",
    targetId: input.userId,
    metadata: { role: input.roleName, action: input.action },
  });
  return { ok: true };
}

export async function deactivateUser(input: {
  authenticatedAdminId: string;
  userId: string;
  isActive: boolean;
}) {
  if (input.userId === input.authenticatedAdminId && !input.isActive) {
    throw new Error("You cannot deactivate your own account.");
  }
  if (!input.isActive && await isFounderAdmin(input.userId)) {
    throw new Error("Transfer Founder Admin status before deactivating this account.");
  }
  const row = await UserRepo.updateUser(input.userId, { is_active: input.isActive });
  if (!row) throw new Error("User not found.");
  await recordAdminAction({
    authenticatedAdminId: input.authenticatedAdminId,
    action: input.isActive ? "user_activate" : "user_deactivate",
    targetType: "user",
    targetId: input.userId,
    metadata: { is_active: input.isActive },
  });
  return row;
}

export type AdminPhotographer = {
  id: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  title: string | null;
  bio: string | null;
  location: string | null;
  is_available: boolean;
  roles: string[];
  created_at: string | Date;
};

export async function listAdminPhotographers(limit = 50, offset = 0) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
    throw new Error("Invalid pagination.");
  }
  const profiles = await ProfileRepo.listPhotographerProfiles(limit, offset);
  const result: AdminPhotographer[] = [];
  for (const p of profiles) {
    let user: { full_name: string | null; email: string } | null = null;
    if (p.user_id) {
      const u = await UserRepo.getUserById(p.user_id);
      if (u) {
        const { password_hash: _secret, ...safe } = u;
        void _secret;
        user = { full_name: safe.full_name, email: safe.email };
      }
    }
    const roles = p.user_id ? await RoleRepo.getUserRoles(p.user_id) : [];
    result.push({
      id: p.id,
      user_id: p.user_id,
      full_name: user?.full_name ?? null,
      email: null,
      title: p.title,
      bio: p.bio,
      location: p.location,
      is_available: p.is_available,
      roles: roles.map((r) => r.name),
      created_at: p.created_at,
    });
  }
  return result;
}

export type AdminPortfolio = {
  id: string;
  photographer_id: string;
  photographer_name: string | null;
  title: string | null;
  slug: string;
  is_public: boolean;
  created_at: string | Date;
};

export async function listAdminPortfolios(limit = 50, offset = 0) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
    throw new Error("Invalid pagination.");
  }
  const portfolios = await PortfolioRepo.listPortfolios(limit, offset);
  const result: AdminPortfolio[] = [];
  for (const p of portfolios) {
    let photographer_name: string | null = null;
    if (p.photographer_id) {
      const prof = await ProfileRepo.getPhotographerProfileById(p.photographer_id);
      if (prof && prof.user_id) {
        const u = await UserRepo.getUserById(prof.user_id);
        if (u) {
          const { password_hash: _secret, ...safe } = u;
          void _secret;
          photographer_name = safe.full_name ?? null;
        }
      }
    }
    result.push({
      id: p.id,
      photographer_id: p.photographer_id,
      photographer_name,
      title: p.title,
      slug: p.slug,
      is_public: p.is_public,
      created_at: p.created_at,
    });
  }
  return result;
}

export type AdminPhoto = {
  id: string;
  photographer_id: string;
  photographer_name: string | null;
  title: string | null;
  image_url: string;
  visibility: string;
  created_at: string | Date;
};

export async function listAdminPhotos(limit = 50, offset = 0) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
    throw new Error("Invalid pagination.");
  }
  const photos = await PhotoRepo.listPhotos(limit, offset);
  const result: AdminPhoto[] = [];
  for (const p of photos) {
    let photographer_name: string | null = null;
    if (p.photographer_id) {
      const prof = await ProfileRepo.getPhotographerProfileById(p.photographer_id);
      if (prof && prof.user_id) {
        const u = await UserRepo.getUserById(prof.user_id);
        if (u) {
          const { password_hash: _secret, ...safe } = u;
          void _secret;
          photographer_name = safe.full_name ?? null;
        }
      }
    }
    result.push({
      id: p.id,
      photographer_id: p.photographer_id,
      photographer_name,
      title: p.title,
      image_url: p.image_url,
      visibility: p.visibility,
      created_at: p.created_at,
    });
  }
  return result;
}

export type AdminBooking = {
  id: string;
  booking_number: string;
  client_id: string;
  client_name: string | null;
  photographer_id: string;
  photographer_name: string | null;
  title: string | null;
  booking_date: string | Date;
  status: string;
  created_at: string | Date;
};

export async function listAdminBookings(limit = 50, offset = 0) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
    throw new Error("Invalid pagination.");
  }
  const bookings = await BookingRepo.listBookings(limit, offset);
  const result: AdminBooking[] = [];
  for (const b of bookings) {
    let client_name: string | null = null;
    let photographer_name: string | null = null;
    if (b.client_id) {
      const u = await UserRepo.getUserById(b.client_id);
      if (u) client_name = u.full_name;
    }
    if (b.photographer_id) {
      const prof = await ProfileRepo.getPhotographerProfileById(b.photographer_id);
      if (prof && prof.user_id) {
        const u = await UserRepo.getUserById(prof.user_id);
        if (u) {
          const { password_hash: _secret, ...safe } = u;
          void _secret;
          photographer_name = safe.full_name ?? null;
        }
      }
    }
    result.push({
      id: b.id,
      booking_number: b.booking_number,
      client_id: b.client_id,
      client_name,
      photographer_id: b.photographer_id,
      photographer_name,
      title: b.title,
      booking_date: b.booking_date,
      status: b.status,
      created_at: b.created_at,
    });
  }
  return result;
}

/* ============================================
   FOUNDER ADMIN DESIGNATION
   ============================================ */

/**
 * Checks whether a user is the active Founder Admin.
 * Founder Admin is a separate designation from the ADMIN role.
 */
export async function isFounderAdmin(userId: string): Promise<boolean> {
  const row = await query(
    `SELECT is_active FROM admin_founders WHERE user_id = $1 AND is_active = TRUE LIMIT 1`,
    [userId],
  );
  return row?.rows?.[0]?.is_active ?? false;
}

/**
 * Gets the current active Founder Admin user, if any.
 */
export async function getFounderAdmin() {
  const row = await query(
    `SELECT u.id, u.full_name, u.email, af.designated_at
     FROM admin_founders af
     INNER JOIN users u ON af.user_id = u.id
     WHERE af.is_active = TRUE
     LIMIT 1`,
  );
  return row?.rows?.[0] ?? null;
}

/**
 * Designates a user as Founder Admin. Only callable when no active founder exists
 * or when transferring from an existing founder. Enforces single active founder.
 */
export async function designateFounderAdmin(input: {
  authenticatedAdminId: string;
  targetUserId: string;
  reason?: string;
}) {
  // Verify the actor is currently the active founder
  const currentFounder = await getFounderAdmin();
  if (!currentFounder || currentFounder.id !== input.authenticatedAdminId) {
    throw new Error("Only the current Founder Admin can designate a new founder.");
  }

  // Prevent self-designation
  if (input.authenticatedAdminId === input.targetUserId) {
    throw new Error("Cannot designate yourself as Founder Admin.");
  }

  // Verify target user exists and has ADMIN role
  const targetUser = await UserRepo.getUserById(input.targetUserId);
  if (!targetUser) throw new Error("Target user not found.");
  if (!targetUser.is_active) throw new Error("Target user must be active.");
  const isAdmin = await RoleRepo.userHasRole(input.targetUserId, "ADMIN");
  if (!isAdmin) throw new Error("Target user must already have the ADMIN role.");

  return transaction(async (client) => {
    // Deactivate current founder
    await client.query(
      `UPDATE admin_founders SET is_active = FALSE, transferred_at = NOW(), transferred_to = $2, transfer_reason = $3 WHERE user_id = $1`,
      [input.authenticatedAdminId, input.targetUserId, input.reason ?? "Ownership transfer"],
    );

    // Activate new founder
    await client.query(
      `INSERT INTO admin_founders (user_id, designated_at, designated_by, is_active) VALUES ($1, NOW(), $2, TRUE)
       ON CONFLICT (user_id) DO UPDATE SET is_active = TRUE, designated_at = NOW(), designated_by = $2, transferred_at = NULL, transferred_to = NULL, transfer_reason = NULL`,
      [input.targetUserId, input.authenticatedAdminId],
    );

    await recordAdminAction({
      authenticatedAdminId: input.authenticatedAdminId,
      action: "founder_transfer",
      targetType: "user",
      targetId: input.targetUserId,
      metadata: { reason: input.reason, previousFounder: input.authenticatedAdminId, newFounder: input.targetUserId },
    });

    return { ok: true, previousFounderId: input.authenticatedAdminId, newFounderId: input.targetUserId };
  });
}

export type DashboardStats = {
  totalUsers: number;
  activeUsers: number;
  activeMembers: number;
  pendingMembershipApplications: number;
  registeredPhotographers: number;
  pendingPhotoSubmissions: number;
  approvedPhotographs: number;
  publishedEvents: number;
  upcomingEvents: number;
  publishedExhibitions: number;
  activeBookings: number;
  pendingBookings: number;
  publishedAwards: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const [totalUsers, activeUsers, pendingApps, photos, events, exhibitions, bookings, awards] =
    await Promise.all([
      query("SELECT COUNT(*)::text AS c FROM users"),
      query("SELECT COUNT(*)::text AS c FROM users WHERE is_active = TRUE"),
      query("SELECT COUNT(*)::text AS c FROM membership_applications WHERE status = 'PENDING'"),
      query("SELECT COUNT(*)::text AS c FROM photos WHERE visibility <> 'PUBLIC'"),
      query("SELECT COUNT(*)::text AS c FROM events WHERE status = 'PUBLISHED'"),
      query("SELECT COUNT(*)::text AS c FROM exhibitions WHERE status = 'PUBLISHED'"),
      query("SELECT COUNT(*)::text AS c FROM bookings WHERE status IN ('PENDING', 'CONFIRMED')"),
      query("SELECT COUNT(*)::text AS c FROM awards"),
    ]);

  // Active members: users with MEMBER role
  const membersResult = await query(
    `SELECT COUNT(DISTINCT ur.user_id)::text AS c FROM user_roles ur INNER JOIN roles r ON r.id = ur.role_id WHERE r.name = 'MEMBER'`
  );

  // Registered photographers: users with PHOTOGRAPHER role
  const photographersResult = await query(
    `SELECT COUNT(DISTINCT ur.user_id)::text AS c FROM user_roles ur INNER JOIN roles r ON r.id = ur.role_id WHERE r.name = 'PHOTOGRAPHER'`
  );

  // Upcoming events: published events with start_at in the future
  const upcomingEventsResult = await query(
    `SELECT COUNT(*)::text AS c FROM events WHERE status = 'PUBLISHED' AND start_at > NOW()`
  );

  // Pending bookings
  const pendingBookingsResult = await query(
    "SELECT COUNT(*)::text AS c FROM bookings WHERE status = 'PENDING'"
  );

  // Approved photographs: photos visible to the public
  const approvedPhotosResult = await query(
    "SELECT COUNT(*)::text AS c FROM photos WHERE visibility = 'PUBLIC'"
  );

  return {
    totalUsers: parseInt(totalUsers.rows[0]?.c ?? "0", 10),
    activeUsers: parseInt(activeUsers.rows[0]?.c ?? "0", 10),
    activeMembers: parseInt(membersResult.rows[0]?.c ?? "0", 10),
    pendingMembershipApplications: parseInt(pendingApps.rows[0]?.c ?? "0", 10),
    registeredPhotographers: parseInt(photographersResult.rows[0]?.c ?? "0", 10),
    pendingPhotoSubmissions: parseInt(photos.rows[0]?.c ?? "0", 10),
    approvedPhotographs: parseInt(approvedPhotosResult.rows[0]?.c ?? "0", 10),
    publishedEvents: parseInt(events.rows[0]?.c ?? "0", 10),
    upcomingEvents: parseInt(upcomingEventsResult.rows[0]?.c ?? "0", 10),
    publishedExhibitions: parseInt(exhibitions.rows[0]?.c ?? "0", 10),
    activeBookings: parseInt(bookings.rows[0]?.c ?? "0", 10),
    pendingBookings: parseInt(pendingBookingsResult.rows[0]?.c ?? "0", 10),
    publishedAwards: parseInt(awards.rows[0]?.c ?? "0", 10),
  };
}

export type RecentActivity = {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: string | Date;
};

export async function getRecentActivity(limit = 10): Promise<RecentActivity[]> {
  const rows = await query(
    `SELECT al.id, al.action, al.target_type, al.target_id, al.created_at,
            u.full_name AS actor_name, u.email AS actor_email
     FROM audit_logs al
     INNER JOIN users u ON al.admin_id = u.id
     ORDER BY al.created_at DESC
     LIMIT $1`,
    [limit],
  );
  return (rows.rows ?? []).map((r) => ({
    id: r.id,
    action: r.action,
    targetType: r.target_type,
    targetId: r.target_id,
    actorName: r.actor_name,
    actorEmail: r.actor_email,
    createdAt: r.created_at,
  }));
}
