import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getTripRole } from "@/lib/access";
import { loadTripDetail } from "@/lib/trip-detail";
import { TripWorkspace } from "@/components/trip/trip-workspace";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return null;

  const { tripId } = await params;
  const role = await getTripRole(tripId, userId);
  if (!role) notFound();

  const initial = await loadTripDetail(tripId, role);
  if (!initial) notFound();

  return (
    <TripWorkspace
      tripId={tripId}
      initial={initial}
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
    />
  );
}
