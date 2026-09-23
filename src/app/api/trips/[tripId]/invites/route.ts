import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { getDb } from "@/db";
import { invites } from "@/db/schema";
import { getTripRole, hasAtLeastRole } from "@/lib/access";

const createInviteSchema = z.object({
  role: z.enum(["editor", "viewer"]).default("editor"),
});

const INVITE_TTL_DAYS = 7;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { tripId } = await params;
  const role = await getTripRole(tripId, userId);
  if (!hasAtLeastRole(role, "editor")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = createInviteSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const [invite] = await db
    .insert(invites)
    .values({
      tripId,
      role: parsed.data.role,
      invitedByUserId: userId,
      token: randomBytes(24).toString("hex"),
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
    })
    .returning();

  return NextResponse.json(invite, { status: 201 });
}
