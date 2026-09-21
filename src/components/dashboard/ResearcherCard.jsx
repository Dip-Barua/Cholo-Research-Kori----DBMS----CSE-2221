"use client"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

const statusTone = {
  Connected: "bg-emerald-50 text-emerald-700",
  Available: "bg-[color:rgba(31,176,200,0.12)] text-[color:var(--primary-dark)]",
  Requested: "bg-amber-50 text-amber-700",
}

export default function ResearcherCard({ name, role, department, interests, status, initials }) {
  return (
    <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <CardContent className="flex items-start gap-4 px-5 py-5">
        <Avatar className="size-11">
          <AvatarFallback className="bg-[color:rgba(11,94,215,0.08)] text-[color:var(--primary-dark)]">{initials}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-[color:var(--text-primary)]">{name}</div>
              <div className="text-sm text-[color:var(--text-secondary)]">{role} · {department}</div>
            </div>
            <Badge variant="outline" className={`border-transparent px-2.5 py-1 ${statusTone[status] || "bg-slate-100 text-slate-700"}`}>
              {status}
            </Badge>
          </div>
          <p className="text-sm text-[color:var(--text-secondary)]">{interests}</p>
        </div>
      </CardContent>
    </Card>
  )
}
