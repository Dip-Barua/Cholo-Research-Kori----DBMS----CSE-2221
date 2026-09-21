"use client"

import * as Icons from "lucide-react"
import { quickActions } from "./mockData"

export default function QuickActions() {
  return (
    <section id="quick-actions" className="rounded-[1.25rem] border border-[color:var(--border-color)] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <h2 className="text-lg font-semibold tracking-tight text-[color:var(--text-primary)]">Quick Actions</h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {quickActions.map((action, index) => {
          const Icon = Icons[action.icon]
          const isPrimary = index === 0

          return (
            <button
              key={action.label}
              type="button"
              className={`inline-flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${isPrimary ? "border-[color:var(--primary-dark)] bg-[color:var(--primary-dark)] text-white hover:bg-[color:color-mix(in_srgb,var(--primary-dark)_88%,black)]" : "border-[color:var(--border-color)] bg-[color:rgba(255,255,255,0.9)] text-[color:var(--text-primary)] hover:border-[color:var(--primary-accent)] hover:bg-[color:rgba(31,176,200,0.08)]"}`}
            >
              <span className="flex items-center gap-3">
                <span className={`flex size-9 items-center justify-center rounded-xl ${isPrimary ? "bg-white/10" : "bg-[color:rgba(31,176,200,0.12)] text-[color:var(--primary-dark)]"}`}>
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                </span>
                <span>{action.label}</span>
              </span>
              <Icons.ChevronRight className={`h-4 w-4 ${isPrimary ? "text-white/80" : "text-[color:var(--text-secondary)]"}`} />
            </button>
          )
        })}
      </div>
    </section>
  )
}
