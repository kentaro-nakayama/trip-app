"use client";

import { Bike, Car, Footprints, TrainFront } from "lucide-react";
import { cn } from "@/lib/utils";
import { TRAVEL_MODES, travelModeLabel, type TravelMode } from "@/lib/travel-mode";

const travelModeIcon: Record<TravelMode, typeof Car> = {
  walking: Footprints,
  driving: Car,
  transit: TrainFront,
  bicycling: Bike,
};

export function TravelModeSelect({
  value,
  onChange,
  label = "前のスポットからの移動手段",
}: {
  value: TravelMode;
  onChange: (mode: TravelMode) => void;
  label?: string;
}) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex gap-1.5">
        {TRAVEL_MODES.map((mode) => {
          const Icon = travelModeIcon[mode];
          const active = mode === value;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onChange(mode)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg border py-2 text-xs transition-colors",
                active
                  ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : "border-border text-zinc-500 hover:bg-muted",
              )}
            >
              <Icon className="h-4 w-4" />
              {travelModeLabel[mode]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
