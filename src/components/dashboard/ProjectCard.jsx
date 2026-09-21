"use client"

import * as Icons from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const statusStyles = {
  "In Progress": "bg-[color:rgba(31,176,200,0.12)] text-[color:var(--primary-dark)]",
  "Data Collection": "bg-amber-50 text-amber-700",
  "Paper Writing": "bg-emerald-50 text-emerald-700",
}

export default function ProjectCard({ title, supervisor, members, progress, status, summary }) {
  const FolderKanban = Icons.FolderKanban
  const Users = Icons.Users
  const ArrowRight = Icons.ArrowRight

  return (
    <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <CardContent className="space-y-4 px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[color:rgba(11,94,215,0.08)] text-[color:var(--primary-dark)]">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <h3 className="truncate text-[15px] font-semibold text-[color:var(--text-primary)]">{title}</h3>
              <p className="line-clamp-2 text-sm leading-6 text-[color:var(--text-secondary)]">{summary}</p>
            </div>
          </div>

          <Badge variant="outline" className={`border-transparent px-2.5 py-1 ${statusStyles[status] || "bg-slate-100 text-slate-700"}`}>
            {status}
          </Badge>
        </div>

        <div className="grid gap-2 text-sm text-[color:var(--text-secondary)] sm:grid-cols-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-[color:var(--text-secondary)]">Supervisor</div>
            <div className="font-medium text-[color:var(--text-primary)]">{supervisor}</div>
          </div>
          <div className="flex items-end gap-2">
            <Users className="h-4 w-4 text-[color:var(--primary-dark)]" />
            <div>
              <div className="text-xs uppercase tracking-wide text-[color:var(--text-secondary)]">Members</div>
              <div className="font-medium text-[color:var(--text-primary)]">{members}</div>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-[color:var(--text-secondary)]">Progress</div>
            <div className="font-medium text-[color:var(--text-primary)]">{progress}%</div>
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={progress} />
          <div className="flex items-center justify-between gap-3 text-xs text-[color:var(--text-secondary)]">
            <span>Milestone tracking, collaborator updates, and document review in one place.</span>
            <button type="button" className="inline-flex items-center gap-1 font-medium text-[color:var(--primary-dark)] transition-colors hover:text-[color:var(--primary-accent)]">
              View Project
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
