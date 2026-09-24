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
    <div className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white/60 p-1 dark:border-zinc-700 dark:bg-zinc-900/40">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-[rgb(78,71,221)] text-white shadow-sm"
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
