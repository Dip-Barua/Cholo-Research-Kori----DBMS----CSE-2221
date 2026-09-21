"use client"

import { cn } from "cn"

function Progress({ className, value = 0, ...props }) {
  return (
    <div
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-slate-200",
        className
      )}
      {...props}
    >
      <div
        className="h-full rounded-full bg-[color:var(--primary-accent)] transition-[width]"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

export { Progress }
