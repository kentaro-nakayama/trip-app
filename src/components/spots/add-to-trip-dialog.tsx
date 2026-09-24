"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { extractErrorMessage } from "@/lib/utils";
import type { ItineraryDay, TripDetail, TripSummary } from "@/lib/types";

const dayLabelFormatter = new Intl.DateTimeFormat("ja-JP", {
  month: "numeric",
  day: "numeric",
  weekday: "short",
});

function formatDayLabel(day: Pick<ItineraryDay, "date">, index: number): string {
  if (!day.date) return `${index + 1}日目`;
  return dayLabelFormatter.format(new Date(`${day.date}T00:00:00`));
}

export function AddToTripDialog({ spotId, spotName }: { spotId: string; spotName: string }) {
  const [open, setOpen] = useState(false);
  const [tripId, setTripId] = useState<string | null>(null);
  const [dayId, setDayId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const tripsQuery = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const res = await fetch("/api/trips");
      if (!res.ok) throw new Error("旅行一覧の取得に失敗しました");
      return (await res.json()) as TripSummary[];
    },
    enabled: open,
  });

  const editableTrips = useMemo(
    () => (tripsQuery.data ?? []).filter((trip) => trip.myRole !== "viewer"),
    [tripsQuery.data],
  );

  const tripDetailQuery = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}`);
      if (!res.ok) throw new Error("旅行の取得に失敗しました");
      return (await res.json()) as TripDetail;
    },
    enabled: open && !!tripId,
  });

  const days = tripDetailQuery.data?.days ?? [];

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!tripId || !dayId) return;
      const res = await fetch(`/api/spots/${spotId}/add-to-trip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, itineraryDayId: dayId }),
      });
      if (!res.ok) throw new Error(await extractErrorMessage(res, "行程への追加に失敗しました"));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      setOpen(false);
      setTripId(null);
      setDayId(null);
      toast.success(`「${spotName}」を行程に追加しました`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "行程への追加に失敗しました"),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setTripId(null);
          setDayId(null);
        }
      }}
    >
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        <CalendarPlus className="h-4 w-4" />
        旅行に追加する
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>「{spotName}」を旅行に追加</DialogTitle>
          <DialogDescription>追加する旅行と日を選んでください。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>旅行</Label>
            {!tripsQuery.isLoading && editableTrips.length === 0 ? (
              <p className="text-sm text-zinc-500">編集できる旅行がありません</p>
            ) : (
              <Select
                value={tripId}
                onValueChange={(v) => {
                  setTripId(v);
                  setDayId(null);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string | null) =>
                      value
                        ? (editableTrips.find((trip) => trip.id === value)?.name ?? "")
                        : tripsQuery.isLoading
                          ? "読み込み中..."
                          : "旅行を選択"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {editableTrips.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id}>
                      {trip.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {tripId && (
            <div className="grid gap-2">
              <Label>日程</Label>
              {!tripDetailQuery.isLoading && days.length === 0 ? (
                <p className="text-sm text-zinc-500">この旅行にはまだ日程がありません</p>
              ) : (
                <Select value={dayId} onValueChange={setDayId}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value: string | null) => {
                        if (!value) return tripDetailQuery.isLoading ? "読み込み中..." : "日を選択";
                        const index = days.findIndex((day) => day.id === value);
                        return index >= 0 ? formatDayLabel(days[index], index) : "";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((day, index) => (
                      <SelectItem key={day.id} value={day.id}>
                        {formatDayLabel(day, index)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            disabled={!tripId || !dayId || addMutation.isPending}
            onClick={() => addMutation.mutate()}
          >
            {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            追加する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
