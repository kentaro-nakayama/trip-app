"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowUpDown, Copy, StickyNote, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ItineraryItem } from "@/lib/types";

export function SortableItineraryItem({
  item,
  order,
  readOnly,
  onRemove,
  onUpdateNotes,
}: {
  item: ItineraryItem;
  order: number;
  readOnly: boolean;
  onRemove: () => void;
  onUpdateNotes: (notes: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled: readOnly });

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(item.spot.notes ?? "");
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
      className="flex flex-col gap-2 rounded-md border bg-white p-2 dark:bg-zinc-900"
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
          {order + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.spot.name}</p>
          {item.spot.address && (
            <button
              type="button"
              onClick={copyAddress}
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
                item.spot.notes && "text-blue-600 dark:text-blue-400",
              )}
              onClick={() => (isEditingNotes ? setIsEditingNotes(false) : startEditing())}
            >
              <StickyNote className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-0.5 h-7 w-7 shrink-0 cursor-grab touch-none"
              {...attributes}
              {...listeners}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
            <AlertDialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
              <AlertDialogTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-0.5 h-7 w-7 shrink-0"
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

      {!isEditingNotes && item.spot.notes && (
        <button
          type="button"
          onClick={() => !readOnly && startEditing()}
          className={cn(
            "rounded-md bg-zinc-50 px-2 py-1.5 text-left text-xs whitespace-pre-wrap text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
            !readOnly && "cursor-text hover:bg-zinc-100 dark:hover:bg-zinc-700",
          )}
        >
          {item.spot.notes}
        </button>
      )}

      {isEditingNotes && (
        <div className="flex flex-col gap-1.5">
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
