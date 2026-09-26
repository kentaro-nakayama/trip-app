"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { APIProvider } from "@vis.gl/react-google-maps";
import { toast } from "sonner";
import { ArrowLeft, List, Loader2, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, extractErrorMessage } from "@/lib/utils";
import { CustomSpotDialog, type AddressSpotSelection } from "@/components/trip/custom-spot-dialog";
import { MembersDialog } from "@/components/trip/members-dialog";
import { SpotSearch, type PlaceSelection } from "@/components/trip/spot-search";
import { TripMap, type MapPin as MapPinType } from "@/components/trip/trip-map";
import { SpotListItem } from "./spot-list-item";
import type { SpotListDetail } from "@/lib/types";

async function fetchSpotList(spotListId: string): Promise<SpotListDetail> {
  const res = await fetch(`/api/spot-lists/${spotListId}`);
  if (!res.ok) throw new Error("スポットリストの取得に失敗しました");
  return res.json();
}

export function SpotListWorkspace({
  spotListId,
  initial,
  googleMapsApiKey,
}: {
  spotListId: string;
  initial: SpotListDetail;
  googleMapsApiKey: string;
}) {
  const queryClient = useQueryClient();
  const queryKey = ["spot-list", spotListId];

  const { data } = useQuery({
    queryKey,
    queryFn: () => fetchSpotList(spotListId),
    initialData: initial,
  });

  const readOnly = data.myRole === "viewer";
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [clickToAdd, setClickToAdd] = useState(false);
  const [pendingLatLng, setPendingLatLng] = useState<{
    lat: number;
    lng: number;
    address: string | null;
  } | null>(null);
  const [pendingName, setPendingName] = useState("");
  const [pendingCustomNotes, setPendingCustomNotes] = useState("");
  const [pendingPlace, setPendingPlace] = useState<PlaceSelection | null>(null);
  const [pendingPlaceNotes, setPendingPlaceNotes] = useState("");

  function invalidate() {
    queryClient.invalidateQueries({ queryKey });
  }

  const createSpot = useMutation({
    mutationFn: async (input: {
      name: string;
      address?: string | null;
      lat: number;
      lng: number;
      googlePlaceId?: string;
      notes?: string;
    }) => {
      const res = await fetch(`/api/spot-lists/${spotListId}/spots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await extractErrorMessage(res, "スポットの追加に失敗しました"));
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast.success("スポットを追加しました");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "スポットの追加に失敗しました"),
  });

  const updateSpotNotes = useMutation({
    mutationFn: async ({ spotId, notes }: { spotId: string; notes: string }) => {
      const res = await fetch(`/api/spots/${spotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes || null }),
      });
      if (!res.ok) throw new Error(await extractErrorMessage(res, "メモの保存に失敗しました"));
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast.success("メモを保存しました");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "メモの保存に失敗しました"),
  });

  const removeSpot = useMutation({
    mutationFn: async (spotId: string) => {
      const res = await fetch(`/api/spots/${spotId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await extractErrorMessage(res, "削除に失敗しました"));
    },
    onSuccess: () => {
      invalidate();
      toast.success("削除しました");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "削除に失敗しました"),
  });

  function handlePlaceSelect(place: PlaceSelection) {
    setPendingPlace(place);
    setPendingPlaceNotes("");
  }

  async function handleConfirmPlace() {
    if (!pendingPlace) return;
    await createSpot.mutateAsync({
      ...pendingPlace,
      notes: pendingPlaceNotes.trim() || undefined,
    });
    setPendingPlace(null);
    setPendingPlaceNotes("");
  }

  async function handleConfirmCustomSpot() {
    if (!pendingLatLng || !pendingName.trim()) return;
    await createSpot.mutateAsync({
      name: pendingName.trim(),
      address: pendingLatLng.address ?? undefined,
      lat: pendingLatLng.lat,
      lng: pendingLatLng.lng,
      notes: pendingCustomNotes.trim() || undefined,
    });
    setPendingLatLng(null);
    setPendingName("");
    setPendingCustomNotes("");
    setClickToAdd(false);
  }

  async function handleAddressSelect(input: AddressSpotSelection) {
    await createSpot.mutateAsync(input);
  }

  const pins: MapPinType[] = useMemo(
    () =>
      data.spots.map((spot, index) => ({
        id: spot.id,
        order: index,
        lat: spot.lat,
        lng: spot.lng,
        name: spot.name,
      })),
    [data.spots],
  );

  const content = (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <div className="flex items-start justify-between gap-2 border-b p-4 md:hidden">
        <div className="flex items-start gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-1 h-8 w-8 shrink-0"
            nativeButton={false}
            render={<Link href="/spots" />}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold leading-tight">{data.name}</h1>
        </div>
        <MembersDialog
          resourceType="spot-lists"
          resourceId={spotListId}
          resourceLabel="スポットリスト"
          myRole={data.myRole}
        />
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-1 border-b p-2 md:hidden">
        <Button
          type="button"
          variant={mobileView === "list" ? "default" : "ghost"}
          size="sm"
          onClick={() => setMobileView("list")}
        >
          <List className="h-4 w-4" />
          リスト
        </Button>
        <Button
          type="button"
          variant={mobileView === "map" ? "default" : "ghost"}
          size="sm"
          onClick={() => setMobileView("map")}
        >
          <MapIcon className="h-4 w-4" />
          地図
        </Button>
      </div>

      <div className="relative flex min-h-0 flex-1 md:flex-row">
        <aside
          className={cn(
            "absolute inset-0 z-10 min-h-0 flex-col gap-4 overflow-y-auto bg-background p-4 md:static md:z-auto md:flex md:w-[380px] md:flex-none md:shrink-0 md:border-r",
            mobileView === "list" ? "flex" : "hidden",
          )}
        >
          <div className="hidden items-start justify-between gap-2 md:flex">
            <div className="flex items-start gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="-ml-1 h-8 w-8 shrink-0"
                nativeButton={false}
                render={<Link href="/spots" />}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-lg font-semibold leading-tight">{data.name}</h1>
            </div>
            <MembersDialog
              resourceType="spot-lists"
              resourceId={spotListId}
              resourceLabel="スポットリスト"
              myRole={data.myRole}
            />
          </div>

          {!readOnly && (
            <div className="flex flex-col gap-2">
              <SpotSearch onSelect={handlePlaceSelect} />
              <CustomSpotDialog
                hasPreviousItem={false}
                onChooseMapClick={() => {
                  setClickToAdd(true);
                  setMobileView("map");
                }}
                onAddressSelect={handleAddressSelect}
              />
              {clickToAdd && (
                <div className="flex items-center justify-between gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300">
                  <span>地図をクリックしてスポットを追加してください</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-indigo-700 hover:text-indigo-800 dark:text-indigo-300"
                    onClick={() => setClickToAdd(false)}
                  >
                    キャンセル
                  </Button>
                </div>
              )}
            </div>
          )}

          {data.spots.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-center text-sm text-zinc-500">
              まだスポットがありません。地図や検索から追加してください。
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.spots.map((spot, index) => (
                <SpotListItem
                  key={spot.id}
                  spot={spot}
                  order={index}
                  readOnly={readOnly}
                  onRemove={() => removeSpot.mutate(spot.id)}
                  onUpdateNotes={(notes) => updateSpotNotes.mutate({ spotId: spot.id, notes })}
                />
              ))}
            </ul>
          )}
        </aside>

        <main className="relative min-h-0 flex-1">
          <TripMap
            pins={pins}
            onMapClick={
              clickToAdd
                ? (lat, lng, address) => setPendingLatLng({ lat, lng, address })
                : undefined
            }
            onPoiClick={handlePlaceSelect}
            showRoute={false}
          />
        </main>
      </div>

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
            {pendingLatLng?.address && <DialogDescription>{pendingLatLng.address}</DialogDescription>}
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="custom-spot-name">スポット名</Label>
              <Input
                id="custom-spot-name"
                value={pendingName}
                onChange={(e) => setPendingName(e.target.value)}
                placeholder="例: 隠れた展望スポット"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="custom-spot-notes">メモ（任意）</Label>
              <Textarea
                id="custom-spot-notes"
                value={pendingCustomNotes}
                onChange={(e) => setPendingCustomNotes(e.target.value)}
                placeholder="このスポットについてのメモ"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleConfirmCustomSpot} disabled={!pendingName.trim() || createSpot.isPending}>
              {createSpot.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              追加する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingPlace !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingPlace(null);
            setPendingPlaceNotes("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pendingPlace?.name}</DialogTitle>
            {pendingPlace?.address && <DialogDescription>{pendingPlace.address}</DialogDescription>}
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="place-spot-notes">メモ（任意）</Label>
              <Textarea
                id="place-spot-notes"
                value={pendingPlaceNotes}
                onChange={(e) => setPendingPlaceNotes(e.target.value)}
                placeholder="このスポットについてのメモ"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleConfirmPlace} disabled={createSpot.isPending}>
              {createSpot.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
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
