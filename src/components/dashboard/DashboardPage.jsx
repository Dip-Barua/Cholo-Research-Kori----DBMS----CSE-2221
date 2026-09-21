"use client"

import Link from "next/link"
import { ArrowRight, Plus, TrendingUp } from "lucide-react"
import { useAuth } from "@/components/providers/AppProvider"
import { analyticsService, projectService, taskService, milestoneService, publicationService, userService } from "@/lib/services"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import StatCard from "./StatCard"

function formatDate(dateValue) {
  return new Date(dateValue).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function DashboardPage() {
  const { currentUser, dbVersion } = useAuth()
  void dbVersion
  const metrics = analyticsService.getDashboardMetrics(currentUser)
  const projects = projectService.getProjects()
  const tasks = taskService.getTasks()
  const milestones = milestoneService.getMilestones()
  const publications = publicationService.getPublications()
  const users = userService.getUsers()

  const activeProjects = projects.filter((project) => project.memberIds.includes(currentUser.id) || project.supervisorId === currentUser.id).slice(0, 3)
  const upcomingDeadlines = [...tasks, ...milestones]
    .filter((item) => {
      const dueDate = new Date(item.dueDate)
      const today = new Date()
      return dueDate >= new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
    })
    .sort((left, right) => new Date(left.dueDate) - new Date(right.dueDate))
    .slice(0, 4)

  const opportunities = projects.filter((project) => project.status === "Recruiting" || project.status === "Data Collection").slice(0, 3)

  const networkIds = new Set()
  activeProjects.forEach((project) => project.memberIds.forEach((memberId) => memberId !== currentUser.id && networkIds.add(memberId)))
  const network = users.filter((user) => networkIds.has(user.id)).slice(0, 4)

  return (
    <div className="space-y-6" id="dashboard-root">
      <section className="rounded-[1.25rem] border border-[color:var(--border-color)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-color)] bg-[color:rgba(31,176,200,0.08)] px-3 py-1 text-xs font-medium text-[color:var(--primary-dark)]">
              Research Discovery · Collaboration · Publication
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--text-primary)] sm:text-3xl">
                Welcome back, {currentUser.name}!
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)] sm:text-base">
                Here&apos;s what&apos;s happening with your research today.
              </p>
            </div>
          </div>

          <Link href="/projects?create=1" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[color:var(--primary-dark)] px-4 text-sm font-medium text-white transition-colors hover:bg-[color:color-mix(in_srgb,var(--primary-dark)_88%,black)]">
            <Plus className="h-4 w-4" />
            Start New Research
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active Projects" value={metrics.activeProjects} trend="+1 this month" icon="FolderKanban" href="/projects" />
        <StatCard title="Collaborators" value={metrics.collaborators} trend="+2 new" icon="Users" href="/researchers" />
        <StatCard title="Publications" value={metrics.publications} trend="+2 this year" icon="BookOpenText" href="/publications" />
        <StatCard title="Research Progress" value={`${metrics.progress}%`} trend="3 milestones upcoming" icon="BarChart3" href="/analytics" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)]">
        <div className="space-y-4 rounded-[1.25rem] border border-[color:var(--border-color)] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[color:var(--text-primary)]">Active Research</h2>
              <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Current projects, progress, and supervision at a glance.</p>
            </div>
          </div>

          <div className="space-y-3">
            {activeProjects.map((project) => {
              const supervisor = userService.getUser(project.supervisorId)
              return (
                <Link key={project.id} href={`/projects/${project.id}`} className="block">
                  <Card className="border-[color:var(--border-color)] bg-white shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--primary-accent)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
                    <CardContent className="space-y-4 px-4 py-4 sm:px-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[15px] font-semibold text-[color:var(--text-primary)]">{project.title}</h3>
                          <Badge variant="outline" className="border-transparent bg-[color:rgba(31,176,200,0.12)] px-2.5 py-1 text-[color:var(--primary-dark)]">{project.status}</Badge>
                        </div>
                        <p className="text-sm text-[color:var(--text-secondary)]">Supervisor: {supervisor?.name || "Unknown"} · Members: {project.memberIds.length}</p>
                      </div>
                    </div>
                    <p className="text-sm leading-6 text-[color:var(--text-secondary)]">{project.description}</p>
                    <div className="space-y-2">
                      <Progress value={project.progress} />
                      <div className="flex items-center justify-between text-xs text-[color:var(--text-secondary)]">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                    </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <Card className="rounded-[1.25rem] border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <CardHeader className="px-5 pt-5 pb-4">
              <CardTitle>Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-5 pb-5">
              {upcomingDeadlines.length > 0 ? upcomingDeadlines.map((item, index) => (
                <div key={item.id} className={`flex items-start justify-between gap-3 ${index < upcomingDeadlines.length - 1 ? "border-b border-[color:var(--border-color)] pb-3" : ""}`}>
                  <div>
                    <div className="text-sm font-medium text-[color:var(--text-primary)]">{item.title}</div>
                    <div className="text-sm text-[color:var(--text-secondary)]">{formatDate(item.dueDate)}</div>
                  </div>
                  <Badge variant="outline" className="border-transparent px-2.5 py-1 bg-amber-50 text-amber-700">
                    Due
                  </Badge>
                </div>
              )) : <div className="text-sm text-[color:var(--text-secondary)]">No upcoming deadlines.</div>}
            </CardContent>
          </Card>

          <Card className="rounded-[1.25rem] border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <CardHeader className="px-5 pt-5 pb-4">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 px-5 pb-5">
              <Link href="/projects?create=1" className="inline-flex items-center justify-between rounded-xl border border-[color:var(--primary-dark)] bg-[color:var(--primary-dark)] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[color:color-mix(in_srgb,var(--primary-dark)_88%,black)]">
                <span>Start New Research</span> <Plus className="h-4 w-4" />
              </Link>
              <Link href="/discover" className="inline-flex items-center justify-between rounded-xl border border-[color:var(--border-color)] px-4 py-3 text-sm font-medium text-[color:var(--text-primary)] transition-colors hover:bg-[color:rgba(31,176,200,0.08)]">
                <span>Find Collaborator</span> <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/labs" className="inline-flex items-center justify-between rounded-xl border border-[color:var(--border-color)] px-4 py-3 text-sm font-medium text-[color:var(--text-primary)] transition-colors hover:bg-[color:rgba(31,176,200,0.08)]">
                <span>Explore Research Labs</span> <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/requests" className="inline-flex items-center justify-between rounded-xl border border-[color:var(--border-color)] px-4 py-3 text-sm font-medium text-[color:var(--text-primary)] transition-colors hover:bg-[color:rgba(31,176,200,0.08)]">
                <span>View My Requests</span> <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4 rounded-[1.25rem] border border-[color:var(--border-color)] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[color:var(--text-primary)]">Research Opportunities</h2>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Discover open projects and supervisors recruiting collaborators.</p>
          </div>
          <Link href="/discover" className="inline-flex items-center gap-1 text-sm font-medium text-[color:var(--primary-dark)]">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {opportunities.map((project) => {
            const supervisor = userService.getUser(project.supervisorId)
            return (
              <Link key={project.id} href={`/projects/${project.id}`} className="block">
                <Card className="border-[color:var(--border-color)] bg-white shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--primary-accent)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
                <CardContent className="space-y-4 px-5 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-[color:var(--primary-dark)]">{project.field}</div>
                      <h3 className="text-[15px] font-semibold text-[color:var(--text-primary)]">{project.title}</h3>
                      <div className="text-sm text-[color:var(--text-secondary)]">Supervisor: {supervisor?.name || "Unknown"}</div>
                    </div>
                    <Badge variant="outline" className="border-transparent bg-[color:rgba(31,176,200,0.12)] px-2.5 py-1 text-[color:var(--primary-dark)]">
                      Recruiting
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-sm leading-6 text-[color:var(--text-secondary)]">{project.description}</p>
                </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="space-y-4 rounded-[1.25rem] border border-[color:var(--border-color)] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[color:var(--text-primary)]">Your Research Network</h2>
          <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Connected people helping move your work forward.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {network.length > 0 ? network.map((person) => (
            <Card key={person.id} className="border-[color:var(--border-color)] bg-white shadow-none">
              <CardContent className="flex items-start gap-4 px-5 py-5">
                <Avatar className="size-11">
                  <AvatarFallback className="bg-[color:rgba(11,94,215,0.08)] text-[color:var(--primary-dark)]">{person.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 space-y-1.5">
                  <div className="text-sm font-semibold text-[color:var(--text-primary)]">{person.name}</div>
                  <div className="text-sm text-[color:var(--text-secondary)]">{person.role} · {person.department}</div>
                  <p className="text-sm text-[color:var(--text-secondary)]">{(person.researchInterests || []).join(" · ")}</p>
                </div>
              </CardContent>
            </Card>
          )) : <div className="text-sm text-[color:var(--text-secondary)]">No collaborators yet.</div>}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <CardHeader className="px-5 pt-5 pb-4">
            <CardTitle>Recent Publications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-5 pb-5">
            {publications.slice(0, 3).map((publication) => (
              <div key={publication.id} className="rounded-xl border border-[color:var(--border-color)] p-4">
                <div className="text-sm font-medium text-[color:var(--text-primary)]">{publication.title}</div>
                <div className="mt-1 text-sm text-[color:var(--text-secondary)]">{publication.venue} · {publication.year}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <CardHeader className="px-5 pt-5 pb-4">
            <CardTitle>Project Momentum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5">
            <div className="flex items-center gap-3 rounded-2xl bg-[color:rgba(31,176,200,0.08)] p-4 text-[color:var(--primary-dark)]">
              <TrendingUp className="h-5 w-5" />
              <div>
                <div className="text-sm font-semibold">{metrics.progress}% average progress</div>
                <div className="text-sm text-[color:var(--text-secondary)]">Across your active research projects.</div>
              </div>
            </div>
            <div className="rounded-2xl border border-[color:var(--border-color)] p-4 text-sm text-[color:var(--text-secondary)]">
              {metrics.taskCount} tasks and {metrics.milestoneCount} milestones are currently associated with your workspace.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
