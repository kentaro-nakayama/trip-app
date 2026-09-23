import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tripMembers } from "@/db/schema";

export type TripRole = "owner" | "editor" | "viewer";

const roleRank: Record<TripRole, number> = { viewer: 0, editor: 1, owner: 2 };

export async function getTripRole(
  tripId: string,
  userId: string,
): Promise<TripRole | null> {
  const db = getDb();
  const [member] = await db
    .select({ role: tripMembers.role })
    .from(tripMembers)
    .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, userId)))
    .limit(1);
  return member?.role ?? null;
}

export function hasAtLeastRole(role: TripRole | null, min: TripRole): boolean {
  if (!role) return false;
  return roleRank[role] >= roleRank[min];
}
