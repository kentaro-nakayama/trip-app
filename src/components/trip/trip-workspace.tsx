"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { APIProvider } from "@vis.gl/react-google-maps";
import { toast } from "sonner";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddressSpotDialog, type AddressSpotSelection } from "./address-spot-dialog";
import { DayColumn } from "./day-column";
import { SpotSearch, type PlaceSelection } from "./spot-search";
import { TripMap, type MapPin as MapPinType } from "./trip-map";
import { InviteDialog } from "./invite-dialog";
import type { TripDetail } from "@/lib/types";

async function fetchTrip(tripId: string): Promise<TripDetail> {
  const res = await fetch(`/api/trips/${tripId}`);
  if (!res.ok) throw new Error("旅行の取得に失敗しました");
  return res.json();
}

export function TripWorkspace({
  tripId,
  initial,
  googleMapsApiKey,
}: {
  tripId: string;
  initial: TripDetail;
  googleMapsApiKey: string;
}) {
  const queryClient = useQueryClient();
  const queryKey = ["trip", tripId];

  const { data } = useQuery({
    queryKey,
    queryFn: () => fetchTrip(tripId),
    initialData: initial,
  });

  const [selectedDayId, setSelectedDayId] = useState<string | null>(
    initial.days[0]?.id ?? null,
  );
  const [clickToAdd, setClickToAdd] = useState(false);
  const [pendingLatLng, setPendingLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingName, setPendingName] = useState("");

  const readOnly = data.myRole === "viewer";
  const selectedDay = data.days.find((d) => d.id === selectedDayId) ?? data.days[0] ?? null;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey });
  }

  const createDay = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/days`, { method: "POST" });
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    onSuccess: (day) => {
      invalidate();
      setSelectedDayId(day.id);
    },
    onError: () => toast.error("日程の追加に失敗しました"),
  });

  const addItem = useMutation({
    mutationFn: async ({ dayId, spotId }: { dayId: string; spotId: string }) => {
      const res = await fetch(`/api/trips/${tripId}/itinerary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itineraryDayId: dayId, spotId }),
      });
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    onSuccess: () => invalidate(),
    onError: () => toast.error("行程への追加に失敗しました"),
  });

  const createSpot = useMutation({
    mutationFn: async (input: {
      name: string;
      address?: string | null;
      lat: number;
      lng: number;
      googlePlaceId?: string;
    }) => {
      const res = await fetch(`/api/trips/${tripId}/spots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
  });

  const reorder = useMutation({
    mutationFn: async ({
      dayId,
      orderedItemIds,
    }: {
      dayId: string;
      orderedItemIds: string[];
    }) => {
      const res = await fetch(`/api/trips/${tripId}/itinerary/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itineraryDayId: dayId, orderedItemIds }),
      });
      if (!res.ok) throw new Error("failed");
    },
    onSuccess: () => invalidate(),
    onError: () => toast.error("並び替えに失敗しました"),
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/trips/${tripId}/itinerary/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("failed");
    },
    onSuccess: () => invalidate(),
    onError: () => toast.error("削除に失敗しました"),
  });

  async function handlePlaceSelect(place: PlaceSelection) {
    if (!selectedDay) {
      toast.error("先に日程を追加してください");
      return;
    }
    const spot = await createSpot.mutateAsync(place);
    await addItem.mutateAsync({ dayId: selectedDay.id, spotId: spot.id });
  }

  async function handleConfirmCustomSpot() {
    if (!pendingLatLng || !selectedDay || !pendingName.trim()) return;
    const spot = await createSpot.mutateAsync({
      name: pendingName.trim(),
      lat: pendingLatLng.lat,
      lng: pendingLatLng.lng,
    });
    await addItem.mutateAsync({ dayId: selectedDay.id, spotId: spot.id });
    setPendingLatLng(null);
    setPendingName("");
    setClickToAdd(false);
  }

  async function handleAddressSelect(input: AddressSpotSelection) {
    if (!selectedDay) {
      toast.error("先に日程を追加してください");
      return;
    }
    const spot = await createSpot.mutateAsync(input);
    await addItem.mutateAsync({ dayId: selectedDay.id, spotId: spot.id });
  }

  const pins: MapPinType[] = useMemo(
    () =>
      (selectedDay?.items ?? []).map((item, index) => ({
        id: item.id,
        order: index,
        lat: item.spot.lat,
        lng: item.spot.lng,
        name: item.spot.name,
      })),
    [selectedDay],
  );

  const content = (
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-[380px] shrink-0 flex-col gap-4 overflow-y-auto border-r p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-lg font-semibold leading-tight">{data.name}</h1>
            {(data.startDate || data.endDate) && (
              <p className="text-xs text-zinc-500">
                {data.startDate ?? "?"} 〜 {data.endDate ?? "?"}
              </p>
            )}
          </div>
          {!readOnly && <InviteDialog tripId={tripId} />}
        </div>

        <div className="flex flex-wrap gap-2">
          {data.days.map((day, index) => (
            <Button
              key={day.id}
              size="sm"
              variant={day.id === selectedDay?.id ? "default" : "outline"}
              onClick={() => setSelectedDayId(day.id)}
            >
              {index + 1}日目
            </Button>
          ))}
          {!readOnly && (
            <Button size="sm" variant="ghost" onClick={() => createDay.mutate()}>
              <Plus className="h-4 w-4" />
              日程を追加
            </Button>
          )}
        </div>

        {!readOnly && selectedDay && (
          <div className="flex flex-col gap-2">
            <SpotSearch onSelect={handlePlaceSelect} />
            <Button
              type="button"
              variant={clickToAdd ? "default" : "outline"}
              size="sm"
              onClick={() => setClickToAdd((v) => !v)}
            >
              <MapPin className="h-4 w-4" />
              {clickToAdd ? "地図をクリックして追加中..." : "地図をクリックして独自スポットを追加"}
            </Button>
            <AddressSpotDialog onSelect={handleAddressSelect} />
          </div>
        )}

        {selectedDay ? (
          <DayColumn
            day={selectedDay}
            readOnly={readOnly}
            onReorder={(orderedItemIds) =>
              reorder.mutate({ dayId: selectedDay.id, orderedItemIds })
            }
            onRemoveItem={(itemId) => removeItem.mutate(itemId)}
          />
        ) : (
          <p className="text-sm text-zinc-500">まだ日程がありません。</p>
        )}
      </aside>

      <main className="relative flex-1">
        <TripMap
          pins={pins}
          onMapClick={
            clickToAdd ? (lat, lng) => setPendingLatLng({ lat, lng }) : undefined
          }
        />
      </main>

      <Dialog
        open={pendingLatLng !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingLatLng(null);
            setPendingName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>独自スポットを追加</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="custom-spot-name">スポット名</Label>
            <Input
              id="custom-spot-name"
              value={pendingName}
              onChange={(e) => setPendingName(e.target.value)}
              placeholder="例: 隠れた展望スポット"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleConfirmCustomSpot}
              disabled={!pendingName.trim() || createSpot.isPending}
            >
              追加する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (!googleMapsApiKey) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-900">
        Google Maps APIキーが設定されていません。
      </div>
    );
  }

  return <APIProvider apiKey={googleMapsApiKey}>{content}</APIProvider>;
}
