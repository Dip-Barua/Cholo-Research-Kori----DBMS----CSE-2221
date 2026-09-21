"use client"

import * as Icons from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

export default function StatCard({ title, value, trend, icon, href }) {
  const Icon = Icons[icon]
  const card = (
    <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--primary-accent)] hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
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

  if (href) {
    return <Link href={href} className="block">{card}</Link>
  }

  return card
}
