"use client";

import { useEffect, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { addMinutesToTime, minutesBetween } from "@/lib/itinerary-time";
import { fetchTravelDurationMinutes, travelModeLabel, type TravelMode } from "@/lib/travel-mode";
import type { ItineraryItem } from "@/lib/types";

export function ScheduleConfirmDialog({
  open,
  previousItem,
  destination,
  travelMode,
  isPending,
  onConfirm,
}: {
  open: boolean;
  previousItem: ItineraryItem | null;
  destination: { lat: number; lng: number } | null;
  travelMode: TravelMode | null;
  isPending: boolean;
  onConfirm: (startTime: string | null) => void;
}) {
  const routesLib = useMapsLibrary("routes");
  const [travelMinutes, setTravelMinutes] = useState<number | null>(null);
  const [manualStartTime, setManualStartTime] = useState<string | null>(null);
  const [confirmEarlyOpen, setConfirmEarlyOpen] = useState(false);

  // Reset per-spot state during render (not in the effect below) so a stale
  // duration/time from the previous spot never leaks into the new one.
  const openKey =
    open && destination ? `${destination.lat},${destination.lng}:${travelMode ?? ""}` : null;
  const [trackedOpenKey, setTrackedOpenKey] = useState(openKey);
  if (openKey !== trackedOpenKey) {
    setTrackedOpenKey(openKey);
    setTravelMinutes(null);
    setManualStartTime(null);
  }

  useEffect(() => {
    if (!open || !routesLib || !destination || !travelMode || !previousItem) return;
    let cancelled = false;
    fetchTravelDurationMinutes(routesLib, previousItem.spot, destination, travelMode).then(
      (minutes) => {
        if (!cancelled) setTravelMinutes(minutes);
      },
    );
    return () => {
      cancelled = true;
    };
    // Deliberately depend on primitives (not the origin/destination object
    // identities, which are recreated every render) to avoid refetching on
    // every render; openKey already resets state when any of these change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    routesLib,
    destination?.lat,
    destination?.lng,
    travelMode,
    previousItem?.id,
    previousItem?.spot.lat,
    previousItem?.spot.lng,
  ]);

  const prevStart = previousItem?.startTime ?? null;
  const prevDuration = previousItem?.durationMinutes ?? 0;
  const suggested =
    prevStart != null && travelMinutes != null
      ? addMinutesToTime(prevStart, prevDuration + travelMinutes)
      : null;

  const startTime = manualStartTime ?? suggested ?? "";

  function handleConfirmClick() {
    const finalTime = startTime.trim() || null;
    if (finalTime && prevStart != null && travelMinutes != null) {
      const minFeasible = prevDuration + travelMinutes;
      const actualGap = minutesBetween(prevStart, finalTime);
      if (actualGap < minFeasible) {
        setConfirmEarlyOpen(true);
        return;
      }
    }
    onConfirm(finalTime);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={() => {}} disablePointerDismissal>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>滞在開始時刻</DialogTitle>
            <DialogDescription>
              {!travelMode
                ? "任意で開始時刻を設定できます。"
                : travelMinutes != null
                  ? `前のスポットから${travelModeLabel[travelMode]}で約${travelMinutes}分`
                  : "移動時間を計算中..."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="pending-schedule-start">開始時刻（任意）</Label>
            <Input
              id="pending-schedule-start"
              type="time"
              value={startTime}
              onChange={(e) => setManualStartTime(e.target.value)}
              autoFocus
            />
            {suggested && manualStartTime === null && (
              <p className="text-xs text-zinc-500">
                前のスポットの滞在終了時刻と移動時間から{suggested}を提案しています
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleConfirmClick} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              追加する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmEarlyOpen} onOpenChange={setConfirmEarlyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>開始時刻が早すぎる可能性があります</AlertDialogTitle>
            <AlertDialogDescription>
              前のスポットの滞在終了時刻と移動時間を考慮すると、現実的に厳しい時刻です
              {suggested && `（${suggested}以降が目安です）`}。このまま{startTime}
              で追加しますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>修正する</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmEarlyOpen(false);
                onConfirm(startTime.trim() || null);
              }}
            >
              このまま追加する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
