"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, Copy, GripVertical, StickyNote, X } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { addMinutesToTime, formatDuration } from "@/lib/itinerary-time";
import type { ItineraryItem } from "@/lib/types";

export function SortableItineraryItem({
  item,
  order,
  readOnly,
  onRemove,
  onUpdateNotes,
  onUpdateSchedule,
}: {
  item: ItineraryItem;
  order: number;
  readOnly: boolean;
  onRemove: () => void;
  onUpdateNotes: (notes: string) => void;
  onUpdateSchedule: (schedule: { startTime: string | null; durationMinutes: number | null }) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled: readOnly });

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(item.spot.notes ?? "");
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [startTimeDraft, setStartTimeDraft] = useState(item.startTime ?? "");
  const [durationDraft, setDurationDraft] = useState(
    item.durationMinutes != null ? String(item.durationMinutes) : "",
  );
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function startEditing() {
    setNotesDraft(item.spot.notes ?? "");
    setIsEditingNotes(true);
  }

  function saveNotes() {
    onUpdateNotes(notesDraft.trim());
    setIsEditingNotes(false);
  }

  function startEditingSchedule() {
    setStartTimeDraft(item.startTime ?? "");
    setDurationDraft(item.durationMinutes != null ? String(item.durationMinutes) : "");
    setIsEditingSchedule(true);
  }

  function saveSchedule() {
    const durationMinutes = durationDraft.trim() ? Number(durationDraft) : null;
    onUpdateSchedule({
      startTime: startTimeDraft.trim() || null,
      durationMinutes: durationMinutes != null && !Number.isNaN(durationMinutes) ? durationMinutes : null,
    });
    setIsEditingSchedule(false);
  }

  function scheduleLabel(): string | null {
    if (item.startTime && item.durationMinutes != null) {
      const end = addMinutesToTime(item.startTime, item.durationMinutes);
      return `${item.startTime} 〜 ${end}（${formatDuration(item.durationMinutes)}）`;
    }
    if (item.startTime) return `${item.startTime} 〜`;
    if (item.durationMinutes != null) return `（${formatDuration(item.durationMinutes)}）`;
    return null;
  }

  async function copyAddress() {
    if (!item.spot.address) return;
    try {
      await navigator.clipboard.writeText(item.spot.address);
      toast.success("住所をコピーしました");
    } catch {
      toast.error("コピーに失敗しました");
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col gap-2 rounded-xl border bg-white p-2 transition-all duration-150 hover:-translate-y-1 hover:shadow-lg dark:bg-zinc-900",
        !readOnly && "cursor-grab active:cursor-grabbing",
      )}
      {...(!readOnly ? attributes : {})}
      {...(!readOnly ? listeners : {})}
    >
      <div className="flex items-start gap-2">
        {!readOnly && (
          <GripVertical className="mt-1.5 h-4 w-4 shrink-0 text-zinc-300 dark:text-zinc-600" />
        )}
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
          {order + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.spot.name}</p>
          {!isEditingSchedule && scheduleLabel() && (
            <p className="text-[11px] font-medium text-blue-700 dark:text-blue-400">
              {scheduleLabel()}
            </p>
          )}
          {item.spot.address && (
            <button
              type="button"
              onClick={copyAddress}
              onPointerDown={(e) => e.stopPropagation()}
              title="タップして住所をコピー"
              className="block w-full text-left text-[11px] leading-snug break-words text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              {item.spot.address}
              <Copy className="ml-1 inline h-2.5 w-2.5 align-text-bottom" />
            </button>
          )}
        </div>
        {!readOnly && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "mt-0.5 h-7 w-7 shrink-0",
                (item.startTime || item.durationMinutes != null) &&
                  "text-blue-600 dark:text-blue-400",
              )}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() =>
                isEditingSchedule ? setIsEditingSchedule(false) : startEditingSchedule()
              }
            >
              <Clock className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "mt-0.5 h-7 w-7 shrink-0",
                item.spot.notes && "text-blue-600 dark:text-blue-400",
              )}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => (isEditingNotes ? setIsEditingNotes(false) : startEditing())}
            >
              <StickyNote className="h-4 w-4" />
            </Button>
            <AlertDialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
              <AlertDialogTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-0.5 h-7 w-7 shrink-0"
                    onPointerDown={(e) => e.stopPropagation()}
                  />
                }
              >
                <X className="h-4 w-4" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>「{item.spot.name}」を削除しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    行程からこのスポットを削除します。この操作は取り消せません。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onRemove();
                      setConfirmRemoveOpen(false);
                    }}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    削除する
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>

      {isEditingSchedule && (
        <div className="flex flex-col gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor={`schedule-start-${item.id}`} className="text-xs">
                開始時刻
              </Label>
              <Input
                id={`schedule-start-${item.id}`}
                type="time"
                value={startTimeDraft}
                onChange={(e) => setStartTimeDraft(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor={`schedule-duration-${item.id}`} className="text-xs">
                所要時間（分）
              </Label>
              <Input
                id={`schedule-duration-${item.id}`}
                type="number"
                min={0}
                step={5}
                value={durationDraft}
                onChange={(e) => setDurationDraft(e.target.value)}
                placeholder="例: 60"
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingSchedule(false)}
            >
              キャンセル
            </Button>
            <Button type="button" size="sm" onClick={saveSchedule}>
              保存
            </Button>
          </div>
        </div>
      )}

      {!isEditingNotes && item.spot.notes && (
        <button
          type="button"
          onClick={() => !readOnly && startEditing()}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            "rounded-md bg-zinc-50 px-2 py-1.5 text-left text-xs whitespace-pre-wrap text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
            !readOnly && "cursor-text hover:bg-zinc-100 dark:hover:bg-zinc-700",
          )}
        >
          {item.spot.notes}
        </button>
      )}

      {isEditingNotes && (
        <div className="flex flex-col gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
          <Textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            placeholder="このスポットについてのメモ"
            className="min-h-16 text-xs"
            autoFocus
          />
          <div className="flex justify-end gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingNotes(false)}
            >
              キャンセル
            </Button>
            <Button type="button" size="sm" onClick={saveNotes}>
              保存
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
