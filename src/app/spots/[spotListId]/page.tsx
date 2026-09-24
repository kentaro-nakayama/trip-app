import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { loadSpotListDetail } from "@/lib/spot-list-detail";
import { SpotListWorkspace } from "@/components/spots/spot-list-workspace";

export default async function SpotListDetailPage({
  params,
}: {
  params: Promise<{ spotListId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return null;

  const { spotListId } = await params;
  const initial = await loadSpotListDetail(spotListId, userId);
  if (!initial) notFound();

  return (
    <SpotListWorkspace
      spotListId={spotListId}
      initial={initial}
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
    />
  );
}
