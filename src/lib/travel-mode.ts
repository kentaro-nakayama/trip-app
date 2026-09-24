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
