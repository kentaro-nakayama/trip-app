import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { spotListMembers } from "@/db/schema";
import { getSpotListRole } from "@/lib/access";

const updateMemberSchema = z.object({
  role: z.enum(["editor", "viewer"]),
});

async function requireOwnerAndTargetMember(
  spotListId: string,
  memberId: string,
  userId: string | null,
) {
  if (!userId) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };

  const role = await getSpotListRole(spotListId, userId);
  if (role !== "owner") {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }

  const db = getDb();
  const [target] = await db
    .select()
    .from(spotListMembers)
    .where(and(eq(spotListMembers.id, memberId), eq(spotListMembers.spotListId, spotListId)))
    .limit(1);

  if (!target) return { error: NextResponse.json({ error: "not_found" }, { status: 404 }) };
  if (target.role === "owner") {
    return {
      error: NextResponse.json(
        { error: "オーナーの権限は変更できません" },
        { status: 400 },
      ),
    };
  }

  return { db, target };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ spotListId: string; memberId: string }> },
) {
  const { userId } = await auth();
  const { spotListId, memberId } = await params;

  const result = await requireOwnerAndTargetMember(spotListId, memberId, userId);
  if (result.error) return result.error;

  const parsed = updateMemberSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await result.db
    .update(spotListMembers)
    .set({ role: parsed.data.role })
    .where(eq(spotListMembers.id, memberId))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ spotListId: string; memberId: string }> },
) {
  const { userId } = await auth();
  const { spotListId, memberId } = await params;

  const result = await requireOwnerAndTargetMember(spotListId, memberId, userId);
  if (result.error) return result.error;

  await result.db.delete(spotListMembers).where(eq(spotListMembers.id, memberId));

  return NextResponse.json({ ok: true });
}
