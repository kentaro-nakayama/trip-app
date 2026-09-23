import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { itineraryDays, itineraryItems } from "@/db/schema";
import { getTripRole, hasAtLeastRole } from "@/lib/access";

const reorderSchema = z.object({
  itineraryDayId: z.string().uuid(),
  orderedItemIds: z.array(z.string().uuid()).min(1),
});

export async function PATCH(
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

  const parsed = reorderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();

  const [day] = await db
    .select({ id: itineraryDays.id })
    .from(itineraryDays)
    .where(
      and(
        eq(itineraryDays.id, parsed.data.itineraryDayId),
        eq(itineraryDays.tripId, tripId),
      ),
    )
    .limit(1);
  if (!day) return NextResponse.json({ error: "day_not_found" }, { status: 404 });

  // Two-phase update avoids clashing with the (itineraryDayId, order) unique
  // index while orders are being shuffled.
  await db.transaction(async (tx) => {
    const { orderedItemIds } = parsed.data;
    for (let i = 0; i < orderedItemIds.length; i++) {
      await tx
        .update(itineraryItems)
        .set({ order: -(i + 1) })
        .where(
          and(
            eq(itineraryItems.id, orderedItemIds[i]),
            eq(itineraryItems.itineraryDayId, day.id),
          ),
        );
    }
    for (let i = 0; i < orderedItemIds.length; i++) {
      await tx
        .update(itineraryItems)
        .set({ order: i })
        .where(
          and(
            eq(itineraryItems.id, orderedItemIds[i]),
            eq(itineraryItems.itineraryDayId, day.id),
          ),
        );
    }
  });

  return NextResponse.json({ ok: true });
}
