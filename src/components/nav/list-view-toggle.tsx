"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/trips", label: "旅行一覧" },
  { href: "/spots", label: "スポット一覧" },
] as const;

export function ListViewToggle() {
  const pathname = usePathname();

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white/60 p-1 shadow-[0_1px_2px_rgba(24,24,27,0.06),0_4px_10px_rgba(24,24,27,0.07)] dark:border-zinc-700 dark:bg-zinc-900/40">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-[rgb(76,71,205)] text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
