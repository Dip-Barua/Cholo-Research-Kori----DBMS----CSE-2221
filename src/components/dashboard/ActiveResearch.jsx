"use client"

import { activeProjects } from "./mockData"
import ProjectCard from "./ProjectCard"

export default function ActiveResearch() {
  return (
    <section id="active-research" className="space-y-4 rounded-[1.25rem] border border-[color:var(--border-color)] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[color:var(--text-primary)]">Active Research</h2>
          <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Current projects, progress, and supervision at a glance.</p>
        </div>
      </div>

      <div className="space-y-3">
        {activeProjects.map((project) => (
          <ProjectCard key={project.title} {...project} />
        ))}
      </div>
    </section>
  )
}
