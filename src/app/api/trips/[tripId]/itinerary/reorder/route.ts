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
  // index while orders are being shuffled. Uses db.batch() rather than
  // db.transaction(): the neon-http driver has no interactive-transaction
  // support (HTTP, not a persistent session), only single-round-trip batches.
  const { orderedItemIds } = parsed.data;

  const updateOrder = (id: string, order: number) =>
    db
      .update(itineraryItems)
      .set({ order })
      .where(and(eq(itineraryItems.id, id), eq(itineraryItems.itineraryDayId, day.id)));

  const queries = [
    ...orderedItemIds.map((id, i) => updateOrder(id, -(i + 1))),
    ...orderedItemIds.map((id, i) => updateOrder(id, i)),
  ] as [ReturnType<typeof updateOrder>, ...ReturnType<typeof updateOrder>[]];

  await db.batch(queries);

  return NextResponse.json({ ok: true });
}
