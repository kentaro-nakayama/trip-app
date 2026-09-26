"use client";

import { useTransition, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ListViewToggle } from "./list-view-toggle";
import { UserMenu } from "@/components/profile/user-menu";
import { CompassLoader } from "@/components/ui/compass-loader";

const LIST_PATHS = new Set(["/trips", "/spots"]);

// Renders the shared chrome (background, tab toggle, user menu) around
// `/trips` and `/spots` specifically. Lives in the root layout — which never
// unmounts on client-side navigation — rather than a route-group layout, so
// switching between the two tabs never tears down and rebuilds this shell:
// only the page content underneath re-renders. (A route-group layout can't
// be used here instead, since it would also have to wrap /trips/[tripId] and
// /spots/[spotListId], which need their own full-bleed map UI.)
//
// The tab switch itself is driven by router.push() wrapped in a transition
// (rather than a plain <Link>) so this component can observe isPending and
// overlay a compass spinner over the content area while the destination
// page's data loads — without that pending state ever touching this shared
// header, which keeps rendering the old page underneath until the new one
// is ready.
export function ListsChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!LIST_PATHS.has(pathname)) return <>{children}</>;

  function navigate(href: string) {
    if (href === pathname || isPending) return;
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <div className="relative flex flex-1 flex-col bg-gradient-to-b from-indigo-50/70 via-white to-white dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle,rgba(0,0,0,0.05)_1px,transparent_1px)] [background-size:22px_22px] dark:[background-image:radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)]"
      />
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12 sm:py-14">
        <div className="flex items-center justify-between gap-4">
          <ListViewToggle pathname={pathname} pending={isPending} onNavigate={navigate} />
          <UserMenu />
        </div>
        <div className="relative flex flex-1 flex-col gap-8">
          {children}
          {isPending && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-background/70 backdrop-blur-sm">
              <CompassLoader />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
