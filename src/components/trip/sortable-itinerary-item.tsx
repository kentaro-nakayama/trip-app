"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ItineraryItem } from "@/lib/types";

export function SortableItineraryItem({
  item,
  order,
  readOnly,
  onRemove,
}: {
  item: ItineraryItem;
  order: number;
  readOnly: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled: readOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border bg-white p-2 dark:bg-zinc-900"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
        {order + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.spot.name}</p>
        {item.spot.address && (
          <p className="truncate text-xs text-zinc-500">{item.spot.address}</p>
        )}
      </div>
      {!readOnly && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 cursor-grab touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      )}
    </li>
  );
}
