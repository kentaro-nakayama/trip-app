import { CompassLoader } from "@/components/ui/compass-loader";

function SkeletonTripCard() {
  return (
    <div className="shimmer-effect flex flex-col gap-3 overflow-hidden rounded-xl border border-zinc-100 bg-white p-4 ring-1 ring-foreground/10">
      <div className="h-4 w-2/5 rounded-md bg-zinc-200/80" />
      <div className="h-3 w-3/5 rounded-md bg-zinc-200/60" />
      <div className="h-3 w-2/5 rounded-md bg-zinc-200/50" />
      <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-3">
        <div className="h-6 w-6 rounded-full bg-zinc-200/70" />
        <div className="h-3 w-14 rounded-md bg-zinc-200/50" />
      </div>
    </div>
  );
}

export default function TripsLoading() {
  return (
    <div className="relative flex flex-1 flex-col bg-gradient-to-b from-indigo-50/70 via-white to-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle,rgba(0,0,0,0.05)_1px,transparent_1px)] [background-size:22px_22px]"
      />
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">旅行一覧</h1>

        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-200 bg-white/60 px-6 py-16">
          <CompassLoader />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <SkeletonTripCard />
          <SkeletonTripCard />
        </div>
      </div>
    </div>
  );
}
