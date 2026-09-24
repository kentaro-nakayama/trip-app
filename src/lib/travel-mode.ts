export type TravelMode = "walking" | "driving" | "transit" | "bicycling";

export const TRAVEL_MODES: TravelMode[] = ["walking", "driving", "transit", "bicycling"];

export const travelModeLabel: Record<TravelMode, string> = {
  walking: "徒歩",
  driving: "車",
  transit: "公共交通機関",
  bicycling: "自転車",
};

/** Maps our storage-friendly mode names to the Google Maps TravelMode enum. */
export const travelModeToGoogle: Record<TravelMode, google.maps.TravelMode> = {
  walking: "WALKING" as google.maps.TravelMode,
  driving: "DRIVING" as google.maps.TravelMode,
  transit: "TRANSIT" as google.maps.TravelMode,
  bicycling: "BICYCLING" as google.maps.TravelMode,
};

/** Resolves the travel duration (in whole minutes) between two points, or null if unavailable. */
export async function fetchTravelDurationMinutes(
  routesLib: google.maps.RoutesLibrary,
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: TravelMode,
): Promise<number | null> {
  try {
    const service = new routesLib.DistanceMatrixService();
    const res = await service.getDistanceMatrix({
      origins: [origin],
      destinations: [destination],
      travelMode: travelModeToGoogle[mode],
    });
    const element = res.rows[0]?.elements[0];
    if (element?.status === "OK" && element.duration) {
      return Math.round(element.duration.value / 60);
    }
  } catch {
    // Treated the same as "unavailable" by callers.
  }
  return null;
}
