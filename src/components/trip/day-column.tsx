"use client";

import { Fragment, type ReactNode } from "react";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { HintBubble } from "@/components/onboarding/hint-bubble";
import { SortableItineraryItem } from "./sortable-itinerary-item";
import { TravelConnector } from "./travel-connector";
import type { ItineraryDay } from "@/lib/types";
import type { TravelMode } from "@/lib/travel-mode";

export function DayColumn({
  day,
  readOnly,
  onReorder,
  onRemoveItem,
  onUpdateSpotNotes,
  onUpdateSchedule,
  onUpdateTravelMode,
}: {
  day: ItineraryDay;
  readOnly: boolean;
  onReorder: (orderedItemIds: string[]) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateSpotNotes: (spotId: string, notes: string) => void;
  onUpdateSchedule: (
    itemId: string,
    schedule: { startTime: string | null; durationMinutes: number | null },
  ) => void;
  onUpdateTravelMode: (itemId: string, travelMode: TravelMode) => void;
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = day.items.findIndex((i) => i.id === active.id);
    const newIndex = day.items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(day.items, oldIndex, newIndex);
    onReorder(reordered.map((i) => i.id));
  }

  if (day.items.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-4 text-center text-sm text-zinc-500">
        まだスポットがありません。地図や検索から追加してください。
      </p>
    );
  }

  return (
    <DndContext
      id={`day-${day.id}`}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={day.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <HintBubbleIfReorderable enabled={!readOnly && day.items.length > 1}>
          <ul className="flex flex-col gap-2">
            {day.items.map((item, index) => (
              <Fragment key={item.id}>
                {index > 0 && (
                  <TravelConnector
                    origin={day.items[index - 1].spot}
                    destination={item.spot}
                    travelMode={item.travelMode}
                    onChangeMode={(mode) => onUpdateTravelMode(item.id, mode)}
                    readOnly={readOnly}
                  />
                )}
                <SortableItineraryItem
                  item={item}
                  order={index}
                  previousItem={index > 0 ? day.items[index - 1] : null}
                  nextItem={index < day.items.length - 1 ? day.items[index + 1] : null}
                  readOnly={readOnly}
                  onRemove={() => onRemoveItem(item.id)}
                  onUpdateNotes={(notes) => onUpdateSpotNotes(item.spotId, notes)}
                  onUpdateSchedule={(schedule) => onUpdateSchedule(item.id, schedule)}
                />
              </Fragment>
            ))}
          </ul>
        </HintBubbleIfReorderable>
      </SortableContext>
    </DndContext>
  );
}

// Only wraps with the drag-to-reorder hint when there's actually more than
// one item to reorder and the viewer can drag; otherwise renders children
// as-is so the hint never shows for a single-item (nothing to reorder) or
// read-only day.
function HintBubbleIfReorderable({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  if (!enabled) return <>{children}</>;
  return (
    <HintBubble id="reorder-drag" message="カードをドラッグすると、行程の順番を並び替えられます。">
      {children}
    </HintBubble>
  );
}
