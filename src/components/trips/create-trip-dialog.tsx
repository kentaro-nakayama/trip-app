"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ParticleBurstButton } from "@/components/ui/particle-burst-button";
import { extractErrorMessage } from "@/lib/utils";
import type { TripSummary } from "@/lib/types";

export function CreateTripDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      });
      if (!res.ok) throw new Error(await extractErrorMessage(res, "旅行の作成に失敗しました"));
      return (await res.json()) as TripSummary;
    },
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      setOpen(false);
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      toast.success("旅行を作成しました");
      router.push(`/trips/${trip.id}`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "旅行の作成に失敗しました"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>新しい旅行を作成</DialogTrigger>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>新しい旅行を作成</DialogTitle>
            <DialogDescription>
              名前と期間を入力してください。行程やスポットは後から追加できます。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="trip-name">旅行名</Label>
              <Input
                id="trip-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 台湾旅行"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="trip-description">メモ</Label>
              <Textarea
                id="trip-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="任意"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="trip-start">開始日</Label>
                <Input
                  id="trip-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="trip-end">終了日</Label>
                <Input
                  id="trip-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <ParticleBurstButton type="submit" disabled={isPending || !name.trim()}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              作成する
            </ParticleBurstButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
