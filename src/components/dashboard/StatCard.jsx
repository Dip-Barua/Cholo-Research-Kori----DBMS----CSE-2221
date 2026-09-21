"use client"

import * as Icons from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function StatCard({ title, value, trend, icon }) {
  const Icon = Icons[icon]

  return (
    <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <CardContent className="flex items-start justify-between gap-4 px-4 py-4 sm:px-5">
        <div className="space-y-2">
          <div className="text-sm font-medium text-[color:var(--text-secondary)]">{title}</div>
          <div className="text-3xl font-semibold tracking-tight text-[color:var(--text-primary)]">{value}</div>
          <div className="text-xs font-medium text-[color:var(--primary-dark)]">{trend}</div>
        </div>

        <div className="flex size-11 items-center justify-center rounded-2xl bg-[color:rgba(31,176,200,0.12)] text-[color:var(--primary-dark)]">
          {Icon ? <Icon className="h-5 w-5" /> : null}
        </div>
      </CardContent>
    </Card>
  )
}
