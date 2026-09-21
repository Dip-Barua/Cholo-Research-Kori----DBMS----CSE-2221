"use client"

import * as Icons from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { getNavigationForRole } from "./navigation"
import { useAuth } from "@/components/providers/AppProvider"

function NavItem({ item, collapsed, onNavigate, pathname }) {
  const Icon = Icons[item.icon]
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${collapsed ? "justify-center px-2" : ""} ${isActive ? "bg-[color:rgba(31,176,200,0.12)] text-[color:var(--primary-dark)]" : "text-[color:var(--text-secondary)] hover:bg-[color:rgba(31,176,200,0.08)] hover:text-[color:var(--text-primary)]"}`}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      {!collapsed ? <span>{item.label}</span> : null}
    </Link>
  )
}

export default function Sidebar({ collapsed, onToggleCollapsed, onNavigate, mobile = false }) {
  const { currentUser, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const navigation = getNavigationForRole(currentUser?.role || "student")

  return (
    <aside
      className={`flex h-screen flex-col overflow-y-auto border-r border-[color:var(--border-color)] bg-white ${collapsed && !mobile ? "w-[88px]" : "w-[290px]"} ${mobile ? "w-full border-r-0" : ""}`}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-5">
        <div className={`flex min-w-0 items-center gap-3 ${collapsed && !mobile ? "justify-center" : ""}`}>
          <div className="w-full overflow-hidden">
            <Image src="/logo/transparent_logo_zoomed.png" alt="Cholo Research Kori" width={350} height={80} className="w-full h-auto object-cover" priority />
          </div>
        </div>

        {!mobile ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="inline-flex size-8 items-center justify-center rounded-lg border border-[color:var(--border-color)] text-[color:var(--text-secondary)] transition-colors hover:bg-[color:rgba(31,176,200,0.08)] hover:text-[color:var(--text-primary)]"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <Icons.PanelLeftOpen className="h-4 w-4" /> : <Icons.PanelLeftClose className="h-4 w-4" />}
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-5 px-3 pb-4">
        {navigation.map((group) => (
          <div key={group.label} className="space-y-2">
            {!collapsed || mobile ? <div className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-secondary)]">{group.label}</div> : null}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavItem key={item.label} item={item} collapsed={collapsed && !mobile} onNavigate={onNavigate} pathname={pathname} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[color:var(--border-color)] p-4">
        <div className={`flex items-center gap-3 rounded-2xl bg-[color:var(--bg-main)] p-3 ${collapsed && !mobile ? "justify-center" : ""}`}>
          <Avatar className="size-10">
            <AvatarFallback className="bg-[color:rgba(11,94,215,0.08)] text-[color:var(--primary-dark)]">{(currentUser?.name || "CR").slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>

          {!collapsed || mobile ? (
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="truncate text-sm font-semibold text-[color:var(--text-primary)]">{currentUser?.name || "Guest"}</div>
              <div className="truncate text-xs text-[color:var(--text-secondary)]">{currentUser?.role || "student"}</div>
              <div className="truncate text-xs text-[color:var(--text-secondary)]">{currentUser?.email || ""}</div>
            </div>
          ) : null}
        </div>

        {!collapsed || mobile ? (
          <button
            type="button"
            onClick={async () => {
              await logout()
              router.push("/login")
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--border-color)] px-3 py-2 text-sm font-medium text-[color:var(--text-primary)] transition-colors hover:bg-[color:rgba(31,176,200,0.08)]"
          >
            <Icons.LogOut className="h-4 w-4" />
            Logout
          </button>
        ) : null}
      </div>
    </aside>
  )
}
