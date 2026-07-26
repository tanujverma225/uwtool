import { getCurrentProfile } from "@/lib/actions/bids";
import type { UserRole } from "@/db/schema";

export async function requireRole(roles: UserRole[]) {
  const profile = await getCurrentProfile();
  if (!profile || !roles.includes(profile.role as UserRole)) {
    return { error: "Unauthorized", profile: null };
  }
  return { error: null, profile };
}

export async function requireAdmin() {
  return requireRole(["admin", "manager"]);
}

export function isAdminRole(role?: string | null) {
  return role === "admin" || role === "manager";
}
