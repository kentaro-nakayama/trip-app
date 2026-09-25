import { cn } from "@/lib/utils";

export function CompassLoader({
  label = "読み込み中...",
  className,
}: {
  label?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative flex h-20 w-20 items-center justify-center">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 80 80" width="80" height="80">
          <circle
            className="pulse-ring-stroke"
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="rgb(76, 71, 205)"
            strokeWidth="2"
          />
          <circle cx="40" cy="40" r="29" fill="none" stroke="#cbd5e1" strokeWidth="2" />
          <line x1="40" y1="13" x2="40" y2="17" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
          <line x1="40" y1="63" x2="40" y2="67" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
          <line x1="13" y1="40" x2="17" y2="40" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
          <line x1="63" y1="40" x2="67" y2="40" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
          <text
            x="40"
            y="25"
            fontSize="7.5"
            fontWeight="800"
            fill="rgb(76, 71, 205)"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            N
          </text>
        </svg>
        <div className="compass-needle absolute inset-0 flex h-full w-full items-center justify-center">
          <svg className="h-full w-full" viewBox="0 0 80 80" width="80" height="80">
            <polygon points="40,20 44,40 40,37" fill="rgb(76, 71, 205)" />
            <polygon points="40,20 36,40 40,37" fill="rgb(99, 92, 241)" />
            <polygon points="40,60 44,40 40,43" fill="#cbd5e1" />
            <polygon points="40,60 36,40 40,43" fill="#94a3b8" />
          </svg>
        </div>
        <div className="absolute h-3.5 w-3.5 rounded-full border-2 border-[rgb(76,71,205)] bg-white shadow-sm" />
      </div>
      {label && <p className="text-xs font-medium tracking-wide text-zinc-500">{label}</p>}
    </div>
  );
}
