import { CompassLoader } from "@/components/ui/compass-loader";

export default function TripDetailLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <aside className="flex min-h-0 flex-none flex-col gap-4 border-b bg-background p-4 md:w-[380px] md:border-b-0 md:border-r">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 shrink-0 rounded-md bg-zinc-100" />
          <div className="h-4 w-32 rounded-md bg-zinc-100" />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <CompassLoader />
        </div>
      </aside>
      <main className="relative min-h-[240px] flex-1 bg-zinc-100 md:min-h-0" />
    </div>
  );
}
