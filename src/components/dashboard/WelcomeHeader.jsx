"use client"

import { ArrowRight, Plus } from "lucide-react"

export default function WelcomeHeader() {
  return (
    <section className="flex flex-col gap-4 rounded-[1.25rem] border border-[color:var(--border-color)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-color)] bg-[color:rgba(31,176,200,0.08)] px-3 py-1 text-xs font-medium text-[color:var(--primary-dark)]">
            Research Discovery · Collaboration · Publication
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--text-primary)] sm:text-3xl">
              Welcome back, Researcher!
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)] sm:text-base">
              Here&apos;s what&apos;s happening with your research today.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[color:var(--primary-dark)] px-4 text-sm font-medium text-white transition-colors hover:bg-[color:color-mix(in_srgb,var(--primary-dark)_88%,black)]"
        >
          <Plus className="h-4 w-4" />
          Start New Research
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}
