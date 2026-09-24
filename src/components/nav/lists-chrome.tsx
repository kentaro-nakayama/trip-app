"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ListViewToggle } from "./list-view-toggle";
import { UserMenu } from "@/components/profile/user-menu";

const LIST_PATHS = new Set(["/trips", "/spots"]);

// Renders the shared chrome (background, tab toggle, user menu) around
// `/trips` and `/spots` specifically. Lives in the root layout — which never
// unmounts on client-side navigation — rather than a route-group layout, so
// switching between the two tabs never tears down and rebuilds this shell:
// only the page content underneath re-renders. (A route-group layout can't
// be used here instead, since it would also have to wrap /trips/[tripId] and
// /spots/[spotListId], which need their own full-bleed map UI.)
export function ListsChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (!LIST_PATHS.has(pathname)) return <>{children}</>;

  return (
    <div className="relative flex flex-1 flex-col bg-[url('/lists-background.jpeg')] bg-cover bg-center bg-no-repeat">
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12 sm:py-14">
        <div className="flex items-center justify-between gap-4">
          <ListViewToggle />
          <UserMenu />
        </div>
        {children}
      </div>
    </div>
  );
}
