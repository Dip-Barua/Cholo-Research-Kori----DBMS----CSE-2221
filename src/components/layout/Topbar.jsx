"use client"

import * as Icons from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AppProvider"
import { collaborationService, notificationService } from "@/lib/services"

export default function Topbar({ onOpenSidebar }) {
  const router = useRouter()
  const { currentUser, unreadCount, logout, dbVersion } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!currentUser) return
    const sync = () => setNotifications(notificationService.getNotifications(currentUser.id))
    const timer = window.setTimeout(sync, 0)
    window.addEventListener("cholo-storage-change", sync)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener("cholo-storage-change", sync)
    }
  }, [currentUser, dbVersion])

  const unreadNotifications = useMemo(() => notifications.filter((notification) => !notification.read).slice(0, 6), [notifications])

  const respondToRequest = async (notification, action) => {
    if (!notification.relatedId || !currentUser) return
    try {
      if (action === "accept") await collaborationService.acceptRequest(notification.relatedId, currentUser.id)
      else await collaborationService.rejectRequest(notification.relatedId, currentUser.id)
      await notificationService.markNotificationRead(notification.id)
      setNotifications(notificationService.getNotifications(currentUser.id))
    } catch {
      router.push("/requests")
    }
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    const query = searchTerm.trim()
    if (!query) return
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

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

        <form onSubmit={handleSearchSubmit} className="hidden min-w-0 flex-1 items-center gap-3 rounded-2xl border border-[color:var(--border-color)] bg-white px-4 py-2.5 shadow-[0_4px_16px_rgba(15,23,42,0.03)] md:flex">
          <Icons.Search className="h-4 w-4 text-[color:var(--text-secondary)]" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search researchers, projects, labs..."
            className="w-full bg-transparent text-sm text-[color:var(--text-primary)] outline-none placeholder:text-[color:var(--text-secondary)]"
          />
          <Badge variant="outline" className="border-[color:var(--border-color)] bg-[color:var(--bg-main)] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-[color:var(--text-secondary)]">
            Global Search
          </Badge>
        </form>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="relative inline-flex size-10 items-center justify-center rounded-xl border border-[color:var(--border-color)] bg-white text-[color:var(--text-secondary)] transition-colors hover:bg-[color:rgba(31,176,200,0.08)] hover:text-[color:var(--text-primary)]">
              <Icons.Bell className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span className="absolute top-2 right-2 inline-flex min-w-4 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-[color:var(--primary-dark)] px-1 text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 rounded-2xl border border-[color:var(--border-color)] bg-white p-2 shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
              <div className="px-2 py-2 text-sm font-semibold text-[color:var(--text-primary)]">Notifications</div>
              <DropdownMenuSeparator />
              <div className="max-h-72 space-y-1 overflow-auto px-1 py-1">
                {unreadNotifications.length > 0 ? unreadNotifications.map((notification) => (
                  <div key={notification.id} className="rounded-xl px-3 py-2">
                    <div className="text-sm font-medium text-[color:var(--text-primary)]">{notification.title}</div>
                    <div className="mt-1 text-xs text-[color:var(--text-secondary)]">{notification.message}</div>
                    {notification.type === "request_received" && notification.relatedId ? (
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" className="h-8 rounded-lg bg-[color:var(--primary-dark)] text-white" onClick={() => respondToRequest(notification, "accept")}>Accept</Button>
                        <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={() => respondToRequest(notification, "reject")}>Reject</Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          await notificationService.markNotificationRead(notification.id)
                          setNotifications(notificationService.getNotifications(currentUser.id))
                          if (notification.href) router.push(notification.href)
                        }}
                        className="mt-2 text-xs font-medium text-[color:var(--primary-dark)] hover:underline"
                      >
                        View details
                      </button>
                    )}
                  </div>
                )) : <div className="px-3 py-4 text-sm text-[color:var(--text-secondary)]">No unread notifications.</div>}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={async () => {
                  if (!currentUser) return
                  await notificationService.markAllNotificationsRead(currentUser.id)
                  setNotifications(notificationService.getNotifications(currentUser.id))
                  try { window.dispatchEvent(new CustomEvent("cholo-storage-change", { detail: { type: "notifications" } })) } catch (e) { /* ignore */ }
                }}
                className="rounded-xl px-3 py-2 text-sm"
              >
                Mark all as read
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push("/notifications")} className="rounded-xl px-3 py-2 text-sm">
                Open all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={() => router.push("/projects?create=1")}
            className="hidden h-10 items-center gap-2 rounded-xl border border-[color:var(--border-color)] bg-white px-4 text-sm font-medium text-[color:var(--text-primary)] transition-colors hover:bg-[color:rgba(31,176,200,0.08)] lg:inline-flex"
          >
            <Icons.Plus className="h-4 w-4" />
            Start Research
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--border-color)] bg-white px-2 py-1.5 text-left transition-colors hover:bg-[color:rgba(31,176,200,0.06)]">
              <Avatar className="size-8">
                <AvatarFallback className="bg-[color:rgba(11,94,215,0.08)] text-[color:var(--primary-dark)]">{(currentUser?.name || "CR").slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <div className="text-sm font-medium text-[color:var(--text-primary)]">{currentUser?.name || "Guest"}</div>
                <div className="text-xs text-[color:var(--text-secondary)]">{currentUser?.role || "student"}</div>
              </div>
              <Icons.ChevronDown className="h-4 w-4 text-[color:var(--text-secondary)]" />
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56 rounded-2xl border border-[color:var(--border-color)] bg-white p-2 shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
              <div className="px-2 py-2">
                <div className="text-sm font-semibold text-[color:var(--text-primary)]">{currentUser?.name || "Guest"}</div>
                <div className="text-xs text-[color:var(--text-secondary)]">{currentUser?.email || ""}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm" onClick={() => router.push("/profile")}>Profile</DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm" onClick={() => router.push("/requests")}>Requests</DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm" onClick={() => router.push("/settings")}>Settings</DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl px-3 py-2 text-sm" onClick={() => router.push("/help")}>Help Center</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="rounded-xl px-3 py-2 text-sm text-red-600"
                onClick={async () => {
                  await logout()
                  router.push("/login")
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
