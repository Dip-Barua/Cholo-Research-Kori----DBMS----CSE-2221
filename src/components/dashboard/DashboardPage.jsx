"use client"

import DashboardShell from "@/components/layout/DashboardShell"
import WelcomeHeader from "./WelcomeHeader"
import StatCard from "./StatCard"
import ActiveResearch from "./ActiveResearch"
import UpcomingDeadlines from "./UpcomingDeadlines"
import QuickActions from "./QuickActions"
import ResearchOpportunities from "./ResearchOpportunities"
import ResearchNetwork from "./ResearchNetwork"
import { statCards } from "./mockData"

export default function DashboardPage() {
  return (
    <DashboardShell>
      <WelcomeHeader />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">
        <ActiveResearch />

        <div className="space-y-6">
          <UpcomingDeadlines />
          <QuickActions />
        </div>
      </section>

      <ResearchOpportunities />
      <ResearchNetwork />
    </DashboardShell>
  )
}
