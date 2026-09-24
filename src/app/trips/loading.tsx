import { CompassLoader } from "@/components/ui/compass-loader";

export default function TripsLoading() {
  return (
    <div className="relative flex flex-1 flex-col bg-gradient-to-b from-indigo-50/70 via-white to-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle,rgba(0,0,0,0.05)_1px,transparent_1px)] [background-size:22px_22px]"
      />
      <div className="relative flex flex-1 items-center justify-center">
        <CompassLoader />
      </div>
    </div>
  );
}
