"use client";

import { useCallback, useEffect } from "react";
import { AdvancedMarker, Map, Polyline, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import type { PlaceSelection } from "./spot-search";

export type MapPin = {
  id: string;
  order: number;
  lat: number;
  lng: number;
  name: string;
};

function FitBoundsToPins({ pins }: { pins: MapPin[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || pins.length === 0) return;

    if (pins.length === 1) {
      map.panTo({ lat: pins[0].lat, lng: pins[0].lng });
      map.setZoom(14);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    for (const pin of pins) bounds.extend({ lat: pin.lat, lng: pin.lng });
    map.fitBounds(bounds, 64);
  }, [map, pins]);

  return null;
}

export function TripMap({
  pins,
  onMapClick,
  onPoiClick,
}: {
  pins: MapPin[];
  onMapClick?: (lat: number, lng: number) => void;
  onPoiClick?: (place: PlaceSelection) => void;
}) {
  const placesLib = useMapsLibrary("places");

  const handlePoiClick = useCallback(
    async (placeId: string) => {
      if (!placesLib || !onPoiClick) return;
      const place = new placesLib.Place({ id: placeId });
      await place.fetchFields({ fields: ["displayName", "formattedAddress", "location"] });
      if (!place.location) return;
      onPoiClick({
        name: place.displayName ?? "",
        address: place.formattedAddress ?? null,
        lat: place.location.lat(),
        lng: place.location.lng(),
        googlePlaceId: placeId,
      });
    },
    [placesLib, onPoiClick],
  );

  return (
    <Map
      className="h-full w-full"
      defaultCenter={{ lat: 35.681236, lng: 139.767125 }}
      defaultZoom={11}
      mapId="TRIP_PLAN_MAP"
      gestureHandling="greedy"
      disableDefaultUI={false}
      onClick={(ev) => {
        // Click-to-add-custom-spot mode takes priority over Google POI details.
        if (onMapClick) {
          if (!ev.detail.latLng) return;
          ev.stop();
          onMapClick(ev.detail.latLng.lat, ev.detail.latLng.lng);
          return;
        }
        if (ev.detail.placeId) {
          ev.stop();
          handlePoiClick(ev.detail.placeId);
        }
      }}
    >
      {pins.length > 1 && (
        <Polyline
          path={pins.map((pin) => ({ lat: pin.lat, lng: pin.lng }))}
          strokeColor="#2563eb"
          strokeOpacity={0.8}
          strokeWeight={3}
        />
      )}
      {pins.map((pin) => (
        <AdvancedMarker key={pin.id} position={{ lat: pin.lat, lng: pin.lng }} title={pin.name}>
          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-sm font-semibold text-white shadow">
            {pin.order + 1}
          </div>
        </AdvancedMarker>
      ))}
      <FitBoundsToPins pins={pins} />
    </Map>
  );
}
