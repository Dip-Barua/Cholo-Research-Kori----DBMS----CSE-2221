"use client"

import { opportunities } from "./mockData"
import ResearchOpportunityCard from "./ResearchOpportunityCard"

export default function ResearchOpportunities() {
  return (
    <section id="research-opportunities" className="space-y-4 rounded-[1.25rem] border border-[color:var(--border-color)] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-[color:var(--text-primary)]">Research Opportunities</h2>
        <p className="text-sm text-[color:var(--text-secondary)]">Find open projects, supervisors, and the skills needed to join research teams.</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {opportunities.map((opportunity) => (
          <ResearchOpportunityCard key={opportunity.title} {...opportunity} />
        ))}
      </div>
    </section>
  )
}
