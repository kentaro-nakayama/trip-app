"use client";

import { useEffect } from "react";
import { AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps";

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
}: {
  pins: MapPin[];
  onMapClick?: (lat: number, lng: number) => void;
}) {
  return (
    <Map
      className="h-full w-full"
      defaultCenter={{ lat: 35.681236, lng: 139.767125 }}
      defaultZoom={11}
      mapId="TRIP_PLAN_MAP"
      gestureHandling="greedy"
      disableDefaultUI={false}
      onClick={(ev) => {
        if (!onMapClick || !ev.detail.latLng) return;
        onMapClick(ev.detail.latLng.lat, ev.detail.latLng.lng);
      }}
    >
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
