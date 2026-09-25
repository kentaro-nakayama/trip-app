import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { spotLists } from "@/db/schema";
import { getSpotListRole, hasAtLeastRole } from "@/lib/access";
import { loadSpotListDetail } from "@/lib/spot-list-detail";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ spotListId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { spotListId } = await params;
  const role = await getSpotListRole(spotListId, userId);
  if (!role) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const detail = await loadSpotListDetail(spotListId, role);
  if (!detail) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json(detail);
}

const updateSpotListSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ spotListId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { spotListId } = await params;
  const role = await getSpotListRole(spotListId, userId);
  if (!hasAtLeastRole(role, "editor")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = updateSpotListSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const [spotList] = await db
    .update(spotLists)
    .set({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      updatedAt: new Date(),
    })
    .where(eq(spotLists.id, spotListId))
    .returning();

  if (!spotList) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json(spotList);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ spotListId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { spotListId } = await params;
  const role = await getSpotListRole(spotListId, userId);
  if (role !== "owner") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const db = getDb();
  await db.delete(spotLists).where(eq(spotLists.id, spotListId));

  return NextResponse.json({ ok: true });
}
