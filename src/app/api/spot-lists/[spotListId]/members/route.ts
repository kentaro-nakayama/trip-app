import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { spotListMembers } from "@/db/schema";
import { getSpotListRole } from "@/lib/access";
import { resolveUsers } from "@/lib/clerk-users";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ spotListId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { spotListId } = await params;
  const role = await getSpotListRole(spotListId, userId);
  if (!role) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const db = getDb();
  const members = await db
    .select({ id: spotListMembers.id, userId: spotListMembers.userId, role: spotListMembers.role })
    .from(spotListMembers)
    .where(eq(spotListMembers.spotListId, spotListId));

  const users = await resolveUsers(members.map((m) => m.userId));

  const result = members
    .map((member) => {
      const user = users.get(member.userId);
      return {
        id: member.id,
        userId: member.userId,
        role: member.role,
        name: user?.name ?? "不明なユーザー",
        email: user?.email ?? null,
        imageUrl: user?.imageUrl ?? null,
      };
    })
    .sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0));

  return NextResponse.json(result);
}
