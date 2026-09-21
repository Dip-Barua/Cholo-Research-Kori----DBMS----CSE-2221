"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import { useAuth } from "@/components/providers/AppProvider"

export default function DashboardShell({ children }) {
  const { ready } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--bg-main)] text-[color:var(--text-secondary)]">
        Loading Cholo Research Kori...
      </div>
    )
  }

  return (
    <div id="top" className="min-h-screen bg-[color:var(--bg-main)] text-[color:var(--text-primary)] lg:flex">
      <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen lg:self-start">
        <Sidebar collapsed={sidebarCollapsed} onToggleCollapsed={() => setSidebarCollapsed((value) => !value)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenSidebar={() => setMobileOpen(true)} />
        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
            {children}
          </div>
        </main>
      </div>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent
          showCloseButton={false}
          className="fixed left-0 top-0 h-full max-w-[88vw] !translate-x-0 !translate-y-0 gap-0 overflow-hidden rounded-none border-r border-[color:var(--border-color)] bg-white p-0 shadow-[0_20px_60px_rgba(15,23,42,0.2)]"
        >
          <Sidebar mobile onNavigate={() => setMobileOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
