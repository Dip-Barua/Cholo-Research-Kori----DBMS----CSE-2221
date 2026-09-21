"use client"

import * as Icons from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { navGroups, userProfile } from "../dashboard/mockData"

function NavItem({ item, collapsed, onNavigate }) {
  const Icon = Icons[item.icon]

  return (
    <a
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${collapsed ? "justify-center px-2" : ""} text-[color:var(--text-secondary)] hover:bg-[color:rgba(31,176,200,0.08)] hover:text-[color:var(--text-primary)]`}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      {!collapsed ? <span>{item.label}</span> : null}
    </a>
  )
}

export default function Sidebar({ collapsed, onToggleCollapsed, onNavigate, mobile = false }) {
  return (
    <aside
      className={`flex h-full flex-col border-r border-[color:var(--border-color)] bg-white ${collapsed && !mobile ? "w-[88px]" : "w-[290px]"} ${mobile ? "w-full border-r-0" : ""}`}
    >
      <div className="flex items-center justify-between gap-3 px-5 py-5">
        <div className={`flex min-w-0 items-center gap-3 ${collapsed && !mobile ? "justify-center" : ""}`}>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[color:rgba(11,94,215,0.09)] text-[color:var(--primary-dark)]">
            <Icons.LibraryBig className="h-5 w-5" />
          </div>
          {!collapsed || mobile ? (
            <div className="min-w-0">
              <div className="truncate text-[15px] font-semibold text-[color:var(--text-primary)]">Cholo Research Kori</div>
              <div className="truncate text-xs text-[color:var(--text-secondary)]">Research Collaboration Platform</div>
            </div>
          ) : null}
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
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-2">
            {!collapsed || mobile ? <div className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-secondary)]">{group.label}</div> : null}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavItem key={item.label} item={item} collapsed={collapsed && !mobile} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[color:var(--border-color)] p-4">
        <div className={`flex items-center gap-3 rounded-2xl bg-[color:var(--bg-main)] p-3 ${collapsed && !mobile ? "justify-center" : ""}`}>
          <Avatar className="size-10">
            <AvatarFallback className="bg-[color:rgba(11,94,215,0.08)] text-[color:var(--primary-dark)]">{userProfile.initials}</AvatarFallback>
          </Avatar>

          {!collapsed || mobile ? (
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="truncate text-sm font-semibold text-[color:var(--text-primary)]">{userProfile.name}</div>
              <div className="truncate text-xs text-[color:var(--text-secondary)]">{userProfile.role}</div>
              <div className="truncate text-xs text-[color:var(--text-secondary)]">{userProfile.email}</div>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
