"use client"

import Link from "next/link"
import { ArrowRight, BookOpenText, FolderKanban, Search, Users, ShieldCheck, Sparkles } from "lucide-react"
import { useAuth } from "@/components/providers/AppProvider"

const featureCards = [
  { title: "Discover research", description: "Find projects, labs, and faculty that match your interests.", icon: Search },
  { title: "Build collaboration", description: "Send requests, accept members, and keep the team connected.", icon: Users },
  { title: "Manage progress", description: "Track tasks, milestones, publications, and deadlines in one workspace.", icon: FolderKanban },
  { title: "Publish impact", description: "Move from draft research to final outputs with visibility and structure.", icon: BookOpenText },
]

const steps = ["Discover", "Request", "Collaborate", "Research", "Publish"]

export default function LandingPage() {
  const { currentUser } = useAuth()

  return (
    <main className="min-h-screen bg-[color:var(--bg-main)] text-[color:var(--text-primary)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex items-center justify-between gap-3 rounded-3xl border border-[color:var(--border-color)] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div>
            <div className="text-lg font-semibold">Cholo Research Kori</div>
            <div className="text-sm text-[color:var(--text-secondary)]">University research collaboration platform</div>
          </div>
          <div className="flex items-center gap-2">
            {currentUser ? (
              <Link href="/dashboard" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[color:var(--primary-dark)] px-4 text-sm font-medium text-white transition-colors hover:bg-[color:color-mix(in_srgb,var(--primary-dark)_88%,black)]">
                Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="inline-flex h-10 items-center rounded-xl border border-[color:var(--border-color)] px-4 text-sm font-medium text-[color:var(--text-primary)] transition-colors hover:bg-[color:rgba(31,176,200,0.08)]">Login</Link>
                <Link href="/register" className="inline-flex h-10 items-center rounded-xl bg-[color:var(--primary-dark)] px-4 text-sm font-medium text-white transition-colors hover:bg-[color:color-mix(in_srgb,var(--primary-dark)_88%,black)]">Get Started</Link>
              </>
            )}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6 rounded-[2rem] border border-[color:var(--border-color)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-color)] bg-[color:rgba(31,176,200,0.08)] px-3 py-1 text-xs font-medium text-[color:var(--primary-dark)]">
              <Sparkles className="h-3.5 w-3.5" />
              Research discovery, collaboration, and publication in one platform
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Find people. Build research. Create impact.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[color:var(--text-secondary)] sm:text-lg">
                Cholo Research Kori connects students, researchers, and faculty across university research workflows, from discovery and collaboration to tasks, milestones, and publications.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/discover" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[color:var(--primary-dark)] px-5 text-sm font-medium text-white transition-colors hover:bg-[color:color-mix(in_srgb,var(--primary-dark)_88%,black)]">
                Explore Research <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/register" className="inline-flex h-11 items-center gap-2 rounded-xl border border-[color:var(--border-color)] bg-white px-5 text-sm font-medium text-[color:var(--text-primary)] transition-colors hover:bg-[color:rgba(31,176,200,0.08)]">
                Get Started
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {steps.map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--bg-main)] p-4">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-white text-[color:var(--primary-dark)]">{index + 1}</div>
                  <div>
                    <div className="text-sm font-medium">{step}</div>
                    <div className="text-sm text-[color:var(--text-secondary)]">Move through the collaboration flow.</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-[2rem] border border-[color:var(--border-color)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-8">
            <div className="flex items-center gap-3 rounded-2xl bg-[color:rgba(11,94,215,0.08)] p-4 text-[color:var(--primary-dark)]">
              <ShieldCheck className="h-5 w-5" />
              <div>
                <div className="text-sm font-semibold">Demo-ready MVP</div>
                <div className="text-sm text-[color:var(--text-secondary)]">MySQL-backed persistence and role-based workflows.</div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {featureCards.map((feature) => {
                const Icon = feature.icon
                return (
                  <div key={feature.title} className="rounded-2xl border border-[color:var(--border-color)] p-4">
                    <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-[color:rgba(31,176,200,0.12)] text-[color:var(--primary-dark)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-base font-semibold">{feature.title}</div>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--text-secondary)]">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
