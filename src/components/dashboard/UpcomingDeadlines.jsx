"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { deadlines } from "./mockData"

const priorityTone = {
  High: "bg-red-50 text-red-700",
  Medium: "bg-amber-50 text-amber-700",
}

export default function UpcomingDeadlines() {
  return (
    <section id="upcoming-deadlines" className="rounded-[1.25rem] border border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <CardHeader className="px-5 pt-5 pb-4">
        <CardTitle>Upcoming Deadlines</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0 px-5 pb-5">
        {deadlines.map((deadline, index) => (
          <div key={deadline.title} className={`flex items-start justify-between gap-3 py-4 ${index < deadlines.length - 1 ? "border-b border-[color:var(--border-color)]" : ""}`}>
            <div className="space-y-1">
              <div className="text-sm font-medium text-[color:var(--text-primary)]">{deadline.title}</div>
              <div className="text-sm text-[color:var(--text-secondary)]">{deadline.date}</div>
            </div>
            <Badge variant="outline" className={`border-transparent px-2.5 py-1 ${priorityTone[deadline.priority] || "bg-slate-100 text-slate-700"}`}>
              {deadline.priority}
            </Badge>
          </div>
        ))}
      </CardContent>
    </section>
  )
}
