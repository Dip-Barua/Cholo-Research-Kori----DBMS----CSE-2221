"use client"

import * as Icons from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { userProfile } from "../dashboard/mockData"

export default function Topbar({ onOpenSidebar }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--border-color)] bg-[color:rgba(235,243,245,0.86)] backdrop-blur-sm">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="inline-flex size-10 items-center justify-center rounded-xl border border-[color:var(--border-color)] bg-white text-[color:var(--text-secondary)] transition-colors hover:bg-[color:rgba(31,176,200,0.08)] hover:text-[color:var(--text-primary)] lg:hidden"
          aria-label="Open navigation"
        >
          <Icons.Menu className="h-5 w-5" />
        </button>

        <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-2xl border border-[color:var(--border-color)] bg-white px-4 py-2.5 shadow-[0_4px_16px_rgba(15,23,42,0.03)] md:flex">
          <Icons.Search className="h-4 w-4 text-[color:var(--text-secondary)]" />
          <input
            type="search"
            placeholder="Search researchers, projects, labs..."
            className="w-full bg-transparent text-sm text-[color:var(--text-primary)] outline-none placeholder:text-[color:var(--text-secondary)]"
          />
          <Badge variant="outline" className="border-[color:var(--border-color)] bg-[color:var(--bg-main)] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-[color:var(--text-secondary)]">
            Global Search
          </Badge>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-xl border border-[color:var(--border-color)] bg-white text-[color:var(--text-secondary)] transition-colors hover:bg-[color:rgba(31,176,200,0.08)] hover:text-[color:var(--text-primary)]"
            aria-label="Notifications"
          >
            <Icons.Bell className="h-5 w-5" />
          </button>

          <button
            type="button"
            className="hidden h-10 items-center gap-2 rounded-xl border border-[color:var(--border-color)] bg-white px-4 text-sm font-medium text-[color:var(--text-primary)] transition-colors hover:bg-[color:rgba(31,176,200,0.08)] lg:inline-flex"
          >
            <Icons.Plus className="h-4 w-4" />
            Start Research
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--border-color)] bg-white px-2 py-1.5 text-left transition-colors hover:bg-[color:rgba(31,176,200,0.06)]">
              <Avatar className="size-8">
                <AvatarFallback className="bg-[color:rgba(11,94,215,0.08)] text-[color:var(--primary-dark)]">{userProfile.initials}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <div className="text-sm font-medium text-[color:var(--text-primary)]">{userProfile.name}</div>
                <div className="text-xs text-[color:var(--text-secondary)]">{userProfile.role}</div>
              </div>
              <Icons.ChevronDown className="h-4 w-4 text-[color:var(--text-secondary)]" />
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56 rounded-2xl border border-[color:var(--border-color)] bg-white p-2 shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
              <div className="px-2 py-2">
                <div className="text-sm font-semibold text-[color:var(--text-primary)]">{userProfile.name}</div>
                <div className="text-xs text-[color:var(--text-secondary)]">{userProfile.email}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm">Profile</DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm">Settings</DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm">Help Center</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm text-red-600">Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
