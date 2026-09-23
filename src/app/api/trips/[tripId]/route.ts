import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getTripRole } from "@/lib/access";
import { loadTripDetail } from "@/lib/trip-detail";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { tripId } = await params;
  const role = await getTripRole(tripId, userId);
  if (!role) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const detail = await loadTripDetail(tripId, role);
  if (!detail) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json(detail);
}
