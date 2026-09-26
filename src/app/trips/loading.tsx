import { CompassLoader } from "@/components/ui/compass-loader";

export default function TripsLoading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <CompassLoader />
    </div>
  );
}
