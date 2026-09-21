"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export default function ResearchOpportunityCard({ title, field, supervisor, skills, openPositions }) {
  return (
    <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <CardContent className="space-y-4 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="text-sm font-medium text-[color:var(--primary-dark)]">{field}</div>
            <h3 className="text-[15px] font-semibold text-[color:var(--text-primary)]">{title}</h3>
            <div className="text-sm text-[color:var(--text-secondary)]">Supervisor: <span className="font-medium text-[color:var(--text-primary)]">{supervisor}</span></div>
          </div>
          <Badge variant="outline" className="border-transparent bg-[color:rgba(31,176,200,0.12)] px-2.5 py-1 text-[color:var(--primary-dark)]">
            {openPositions} open positions
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <Badge key={skill} variant="outline" className="border-[color:var(--border-color)] bg-[color:var(--bg-main)] px-2.5 py-1 text-[color:var(--text-secondary)]">
              {skill}
            </Badge>
          ))}
        </div>

        <button type="button" className="inline-flex h-9 items-center justify-center rounded-xl border border-[color:var(--border-color)] px-3.5 text-sm font-medium text-[color:var(--text-primary)] transition-colors hover:border-[color:var(--primary-accent)] hover:bg-[color:rgba(31,176,200,0.08)]">
          View Opportunity
        </button>
      </CardContent>
    </Card>
  )
}
