export type Spot = {
  id: string;
  tripId: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  googlePlaceId: string | null;
  notes: string | null;
  createdByUserId: string;
  createdAt: string;
};

export type ItineraryItem = {
  id: string;
  itineraryDayId: string;
  spotId: string;
  order: number;
  startTime: string | null;
  durationMinutes: number | null;
  travelMode: "walking" | "driving" | "transit" | "bicycling" | null;
  spot: Spot;
};

export type ItineraryDay = {
  id: string;
  tripId: string;
  date: string | null;
  dayIndex: number;
  items: ItineraryItem[];
};

export type TripMember = {
  id: string;
  userId: string;
  role: "owner" | "editor" | "viewer";
};

export type TripDetail = {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  ownerId: string;
  myRole: "owner" | "editor" | "viewer";
  members: TripMember[];
  days: ItineraryDay[];
  spots: Spot[];
};

export type TripSummary = {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  myRole: "owner" | "editor" | "viewer";
};

export type SavedSpot = {
  id: string;
  spotListId: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  googlePlaceId: string | null;
  notes: string | null;
  createdAt: string;
};

export type SpotListMember = {
  id: string;
  userId: string;
  role: "owner" | "editor" | "viewer";
};

export type SpotListSummary = {
  id: string;
  name: string;
  description: string | null;
  spotCount: number;
};

export type SpotListDetail = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  myRole: "owner" | "editor" | "viewer";
  members: SpotListMember[];
  spots: SavedSpot[];
};
