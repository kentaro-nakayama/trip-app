"use client";

import { useRef, useState, type ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Wraps a UI element with a one-time speech-bubble hint for first-time users.
 * The hint disappears for good once dismissed (via its close button, or by the
 * user actually interacting with the wrapped element) — persisted per-user via
 * Clerk publicMetadata.seenHints, so it never shows again on any device.
 */
export function HintBubble({
  id,
  message,
  children,
  className,
  align = "center",
}: {
  id: string;
  message: string;
  children: ReactNode;
  className?: string;
  align?: "center" | "end";
}) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [dismissedLocally, setDismissedLocally] = useState(false);
  const hasDismissedRef = useRef(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/me/hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hintId: id }),
      });
      if (res.ok) await user?.reload();
    },
  });

  function dismiss() {
    if (hasDismissedRef.current) return;
    hasDismissedRef.current = true;
    setDismissedLocally(true);
    mutation.mutate();
  }

  const alreadySeen = user?.publicMetadata.seenHints?.includes(id) ?? false;
  const shouldShow = isLoaded && isSignedIn && !alreadySeen && !dismissedLocally;

  return (
    <div
      className={cn("relative", className)}
      onClickCapture={shouldShow ? dismiss : undefined}
    >
      {children}
      {shouldShow && (
        <div
          role="tooltip"
          className={cn(
            "absolute top-full z-40 mt-2 w-56 animate-in fade-in-0 zoom-in-95 rounded-xl bg-[rgb(78,71,221)] px-3 py-2.5 text-xs leading-relaxed text-white shadow-lg",
            align === "center" ? "left-1/2 -translate-x-1/2" : "right-0",
          )}
        >
          <div
            className={cn(
              "absolute -top-1.5 h-3 w-3 rotate-45 bg-[rgb(78,71,221)]",
              align === "center" ? "left-1/2 -translate-x-1/2" : "right-4",
            )}
          />
          <div className="flex items-start gap-2">
            <p className="flex-1">{message}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismiss();
              }}
              className="shrink-0 text-white/80 transition-colors hover:text-white"
              aria-label="ヒントを閉じる"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
