"use client"

import { researchNetwork } from "./mockData"
import ResearcherCard from "./ResearcherCard"

export default function ResearchNetwork() {
  return (
    <section id="research-network" className="space-y-4 rounded-[1.25rem] border border-[color:var(--border-color)] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-[color:var(--text-primary)]">Your Research Network</h2>
        <p className="text-sm text-[color:var(--text-secondary)]">Connected researchers and faculty that can help you move a project forward.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {researchNetwork.map((researcher) => (
          <ResearcherCard key={researcher.name} {...researcher} />
        ))}
      </div>
    </section>
  )
}
