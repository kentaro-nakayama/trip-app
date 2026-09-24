"use client";

import { useRef, useState } from "react";
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
import { extractErrorMessage } from "@/lib/utils";
import type { TripSummary } from "@/lib/types";

// Small travel-themed icons (plane / bus / suitcase) that burst out of the
// "新しい旅行を作成" button on click, purely decorative.
const TRAVEL_SVGS = [
  '<svg viewBox="0 0 512 512" fill="currentColor"><path d="M480 192H365.71L260.61 8.88A16 16 0 0 0 248 0h-40a16 16 0 0 0-13.43 24.69L262.24 192H112l-38.34-51.13A16 16 0 0 0 60.86 134H20a16 16 0 0 0-14.73 22.28L43.89 256 5.27 355.72A16 16 0 0 0 20 378h40.86a16 16 0 0 0 12.8-6.87L112 320h150.24l-67.67 167.31A16 16 0 0 0 208 512h40a16 16 0 0 0 12.61-8.88L365.71 320H480a32 32 0 0 0 0-64z"/></svg>',
  '<svg viewBox="0 0 512 512" fill="currentColor"><path d="M499.99 176h-59.51l-43.1-96.97C388.92 60.05 370.4 48 349.52 48H162.48c-20.88 0-39.4 12.05-47.86 31.03L71.52 176H12.01C5.38 176 0 181.38 0 188.01v68c0 6.63 5.38 12 12.01 12h20.67l7.63 118.25c.98 15.22 13.62 27.75 28.87 27.75h36.65c15.25 0 27.89-12.53 28.87-27.75L142.17 268h227.66l7.47 118.25c.98 15.22 13.62 27.75 28.87 27.75h36.65c15.25 0 27.89-12.53 28.87-27.75L479.32 268h20.67c6.63 0 12.01-5.37 12.01-12v-68c0-6.63-5.38-12.01-12.01-12.01zM112 224c-13.25 0-24-10.75-24-24s10.75-24 24-24 24 10.75 24 24-10.75 24-24 24zm288 0c-13.25 0-24-10.75-24-24s10.75-24 24-24 24 10.75 24 24-10.75 24-24 24z"/></svg>',
  '<svg viewBox="0 0 512 512" fill="currentColor"><path d="M128 96V64c0-17.7 14.3-32 32-32h192c17.7 0 32 14.3 32 32v32h48c26.5 0 48 21.5 48 48v288c0 26.5-21.5 48-48 48H80c-26.5 0-48-21.5-48-48V144c0-26.5 21.5-48 48-48h48zm64-32v32h128V64H192zm-80 384h300V144H112v304z"/></svg>',
];
const PARTICLE_COLORS = ["rgb(78, 71, 221)", "#6366f1", "#818cf8", "#a5b4fc", "#4338ca"];

function burstTravelParticles(stage: HTMLElement, btn: HTMLElement, layer: HTMLElement) {
  const stageRect = stage.getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();
  const centerX = btnRect.left + btnRect.width / 2 - stageRect.left;
  const centerY = btnRect.top + btnRect.height / 2 - stageRect.top;

  const count = 6;
  const maxDist = 130;
  const speed = 0.4;

  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.style.position = "absolute";
    p.style.pointerEvents = "none";
    p.style.width = "30px";
    p.style.height = "30px";
    p.style.color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
    p.innerHTML = TRAVEL_SVGS[Math.floor(Math.random() * TRAVEL_SVGS.length)];
    layer.appendChild(p);

    const angle = Math.random() * Math.PI * 2;
    const dist = maxDist * 0.7 + Math.random() * maxDist * 0.5;
    const duration = 1200 / speed + Math.random() * 500;
    const startX = centerX - 15;
    const startY = centerY - 15;
    const targetX = startX + Math.cos(angle) * dist;
    const targetY = startY + Math.sin(angle) * dist;

    p.animate(
      [
        { transform: `translate(${startX}px, ${startY}px) scale(0.1) rotate(0deg)`, opacity: 1 },
        {
          transform: `translate(${targetX}px, ${targetY}px) scale(0.9) rotate(${(Math.random() - 0.5) * 320}deg)`,
          opacity: 0,
        },
      ],
      { duration, easing: "cubic-bezier(0.1, 0.82, 0.25, 1)" },
    ).onfinish = () => p.remove();
  }
}

export function CreateTripDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const queryClient = useQueryClient();
  const router = useRouter();

  const stageRef = useRef<HTMLDivElement>(null);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const particleLayerRef = useRef<HTMLDivElement>(null);

  function handleTriggerClick() {
    const btn = triggerBtnRef.current;
    const stage = stageRef.current;
    const layer = particleLayerRef.current;
    if (!btn || !stage || !layer) return;

    btn.classList.remove("is-elastic");
    // Force a reflow so the animation can be re-triggered on rapid clicks.
    void btn.offsetWidth;
    btn.classList.add("is-elastic");

    burstTravelParticles(stage, btn, layer);
  }

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
    <div ref={stageRef} className="relative inline-flex">
      <div ref={particleLayerRef} className="pointer-events-none absolute inset-0 z-50" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button
              ref={triggerBtnRef}
              onClick={handleTriggerClick}
              className="rounded-full bg-[rgb(78,71,221)] px-[22px] py-[10px] text-sm font-bold text-white shadow-[0_4px_12px_rgba(78,71,221,0.25)] transition-[background-color,box-shadow,transform] duration-150 hover:bg-[rgb(66,60,195)] hover:shadow-[0_6px_16px_rgba(78,71,221,0.35)] active:scale-[0.96]"
            />
          }
        >
          新しい旅行を作成
        </DialogTrigger>
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
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              作成する
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      </Dialog>
    </div>
  );
}
