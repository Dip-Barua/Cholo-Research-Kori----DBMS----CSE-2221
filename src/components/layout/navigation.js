export const navigationGroups = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
      { label: "Admin", href: "/admin", icon: "ShieldCheck", roles: ["admin"] },
    ],
  },
  {
    label: "Research",
    items: [
      { label: "Discover Research", href: "/discover", icon: "Search" },
      { label: "Research Projects", href: "/projects", icon: "FolderKanban" },
      { label: "Research Labs", href: "/labs", icon: "FlaskConical" },
      { label: "Researchers", href: "/researchers", icon: "Users" },
    ],
  },
  {
    label: "Collaboration",
    items: [
      { label: "My Collaborations", href: "/collaborations", icon: "Handshake" },
      { label: "Requests", href: "/requests", icon: "Inbox" },
      { label: "Messages", href: "/messages", icon: "MessageSquareText" },
    ],
  },
  {
    label: "Research Management",
    items: [
      { label: "Tasks", href: "/tasks", icon: "CheckSquare" },
      { label: "Milestones", href: "/milestones", icon: "Milestone" },
      { label: "Publications", href: "/publications", icon: "BookOpenText" },
    ],
  },
]

export function getNavigationForRole(role) {
  return navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0)
}
