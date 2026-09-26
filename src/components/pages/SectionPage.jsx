"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/providers/AppProvider"
import {
  analyticsService,
  collaborationService,
  labService,
  messageService,
  milestoneService,
  notificationService,
  projectService,
  publicationService,
  searchService,
  settingsService,
  taskService,
  userService,
} from "@/lib/services"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import MessagesSection from "@/components/pages/MessagesSection"
import { ArrowRight, Check, Plus, Send, Trash2, UserPlus } from "lucide-react"

function SectionHeader({ title, description, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 rounded-[1.25rem] border border-[color:var(--border-color)] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--text-primary)]">{title}</h1>
        <p className="text-sm text-[color:var(--text-secondary)]">{description}</p>
      </div>
      {action}
    </div>
  )
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-[color:var(--border-color)] bg-white p-8 text-center text-[color:var(--text-secondary)]">
      <div className="text-base font-medium text-[color:var(--text-primary)]">{title}</div>
      <div className="mt-1 text-sm">{description}</div>
    </div>
  )
}

function miniUser(user) {
  if (!user) return null
  return { ...user, initials: (user.name || "CR").slice(0, 2).toUpperCase() }
}

function connectionLabel(state) {
  if (state === "pending_outgoing") return "Request sent"
  if (state === "pending_incoming") return "Pending your response"
  if (state === "connected" || state === "member") return "Connected"
  if (state === "rejected_outgoing") return "Declined"
  return "Collaborate"
}

function connectionDisabled(state) {
  return state === "pending_outgoing" || state === "connected" || state === "member"
}

function canCreateResearchWorkspace(role) {
  return ["admin", "author"].includes(role)
}

function canManageTasks(role) {
  return ["admin", "author", "supervisor"].includes(role)
}

function TaskCard({ task, onChange, userService, currentUser }) {
  const assignee = userService.getUser(task.assignedTo)

  return (
    <div className="rounded-2xl border border-[color:var(--border-color)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-[color:var(--text-primary)]">{task.title}</div>
          <div className="text-sm text-[color:var(--text-secondary)]">{assignee?.name || task.assignedTo} · {task.dueDate || "No due date"}</div>
        </div>
        <Badge variant="outline" className={`border ${task.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : task.status === "In Progress" ? "bg-cyan-50 text-cyan-700 border-cyan-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
          {task.status}
        </Badge>
      </div>
      <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{task.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => onChange("Todo")}>Pending</Button>
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => onChange("In Progress")}>In Progress</Button>
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => onChange("Completed")}>Completed</Button>
      </div>
      {currentUser.role === "admin" || currentUser.role === "author" ? <div className="mt-2 text-xs text-[color:var(--text-secondary)]">Research controls enabled</div> : null}
    </div>
  )
}

export default function SectionPage({ section }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentUser, dbVersion } = useAuth()
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [notice, setNotice] = useState("")
  const [requestTarget, setRequestTarget] = useState(null)
  const [requestMessage, setRequestMessage] = useState("")
  const [fieldFilter, setFieldFilter] = useState("all")
  const [skillFilter, setSkillFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [projectTitle, setProjectTitle] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [projectField, setProjectField] = useState("")
  const [projectSkills, setProjectSkills] = useState("")
  const [projectStartDate, setProjectStartDate] = useState("")
  const [projectEndDate, setProjectEndDate] = useState("")
  const [projectMaxMembers, setProjectMaxMembers] = useState(4)
  const [labName, setLabName] = useState("")
  const [labDepartment, setLabDepartment] = useState("")
  const [labDescription, setLabDescription] = useState("")
  const [labAreas, setLabAreas] = useState("")
  const [labMemberSearch, setLabMemberSearch] = useState("")
  const [labMemberResults, setLabMemberResults] = useState([])
  const [labMemberIds, setLabMemberIds] = useState([])
  const [projectLabId, setProjectLabId] = useState("")
  const [selectedConversationId, setSelectedConversationId] = useState(null)
  const [messageContent, setMessageContent] = useState("")
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [taskDueDate, setTaskDueDate] = useState("")
  const [taskPriority, setTaskPriority] = useState("Medium")
  const [taskAssignee, setTaskAssignee] = useState("")
  const [publicationTitle, setPublicationTitle] = useState("")
  const [publicationVenue, setPublicationVenue] = useState("")
  const [publicationYear, setPublicationYear] = useState(new Date().getFullYear())
  const [publicationStatus, setPublicationStatus] = useState("Draft")
  const [publicationLink, setPublicationLink] = useState("")
  const [bio, setBio] = useState(currentUser.bio || "")
  const [university, setUniversity] = useState(currentUser.university || "")
  const [department, setDepartment] = useState(currentUser.department || "")
  const [interests, setInterests] = useState((currentUser.researchInterests || []).join(", "))
  const [skills, setSkills] = useState((currentUser.skills || []).join(", "))
  const [notificationReadFilter, setNotificationReadFilter] = useState("all")
  const [settingsDraft, setSettingsDraft] = useState(settingsService.getSettings(currentUser.id))
  const [searchTerm, setSearchTerm] = useState(query)
  const [roleRefreshVersion, setRoleRefreshVersion] = useState(0)

  const projects = projectService.getProjects()
  const labs = labService.getLabs()
  const users = userService.getUsers().filter((user) => user.id !== currentUser.id && user.active !== false)
  const requests = collaborationService.getResearchRequests()
  const collaborations = collaborationService.getCollaborations()
  const tasks = taskService.getTasks()
  const milestones = milestoneService.getMilestones()
  const publications = publicationService.getPublications()
  const conversations = messageService.getConversations(currentUser.id)
  const notifications = notificationService.getNotifications(currentUser.id)
  const metrics = analyticsService.getDashboardMetrics(currentUser)
  const projectFields = Array.from(new Set(projects.map((project) => project.field))).sort()
  const projectSkillOptions = Array.from(new Set(projects.flatMap((project) => project.skills || []))).sort()
  const projectDepartments = Array.from(new Set(projects.map((project) => userService.getUser(project.supervisorId)?.department).filter(Boolean))).sort()
  const projectStatuses = Array.from(new Set(projects.map((project) => project.status))).sort()

  const activeProjectIds = new Set(projects.filter((project) => project.memberIds.includes(currentUser.id) || project.supervisorId === currentUser.id).map((project) => project.id))
  const refreshUserList = () => setRoleRefreshVersion((version) => version + 1)

  const filteredProjects = projects.filter((project) => {
    const text = `${project.title} ${project.description} ${project.field} ${(project.skills || []).join(" ")}`.toLowerCase()
    const matchesQuery = text.includes(query.toLowerCase())
    const matchesField = fieldFilter === "all" || project.field === fieldFilter
    const matchesSkill = skillFilter === "all" || (project.skills || []).includes(skillFilter)
    const supervisorDepartment = userService.getUser(project.supervisorId)?.department || ""
    const matchesDepartment = departmentFilter === "all" || supervisorDepartment === departmentFilter
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    return matchesQuery && matchesField && matchesSkill && matchesDepartment && matchesStatus
  })

  const filteredPeople = users.filter((user) => {
    const text = `${user.name} ${user.department} ${user.role} ${(user.researchInterests || []).join(" ")} ${(user.skills || []).join(" ")}`.toLowerCase()
    return text.includes(query.toLowerCase())
  })

  const filteredLabs = labs.filter((lab) => `${lab.name} ${lab.description} ${lab.department} ${(lab.researchAreas || []).join(" ")}`.toLowerCase().includes(query.toLowerCase()))
  const filteredPublications = publications.filter((publication) => `${publication.title} ${publication.venue} ${publication.status}`.toLowerCase().includes(query.toLowerCase()))

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId) || conversations[0] || null
  const selectedConversationMessages = selectedConversation ? messageService.getConversationMessages(selectedConversation.id) : []

  const sendJoinRequest = async (project) => {
    if (!requestMessage.trim()) return
    try {
      await collaborationService.sendProjectJoinRequest({
        senderId: currentUser.id,
        projectId: project.id,
        message: requestMessage.trim(),
      })
      setNotice(`Request sent for ${project.title}. Waiting for approval.`)
      setRequestTarget(null)
      setRequestMessage("")
    } catch (error) {
      setNotice(error.message || "Could not send request.")
    }
  }

  void dbVersion

  const managedLabs = labService.getManagedLabs(currentUser.id)

  const createProject = async (event) => {
    event.preventDefault()
    if (!projectTitle || !projectDescription || !projectField || !projectLabId) {
      setNotice("Select a lab and fill in the required project fields.")
      return
    }
    try {
      const created = await projectService.createProject({
        title: projectTitle,
        description: projectDescription,
        field: projectField,
        skills: projectSkills.split(",").map((skill) => skill.trim()).filter(Boolean),
        startDate: projectStartDate,
        endDate: projectEndDate,
        maxMembers: Number(projectMaxMembers) || 4,
        labId: projectLabId,
      }, currentUser.id)
      router.push(`/projects/${created.id}`)
    } catch (error) {
      setNotice(error.message || "Could not create project.")
    }
  }

  const createLab = async (event) => {
    event.preventDefault()
    if (!labName || !labDepartment) return
    try {
      const created = await labService.createLab({
        name: labName,
        department: labDepartment,
        description: labDescription,
        researchAreas: labAreas.split(",").map((area) => area.trim()).filter(Boolean),
        memberIds: labMemberIds,
      }, currentUser.id)
      setLabMemberIds([])
      setLabMemberSearch("")
      router.push(`/labs/${created.id}`)
    } catch (error) {
      setNotice(error.message || "Could not create lab.")
    }
  }

  const searchLabMembers = (value) => {
    setLabMemberSearch(value)
    setLabMemberResults(userService.searchUsers(value, { excludeUserId: currentUser.id }))
  }

  const addLabMemberCandidate = (userId) => {
    setLabMemberIds((current) => (current.includes(userId) ? current : [...current, userId]))
    setLabMemberSearch("")
    setLabMemberResults([])
  }

  const createTask = (event) => {
    event.preventDefault()
    if (!taskTitle || !taskDescription || !taskAssignee) return
    const assignee = userService.getUsers().find((user) => user.id === taskAssignee || user.email === taskAssignee)
    if (!assignee) return
    taskService.createTask({
      projectId: [...activeProjectIds][0] || projects[0]?.id,
      assignedTo: assignee.id,
      title: taskTitle,
      description: taskDescription,
      priority: taskPriority,
      status: "Todo",
      dueDate: taskDueDate,
    }, currentUser.id)
    setTaskTitle("")
    setTaskDescription("")
    setTaskDueDate("")
  }

  const createPublication = (event) => {
    event.preventDefault()
    if (!publicationTitle || !publicationVenue) return
    publicationService.createPublication({
      projectId: [...activeProjectIds][0] || null,
      authorIds: [currentUser.id],
      title: publicationTitle,
      venue: publicationVenue,
      year: Number(publicationYear),
      status: publicationStatus,
      link: publicationLink,
    }, currentUser.id)
    setPublicationTitle("")
    setPublicationVenue("")
    setPublicationLink("")
  }

  const saveProfile = (event) => {
    event.preventDefault()
    userService.updateProfile(currentUser.id, {
      bio,
      university,
      department,
      researchInterests: interests.split(",").map((item) => item.trim()).filter(Boolean),
      skills: skills.split(",").map((item) => item.trim()).filter(Boolean),
    })
  }

  const saveSettings = (event) => {
    event.preventDefault()
    settingsService.updateSettings(currentUser.id, settingsDraft)
  }

  if (section === "search") {
    return (
      <div className="space-y-6">
        <SectionHeader title="Search Results" description={`Results for “${query}” across researchers, projects, labs, and publications.`} />
        <div className="grid gap-4 xl:grid-cols-2">
          <Card><CardHeader><CardTitle>Projects</CardTitle></CardHeader><CardContent className="space-y-3">{filteredProjects.length ? filteredProjects.map((project) => <Link key={project.id} href={`/projects/${project.id}`} className="block rounded-xl border border-[color:var(--border-color)] p-4 hover:bg-[color:rgba(31,176,200,0.08)]"><div className="font-medium">{project.title}</div><div className="text-sm text-[color:var(--text-secondary)]">{project.field}</div></Link>) : <EmptyState title="No projects found" description="Try a different search term." />}</CardContent></Card>
          <Card><CardHeader><CardTitle>Researchers</CardTitle></CardHeader><CardContent className="space-y-3">{filteredPeople.length ? filteredPeople.map((person) => <Link key={person.id} href={`/researchers/${person.id}`} className="block rounded-xl border border-[color:var(--border-color)] p-4 hover:bg-[color:rgba(31,176,200,0.08)]"><div className="font-medium">{person.name}</div><div className="text-sm text-[color:var(--text-secondary)]">{person.department}</div></Link>) : <EmptyState title="No researchers found" description="Try a different search term." />}</CardContent></Card>
          <Card><CardHeader><CardTitle>Labs</CardTitle></CardHeader><CardContent className="space-y-3">{filteredLabs.length ? filteredLabs.map((lab) => <Link key={lab.id} href={`/labs/${lab.id}`} className="block rounded-xl border border-[color:var(--border-color)] p-4 hover:bg-[color:rgba(31,176,200,0.08)]"><div className="font-medium">{lab.name}</div><div className="text-sm text-[color:var(--text-secondary)]">{lab.department}</div></Link>) : <EmptyState title="No labs found" description="Try a different search term." />}</CardContent></Card>
          <Card><CardHeader><CardTitle>Publications</CardTitle></CardHeader><CardContent className="space-y-3">{filteredPublications.length ? filteredPublications.map((publication) => <div key={publication.id} className="rounded-xl border border-[color:var(--border-color)] p-4"><div className="font-medium">{publication.title}</div><div className="text-sm text-[color:var(--text-secondary)]">{publication.venue} · {publication.year}</div></div>) : <EmptyState title="No publications found" description="Try a different search term." />}</CardContent></Card>
        </div>
      </div>
    )
  }

  if (section === "discover") {
    return (
      <div className="space-y-6">
        <SectionHeader title="Discover Research" description="Search open projects, faculty, and labs. Request to join directly from the opportunity cards." action={<Link href="/projects" className="inline-flex h-10 items-center gap-2 rounded-xl border border-[color:var(--border-color)] px-4 text-sm font-medium hover:bg-[color:rgba(31,176,200,0.08)]"><ArrowRight className="h-4 w-4" /> Browse Projects</Link>} />
        {notice ? <div className="rounded-2xl border border-[color:var(--border-color)] bg-white px-4 py-3 text-sm text-[color:var(--text-primary)] shadow-[0_8px_24px_rgba(15,23,42,0.04)]">{notice}</div> : null}
        <Card className="w-full border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-8">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles, supervisors, skills..." className="xl:col-span-8" />
            <select value={fieldFilter} onChange={(event) => setFieldFilter(event.target.value)} className="h-10 w-full rounded-xl border border-[color:var(--border-color)] bg-white px-3 text-sm outline-none xl:col-span-2">
              <option value="all">All fields</option>
              {projectFields.map((field) => <option key={field} value={field}>{field}</option>)}
            </select>
            <select value={skillFilter} onChange={(event) => setSkillFilter(event.target.value)} className="h-10 w-full rounded-xl border border-[color:var(--border-color)] bg-white px-3 text-sm outline-none xl:col-span-2">
              <option value="all">All skills</option>
              {projectSkillOptions.map((skill) => <option key={skill} value={skill}>{skill}</option>)}
            </select>
            <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} className="h-10 w-full rounded-xl border border-[color:var(--border-color)] bg-white px-3 text-sm outline-none xl:col-span-2">
              <option value="all">All departments</option>
              {projectDepartments.map((departmentName) => <option key={departmentName} value={departmentName}>{departmentName}</option>)}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 w-full rounded-xl border border-[color:var(--border-color)] bg-white px-3 text-sm outline-none xl:col-span-2">
              <option value="all">All statuses</option>
              {projectStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </CardContent>
        </Card>
        <div className="grid gap-4 lg:grid-cols-2">
            {filteredProjects.length ? filteredProjects.map((project) => {
              const supervisor = miniUser(userService.getUser(project.supervisorId))
              const joinState = collaborationService.getConnectionState({
                viewerId: currentUser.id,
                targetId: project.supervisorId,
                projectId: project.id,
              })
              const pendingRequest = joinState === "pending_outgoing"
              return (
                <Card key={project.id} className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--primary-accent)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-[color:var(--primary-dark)]">{project.field}</div>
                        <h3 className="text-lg font-semibold">{project.title}</h3>
                        <div className="text-sm text-[color:var(--text-secondary)]">Supervisor: {supervisor?.name || "Unknown"} · Members: {project.memberIds.length}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className="border-transparent bg-[color:rgba(31,176,200,0.12)] text-[color:var(--primary-dark)]">{project.status}</Badge>
                        {pendingRequest ? <Badge variant="outline" className="border-transparent bg-amber-50 text-amber-700">Waiting for approval</Badge> : null}
                      </div>
                    </div>
                    <p className="text-sm text-[color:var(--text-secondary)]">{project.description}</p>
                    <div className="flex flex-wrap gap-2">{(project.skills || []).map((skill) => <Badge key={skill} variant="outline" className="border-[color:var(--border-color)]">{skill}</Badge>)}</div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/projects/${project.id}`} className="inline-flex h-9 items-center rounded-xl border border-[color:var(--border-color)] px-3.5 text-sm font-medium hover:bg-[color:rgba(31,176,200,0.08)]">View Details</Link>
                      <Button disabled={connectionDisabled(joinState) || joinState === "member"} onClick={() => setRequestTarget(project)} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[color:var(--primary-dark)] text-white hover:bg-[color:color-mix(in_srgb,var(--primary-dark)_88%,black)] disabled:opacity-60"><UserPlus className="h-4 w-4" /> {joinState === "member" ? "Already a member" : pendingRequest ? "Waiting for approval" : "Request to Join"}</Button>
                    </div>
                  </CardContent>
                </Card>
              )
            }) : <EmptyState title="No research opportunities found" description="Try a broader search term." />}

            {requestTarget ? (
              <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <CardHeader><CardTitle>Request to Join {requestTarget.title}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Textarea value={requestMessage} onChange={(event) => setRequestMessage(event.target.value)} placeholder="Why are you interested?" />
                  <div className="flex gap-2"><Button type="button" onClick={() => sendJoinRequest(requestTarget)} className="rounded-xl bg-[color:var(--primary-dark)] text-white">Submit Request</Button><Button type="button" variant="outline" onClick={() => setRequestTarget(null)} className="rounded-xl">Cancel</Button></div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
    )
  }

  if (section === "projects") {
    const projectCards = filteredProjects.length ? filteredProjects : projects
    const canCreate = canCreateResearchWorkspace(currentUser.role)
    return (
      <div className="space-y-6">
        <SectionHeader title="Research Projects" description="Track research projects, create new workspaces, and manage project progress." />
        {notice ? <div className="rounded-2xl border border-[color:var(--border-color)] bg-white px-4 py-3 text-sm shadow-[0_8px_24px_rgba(15,23,42,0.04)]">{notice}</div> : null}
        {canCreate ? (
          <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <CardHeader><CardTitle>Create Research Project</CardTitle></CardHeader>
            <CardContent>
              {managedLabs.length ? (
                <form className="grid gap-3 md:grid-cols-2" onSubmit={createProject}>
                  <select value={projectLabId} onChange={(event) => setProjectLabId(event.target.value)} className="h-10 rounded-xl border border-[color:var(--border-color)] bg-white px-3 text-sm md:col-span-2" required>
                    <option value="">Select parent research lab</option>
                    {managedLabs.map((lab) => <option key={lab.id} value={lab.id}>{lab.name} · {lab.department}</option>)}
                  </select>
                  <Input value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} placeholder="Title" required />
                  <Input value={projectField} onChange={(event) => setProjectField(event.target.value)} placeholder="Research field" required />
                  <Textarea value={projectDescription} onChange={(event) => setProjectDescription(event.target.value)} placeholder="Description" className="md:col-span-2" required />
                  <Input value={projectSkills} onChange={(event) => setProjectSkills(event.target.value)} placeholder="Required skills, comma separated" className="md:col-span-2" />
                  <Input type="date" value={projectStartDate} onChange={(event) => setProjectStartDate(event.target.value)} />
                  <Input type="date" value={projectEndDate} onChange={(event) => setProjectEndDate(event.target.value)} />
                  <Input type="number" min="2" value={projectMaxMembers} onChange={(event) => setProjectMaxMembers(event.target.value)} placeholder="Max members" />
                  <div className="md:col-span-2"><Button className="rounded-xl bg-[color:var(--primary-dark)] text-white" type="submit">Create Project</Button></div>
                </form>
              ) : (
                <EmptyState title="Create a lab first" description="Research projects must be created under one of your labs." />
              )}
            </CardContent>
          </Card>
        ) : null}
        <div className="grid gap-4 xl:grid-cols-2">
          {projectCards.map((project) => {
            const supervisor = userService.getUser(project.supervisorId)
            return (
              <Card key={project.id} className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-[color:var(--primary-dark)]">{project.field}</div>
                      <h3 className="text-lg font-semibold">{project.title}</h3>
                      <div className="text-sm text-[color:var(--text-secondary)]">Supervisor: {supervisor?.name || "Unknown"}</div>
                    </div>
                    <Badge variant="outline" className="border-transparent bg-[color:rgba(31,176,200,0.12)] text-[color:var(--primary-dark)]">{project.status}</Badge>
                  </div>
                  <p className="text-sm text-[color:var(--text-secondary)]">{project.description}</p>
                  <Progress value={project.progress} />
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/projects/${project.id}`} className="inline-flex h-9 items-center rounded-xl border border-[color:var(--border-color)] px-3.5 text-sm font-medium hover:bg-[color:rgba(31,176,200,0.08)]">View Details</Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  if (section === "labs") {
    return (
      <div className="space-y-6">
        <SectionHeader title="Research Labs" description="Explore labs, research areas, and open projects." />
        {canCreateResearchWorkspace(currentUser.role) ? (
          <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <CardHeader><CardTitle>Create Lab</CardTitle></CardHeader>
            <CardContent>
              <form className="grid gap-3 md:grid-cols-2" onSubmit={createLab}>
                <Input value={labName} onChange={(event) => setLabName(event.target.value)} placeholder="Lab name" required />
                <Input value={labDepartment} onChange={(event) => setLabDepartment(event.target.value)} placeholder="Department" required />
                <Textarea value={labDescription} onChange={(event) => setLabDescription(event.target.value)} placeholder="Description" className="md:col-span-2" />
                <Input value={labAreas} onChange={(event) => setLabAreas(event.target.value)} placeholder="Research areas, comma separated" className="md:col-span-2" />
                <div className="relative md:col-span-2">
                  <Input value={labMemberSearch} onChange={(event) => searchLabMembers(event.target.value)} placeholder="Search researchers to add to this lab" />
                  {labMemberResults.length ? (
                    <div className="absolute z-10 mt-1 w-full rounded-xl border border-[color:var(--border-color)] bg-white p-2 shadow-lg">
                      {labMemberResults.map((user) => (
                        <button key={user.id} type="button" onClick={() => addLabMemberCandidate(user.id)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-[color:rgba(31,176,200,0.08)]">
                          <span>{user.name}</span>
                          <span className="text-[color:var(--text-secondary)]">{user.department}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                {labMemberIds.length ? (
                  <div className="flex flex-wrap gap-2 md:col-span-2">
                    {labMemberIds.map((memberId) => {
                      const member = userService.getUser(memberId)
                      return (
                        <Badge key={memberId} variant="outline" className="gap-2">
                          {member?.name || memberId}
                          <button type="button" onClick={() => setLabMemberIds((current) => current.filter((id) => id !== memberId))}>×</button>
                        </Badge>
                      )
                    })}
                  </div>
                ) : null}
                <div className="md:col-span-2"><Button className="rounded-xl bg-[color:var(--primary-dark)] text-white" type="submit">Create Lab</Button></div>
              </form>
            </CardContent>
          </Card>
        ) : null}
        <div className="grid gap-4 xl:grid-cols-2">
          {labs.map((lab) => (
            <Card key={lab.id} className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-semibold">{lab.name}</h3><div className="text-sm text-[color:var(--text-secondary)]">{lab.department}</div></div><Badge variant="outline" className="border-transparent bg-[color:rgba(31,176,200,0.12)] text-[color:var(--primary-dark)]">{lab.projectIds.length} projects</Badge></div>
                <p className="text-sm text-[color:var(--text-secondary)]">{lab.description}</p>
                <div className="flex flex-wrap gap-2">{(lab.researchAreas || []).map((area) => <Badge key={area} variant="outline">{area}</Badge>)}</div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/labs/${lab.id}`} className="inline-flex h-9 items-center rounded-xl border border-[color:var(--border-color)] px-3.5 text-sm font-medium hover:bg-[color:rgba(31,176,200,0.08)]">View Details</Link>
                  {(() => {
                    const joinState = collaborationService.getConnectionState({ viewerId: currentUser.id, labId: lab.id })
                    if (joinState === "member") {
                      return <Link href={`/messages?conversation=${messageService.getConversations(currentUser.id).find((conversation) => conversation.type === "lab" && conversation.labId === lab.id)?.id || ""}`} className="inline-flex h-9 items-center rounded-xl bg-[color:var(--primary-dark)] px-3.5 text-sm font-medium text-white">Lab Chat</Link>
                    }
                    return (
                      <Button
                        disabled={connectionDisabled(joinState)}
                        className="h-9 rounded-xl bg-[color:var(--primary-dark)] text-white disabled:opacity-60"
                        onClick={async () => {
                          try {
                            await collaborationService.sendLabJoinRequest({ senderId: currentUser.id, labId: lab.id, message: `I would like to join ${lab.name}.` })
                            setNotice(`Join request sent to the lab admin for ${lab.name}.`)
                          } catch (error) {
                            setNotice(error.message || "Could not send lab join request.")
                          }
                        }}
                      >
                        {joinState === "pending_outgoing" ? "Waiting for approval" : "Request to Join Lab"}
                      </Button>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (section === "researchers") {
    const researcherNotice = notice
    const setResearcherNotice = setNotice
    const connectedIds = new Set(userService.getConnectedUsers(currentUser.id).map((user) => user.id))
    const connectedResearchers = users.filter((user) => connectedIds.has(user.id))
    const otherResearchers = users.filter((user) => !connectedIds.has(user.id))

    const renderResearcherCard = (user, connected = false) => {
      const connectState = collaborationService.getConnectionState({
        viewerId: currentUser.id,
        targetId: user.id,
        projectId: null,
      })
      return (
        <Card key={user.id} className={`border bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] ${connected ? "border-emerald-200 bg-emerald-50/40" : "border-[color:var(--border-color)]"}`}>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-start gap-4">
              <Avatar className="size-11"><AvatarFallback className={`${connected ? "bg-emerald-100 text-emerald-800" : "bg-[color:rgba(11,94,215,0.08)] text-[color:var(--primary-dark)]"}`}>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{user.name}</div>
                  {connected ? <Badge variant="outline" className="border-transparent bg-emerald-100 text-emerald-800">Connected</Badge> : null}
                </div>
                <div className="text-sm text-[color:var(--text-secondary)]">{user.role} · {user.department}</div>
                <div className="text-sm text-[color:var(--text-secondary)]">{user.university}</div>
              </div>
            </div>
            <p className="text-sm text-[color:var(--text-secondary)]">{(user.researchInterests || []).join(" · ")}</p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/researchers/${user.id}`} className="inline-flex h-9 items-center rounded-xl border border-[color:var(--border-color)] px-3.5 text-sm font-medium hover:bg-[color:rgba(31,176,200,0.08)]">View Profile</Link>
              {connected ? (
                <Link href={`/messages?userId=${user.id}`} className="inline-flex h-9 items-center rounded-xl bg-[color:var(--primary-dark)] px-3.5 text-sm font-medium text-white">Message</Link>
              ) : (
                <Button disabled={connectionDisabled(connectState)} className="h-9 rounded-xl bg-[color:var(--primary-dark)] text-white disabled:opacity-60" onClick={async () => { try { await collaborationService.sendCollaborationRequest({ senderId: currentUser.id, receiverId: user.id, message: "Interested in collaborating on a research project." }); setResearcherNotice(`Collaboration request sent to ${user.name}.`) } catch (error) { setResearcherNotice(error.message || "Could not send request.") } }}>{connectionLabel(connectState)}</Button>
              )}
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-6">
        <SectionHeader title="Researchers" description="Your connections appear first. Browse others to send collaboration requests." />
        {researcherNotice ? <div className="rounded-2xl border border-[color:var(--border-color)] bg-white px-4 py-3 text-sm shadow-[0_8px_24px_rgba(15,23,42,0.04)]">{researcherNotice}</div> : null}
        {connectedResearchers.length ? (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Connected Researchers</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{connectedResearchers.map((user) => renderResearcherCard(user, true))}</div>
          </div>
        ) : null}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">{connectedResearchers.length ? "Discover More Researchers" : "All Researchers"}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{otherResearchers.map((user) => renderResearcherCard(user, false))}</div>
        </div>
      </div>
    )
  }

  if (section === "collaborations") {
    const mine = collaborations.filter((collaboration) => collaboration.userIds.includes(currentUser.id))
    return (
      <div className="space-y-6">
        <SectionHeader title="My Collaborations" description="View active, pending, and past collaborations." />
        <div className="grid gap-4 xl:grid-cols-2">
          {mine.length ? mine.map((collaboration) => {
            const project = projects.find((item) => item.id === collaboration.projectId)
            return (<Card key={collaboration.id} className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"><CardContent className="space-y-3 p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{project?.title || "Project"}</h3><div className="text-sm text-[color:var(--text-secondary)]">Role: {collaboration.role}</div></div><Badge variant="outline" className="border-transparent bg-emerald-50 text-emerald-700">{collaboration.status}</Badge></div><Link href={`/projects/${project?.id}`} className="inline-flex h-9 items-center rounded-xl border border-[color:var(--border-color)] px-3.5 text-sm font-medium hover:bg-[color:rgba(31,176,200,0.08)]">View Project</Link></CardContent></Card>)
          }) : <EmptyState title="No collaborations yet" description="Requests and accepted work will appear here." />}
        </div>
      </div>
    )
  }

  if (section === "requests") {
    const incoming = requests.filter((request) => request.receiverId === currentUser.id)
    const outgoing = requests.filter((request) => request.senderId === currentUser.id)
    return (
      <div className="space-y-6">
        <SectionHeader title="Collaboration Requests" description="Review incoming requests and track the ones you sent." />
        {notice ? <div className="rounded-2xl border border-[color:var(--border-color)] bg-white px-4 py-3 text-sm shadow-[0_8px_24px_rgba(15,23,42,0.04)]">{notice}</div> : null}
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"><CardHeader><CardTitle>Incoming</CardTitle></CardHeader><CardContent className="space-y-3">{incoming.length ? incoming.map((request) => { const sender = userService.getUser(request.senderId); const project = projects.find((item) => item.id === request.projectId); const lab = labs.find((item) => item.id === request.labId); const contextLabel = lab?.name ? `Lab: ${lab.name}` : project?.title ? `Project: ${project.title}` : "General collaboration"; return <div key={request.id} className="rounded-xl border border-[color:var(--border-color)] p-4"><div className="flex items-start justify-between gap-3"><div className="font-medium">{sender?.name || "Unknown"}</div><Badge variant="outline" className="border-transparent bg-amber-50 capitalize text-amber-700">{request.status}</Badge></div><div className="text-sm text-[color:var(--text-secondary)]">{contextLabel}</div><p className="mt-2 text-sm text-[color:var(--text-secondary)]">{request.message}</p>{request.status === "pending" ? <div className="mt-3 flex gap-2"><Button className="h-9 rounded-xl bg-[color:var(--primary-dark)] text-white" onClick={async () => { try { await collaborationService.acceptRequest(request.id, currentUser.id); setNotice("Request accepted.") } catch (error) { setNotice(error.message || "Could not accept request.") } }}>Accept</Button><Button variant="outline" className="h-9 rounded-xl" onClick={async () => { try { await collaborationService.rejectRequest(request.id, currentUser.id); setNotice("Request rejected.") } catch (error) { setNotice(error.message || "Could not reject request.") } }}>Reject</Button></div> : null}</div> }) : <EmptyState title="No collaboration requests yet" description="Incoming requests will appear here." />}</CardContent></Card>
          <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"><CardHeader><CardTitle>Outgoing</CardTitle></CardHeader><CardContent className="space-y-3">{outgoing.length ? outgoing.map((request) => { const receiver = userService.getUser(request.receiverId); const project = projects.find((item) => item.id === request.projectId); const lab = labs.find((item) => item.id === request.labId); const contextLabel = lab?.name ? `Lab: ${lab.name}` : project?.title ? `Project: ${project.title}` : "General collaboration"; return <div key={request.id} className="rounded-xl border border-[color:var(--border-color)] p-4"><div className="flex items-start justify-between gap-3"><div className="font-medium">To: {receiver?.name || "Unknown"}</div><Badge variant="outline" className="border-transparent capitalize bg-[color:rgba(31,176,200,0.12)] text-[color:var(--primary-dark)]">{request.status}</Badge></div><div className="text-sm text-[color:var(--text-secondary)]">{contextLabel}</div><p className="mt-2 text-sm text-[color:var(--text-secondary)]">{request.message}</p></div> }) : <EmptyState title="No outgoing requests" description="Requests you send will appear here." />}</CardContent></Card>
        </div>
      </div>
    )
  }

  if (section === "messages") {
    return <MessagesSection />
  }

  if (section === "tasks") {
    const visibleTasks = tasks.filter((task) => currentUser.role === "supervisor" || currentUser.role === "admin" || task.assignedTo === currentUser.id)
    const taskColumns = {
      pending: visibleTasks.filter((task) => task.status === "Todo"),
      progress: visibleTasks.filter((task) => task.status === "In Progress"),
      completed: visibleTasks.filter((task) => task.status === "Completed"),
    }

    const taskColor = (status) => {
      if (status === "Completed") return "bg-emerald-50 text-emerald-700 border-emerald-200"
      if (status === "In Progress") return "bg-cyan-50 text-cyan-700 border-cyan-200"
      return "bg-amber-50 text-amber-700 border-amber-200"
    }

    return (
      <div className="space-y-6">
        <SectionHeader title="Tasks" description="Track assigned work and create tasks for project members." />
        {canManageTasks(currentUser.role) ? (
          <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"><CardHeader><CardTitle>Create Task</CardTitle></CardHeader><CardContent><form className="grid gap-3 md:grid-cols-2" onSubmit={createTask}><Input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Title" required /><Input value={taskAssignee} onChange={(event) => setTaskAssignee(event.target.value)} placeholder="Assignee user id or email" required /><Textarea value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} placeholder="Description" className="md:col-span-2" required /><Input type="date" value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)} /><select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value)} className="h-10 rounded-xl border border-[color:var(--border-color)] px-3"><option>Low</option><option>Medium</option><option>High</option></select><div className="md:col-span-2"><Button className="rounded-xl bg-[color:var(--primary-dark)] text-white" type="submit">Create Task</Button></div></form></CardContent></Card>
        ) : null}
        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"><CardHeader><CardTitle>Pending</CardTitle></CardHeader><CardContent className="space-y-3">{taskColumns.pending.length ? taskColumns.pending.map((task) => <TaskCard key={task.id} task={task} onChange={(status) => taskService.updateTask(task.id, { status })} taskColor={taskColor} userService={userService} currentUser={currentUser} />) : <EmptyState title="No pending tasks" description="Tasks waiting to start will appear here." />}</CardContent></Card>
          <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"><CardHeader><CardTitle>In Progress</CardTitle></CardHeader><CardContent className="space-y-3">{taskColumns.progress.length ? taskColumns.progress.map((task) => <TaskCard key={task.id} task={task} onChange={(status) => taskService.updateTask(task.id, { status })} taskColor={taskColor} userService={userService} currentUser={currentUser} />) : <EmptyState title="No in-progress tasks" description="Tasks being worked on will appear here." />}</CardContent></Card>
          <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"><CardHeader><CardTitle>Completed</CardTitle></CardHeader><CardContent className="space-y-3">{taskColumns.completed.length ? taskColumns.completed.map((task) => <TaskCard key={task.id} task={task} onChange={(status) => taskService.updateTask(task.id, { status })} taskColor={taskColor} userService={userService} currentUser={currentUser} />) : <EmptyState title="No completed tasks" description="Finished tasks will appear here." />}</CardContent></Card>
        </div>
      </div>
    )
  }

  if (section === "milestones") {
    return <SimpleListSection title="Milestones" description="Track project milestones and progress." items={milestones} />
  }
  if (section === "publications") {
    return (
      <div className="space-y-6">
        <SectionHeader title="Publications" description="Manage drafts, under-review manuscripts, and published outputs." />
        <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"><CardHeader><CardTitle>Add Publication</CardTitle></CardHeader><CardContent><form className="grid gap-3 md:grid-cols-2" onSubmit={createPublication}><Input value={publicationTitle} onChange={(event) => setPublicationTitle(event.target.value)} placeholder="Title" required /><Input value={publicationVenue} onChange={(event) => setPublicationVenue(event.target.value)} placeholder="Venue" required /><Input type="number" value={publicationYear} onChange={(event) => setPublicationYear(event.target.value)} placeholder="Year" /><select value={publicationStatus} onChange={(event) => setPublicationStatus(event.target.value)} className="h-10 rounded-xl border border-[color:var(--border-color)] px-3"><option>Draft</option><option>Under Review</option><option>Published</option></select><Input value={publicationLink} onChange={(event) => setPublicationLink(event.target.value)} placeholder="Link" className="md:col-span-2" /><div className="md:col-span-2"><Button className="rounded-xl bg-[color:var(--primary-dark)] text-white" type="submit">Save Publication</Button></div></form></CardContent></Card>
        <div className="grid gap-4 xl:grid-cols-2">
          {publications.map((publication) => <Card key={publication.id} className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"><CardContent className="space-y-3 p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{publication.title}</h3><div className="text-sm text-[color:var(--text-secondary)]">{publication.venue} · {publication.year}</div></div><Badge variant="outline" className="border-transparent bg-[color:rgba(31,176,200,0.12)] text-[color:var(--primary-dark)]">{publication.status}</Badge></div><div className="flex gap-2"><Button variant="outline" className="rounded-xl" onClick={() => publicationService.deletePublication(publication.id)}>Delete</Button></div></CardContent></Card>)}
        </div>
      </div>
    )
  }

  if (section === "notifications") {
    const list = notifications.filter((notification) => notificationReadFilter === "all" ? true : notificationReadFilter === "read" ? notification.read : !notification.read)
    return (
      <div className="space-y-6">
        <SectionHeader title="Notifications" description="Collaboration requests, tasks, messages, and milestones land here." action={<Button className="rounded-xl bg-[color:var(--primary-dark)] text-white" onClick={async () => { await notificationService.markAllNotificationsRead(currentUser.id); setNotice("All notifications marked as read.") }}>Mark all read</Button>} />
        <div className="flex gap-2"><Button variant={notificationReadFilter === "all" ? "default" : "outline"} onClick={() => setNotificationReadFilter("all")}>All</Button><Button variant={notificationReadFilter === "unread" ? "default" : "outline"} onClick={() => setNotificationReadFilter("unread")}>Unread</Button><Button variant={notificationReadFilter === "read" ? "default" : "outline"} onClick={() => setNotificationReadFilter("read")}>Read</Button></div>
        <div className="space-y-3">{list.length ? list.map((notification) => (
          <div key={notification.id} className="rounded-2xl border border-[color:var(--border-color)] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{notification.title}</div>
                <div className="text-sm text-[color:var(--text-secondary)]">{notification.message}</div>
              </div>
              <Button variant="outline" onClick={async () => { await notificationService.markNotificationRead(notification.id) }}>Mark read</Button>
            </div>
            {notification.type === "request_received" && notification.relatedId && !notification.read ? (
              <div className="mt-3 flex gap-2">
                <Button className="h-9 rounded-xl bg-[color:var(--primary-dark)] text-white" onClick={async () => { try { await collaborationService.acceptRequest(notification.relatedId, currentUser.id); await notificationService.markNotificationRead(notification.id); setNotice("Request accepted.") } catch (error) { setNotice(error.message || "Could not accept request.") } }}>Accept</Button>
                <Button variant="outline" className="h-9 rounded-xl" onClick={async () => { try { await collaborationService.rejectRequest(notification.relatedId, currentUser.id); await notificationService.markNotificationRead(notification.id); setNotice("Request rejected.") } catch (error) { setNotice(error.message || "Could not reject request.") } }}>Reject</Button>
              </div>
            ) : null}
          </div>
        )) : <EmptyState title="No notifications yet" description="Incoming updates will appear here." />}</div>
      </div>
    )
  }

  if (section === "profile") {
    const incomingProfileRequests = requests.filter((request) => request.receiverId === currentUser.id && request.status === "pending")
    const myTasks = tasks.filter((task) => task.assignedTo === currentUser.id)
    return (
      <div className="space-y-6">
        <SectionHeader title="Profile" description="View and edit your university profile, research interests, and skills." action={<Link href={`/researchers/${currentUser.id}`} className="inline-flex h-10 items-center rounded-xl border border-[color:var(--border-color)] px-4 text-sm font-medium hover:bg-[color:rgba(31,176,200,0.08)]">Public Profile</Link>} />
        <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"><CardContent className="space-y-4 p-5"><div className="flex items-start gap-4"><Avatar className="size-14"><AvatarFallback className="bg-[color:rgba(11,94,215,0.08)] text-[color:var(--primary-dark)]">{currentUser.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><div><h2 className="text-xl font-semibold">{currentUser.name}</h2><div className="text-sm text-[color:var(--text-secondary)]">{currentUser.email}</div><div className="text-sm text-[color:var(--text-secondary)]">{currentUser.university} · {currentUser.department} · {currentUser.role}</div></div></div><p className="text-sm text-[color:var(--text-secondary)]">{currentUser.bio}</p><div className="flex flex-wrap gap-2">{(currentUser.researchInterests || []).map((item) => <Badge key={item} variant="outline">{item}</Badge>)}</div></CardContent></Card>
        <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"><CardHeader><CardTitle>My Assigned Tasks</CardTitle></CardHeader><CardContent className="space-y-2">{myTasks.length ? myTasks.map((task) => { const project = projects.find((item) => item.id === task.projectId); return <div key={task.id} className="rounded-xl border border-[color:var(--border-color)] p-3"><div className="font-medium">{task.title}</div><div className="text-sm text-[color:var(--text-secondary)]">{project?.title || "Project"} · {task.status} · {task.dueDate || "No due date"}</div></div> }) : <EmptyState title="No assigned tasks" description="Tasks assigned by supervisors will appear here and on your public profile." />}</CardContent></Card>
        <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <CardHeader><CardTitle>Incoming Collaboration Requests</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {incomingProfileRequests.length ? incomingProfileRequests.map((request) => {
              const sender = userService.getUser(request.senderId)
              const project = projects.find((item) => item.id === request.projectId)
              return (
                <div key={request.id} className="rounded-xl border border-[color:var(--border-color)] p-4">
                  <div className="font-medium">{sender?.name || "Unknown researcher"}</div>
                  <div className="text-sm text-[color:var(--text-secondary)]">{project?.title || "General collaboration"}</div>
                  <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{request.message}</p>
                  <div className="mt-3 flex gap-2">
                    <Button className="h-9 rounded-xl bg-[color:var(--primary-dark)] text-white" onClick={async () => { try { await collaborationService.acceptRequest(request.id, currentUser.id); setNotice("Request accepted.") } catch (error) { setNotice(error.message || "Could not accept request.") } }}>Accept</Button>
                    <Button variant="outline" className="h-9 rounded-xl" onClick={async () => { try { await collaborationService.rejectRequest(request.id, currentUser.id); setNotice("Request rejected.") } catch (error) { setNotice(error.message || "Could not reject request.") } }}>Reject</Button>
                    <Link href="/requests" className="inline-flex h-9 items-center rounded-xl border border-[color:var(--border-color)] px-3.5 text-sm font-medium hover:bg-[color:rgba(31,176,200,0.08)]">Open Requests</Link>
                  </div>
                </div>
              )
            }) : <EmptyState title="No pending requests" description="Collaboration and join requests will appear here in real time." />}
          </CardContent>
        </Card>
        <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"><CardHeader><CardTitle>Edit Profile</CardTitle></CardHeader><CardContent><form className="grid gap-3 md:grid-cols-2" onSubmit={saveProfile}><Textarea className="md:col-span-2" value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Bio" /><Input value={university} onChange={(event) => setUniversity(event.target.value)} placeholder="University" /><Input value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="Department" /><Input value={interests} onChange={(event) => setInterests(event.target.value)} placeholder="Research interests, comma separated" className="md:col-span-2" /><Input value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="Skills, comma separated" className="md:col-span-2" /><div className="md:col-span-2"><Button className="rounded-xl bg-[color:var(--primary-dark)] text-white" type="submit">Save Profile</Button></div></form></CardContent></Card>
      </div>
    )
  }

  if (section === "settings") {
    return (
      <div className="space-y-6">
        <SectionHeader title="Settings" description="Persist notification and appearance preferences locally." />
        <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"><CardContent className="space-y-4 p-5"><form className="space-y-4" onSubmit={saveSettings}><label className="flex items-center justify-between rounded-xl border border-[color:var(--border-color)] p-4"><span>Compact mode</span><input type="checkbox" checked={!!settingsDraft.appearance?.compactMode} onChange={(event) => setSettingsDraft((draft) => ({ ...draft, appearance: { ...(draft.appearance || {}), compactMode: event.target.checked } }))} /></label><label className="flex items-center justify-between rounded-xl border border-[color:var(--border-color)] p-4"><span>Theme</span><select value={settingsDraft.appearance?.theme || "light"} onChange={(event) => setSettingsDraft((draft) => ({ ...draft, appearance: { ...(draft.appearance || {}), theme: event.target.value } }))} className="rounded-lg border border-[color:var(--border-color)] px-3 py-2"><option value="light">Light</option></select></label><label className="flex items-center justify-between rounded-xl border border-[color:var(--border-color)] p-4"><span>Messages</span><input type="checkbox" checked={!!settingsDraft.notifications?.messages} onChange={(event) => setSettingsDraft((draft) => ({ ...draft, notifications: { ...(draft.notifications || {}), messages: event.target.checked } }))} /></label><Button className="rounded-xl bg-[color:var(--primary-dark)] text-white" type="submit">Save Preferences</Button></form></CardContent></Card>
      </div>
    )
  }

  if (section === "analytics") {
    return (
      <div className="space-y-6">
        <SectionHeader title="Analytics" description="Live metrics based on your stored research data." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card><CardContent className="p-5"><div className="text-sm text-[color:var(--text-secondary)]">Active Projects</div><div className="text-3xl font-semibold">{metrics.activeProjects}</div></CardContent></Card>
          <Card><CardContent className="p-5"><div className="text-sm text-[color:var(--text-secondary)]">Collaborators</div><div className="text-3xl font-semibold">{metrics.collaborators}</div></CardContent></Card>
          <Card><CardContent className="p-5"><div className="text-sm text-[color:var(--text-secondary)]">Publications</div><div className="text-3xl font-semibold">{metrics.publications}</div></CardContent></Card>
          <Card><CardContent className="p-5"><div className="text-sm text-[color:var(--text-secondary)]">Research Progress</div><div className="text-3xl font-semibold">{metrics.progress}%</div></CardContent></Card>
        </div>
      </div>
    )
  }

  if (section === "admin") {
    const roleOptions = ["author", "researcher", "admin"]
    const adminLabs = labs
    const adminProjects = projects

    return (
      <div className="space-y-6">
        <SectionHeader title="Admin" description="Manage users, project access, and platform roles." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card><CardContent className="p-5"><div className="text-sm text-[color:var(--text-secondary)]">Total Users</div><div className="text-3xl font-semibold">{metrics.totalUsers}</div></CardContent></Card>
          <Card><CardContent className="p-5"><div className="text-sm text-[color:var(--text-secondary)]">Projects</div><div className="text-3xl font-semibold">{metrics.totalProjects}</div></CardContent></Card>
          <Card><CardContent className="p-5"><div className="text-sm text-[color:var(--text-secondary)]">Labs</div><div className="text-3xl font-semibold">{metrics.totalLabs}</div></CardContent></Card>
          <Card><CardContent className="p-5"><div className="text-sm text-[color:var(--text-secondary)]">Pending Requests</div><div className="text-3xl font-semibold">{requests.filter((request) => request.status === "pending").length}</div></CardContent></Card>
        </div>

        <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <CardHeader><CardTitle>Users</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {userService.getUsers().map((user) => {
              const isActive = user.active !== false
              return (
                <div key={user.id} className="flex flex-col gap-3 rounded-xl border border-[color:var(--border-color)] p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.name}</span>
                      <Badge
                        variant={isActive ? "secondary" : "destructive"}
                        className={isActive ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-rose-100 text-rose-700 border-rose-200"}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-sm text-[color:var(--text-secondary)]">{user.email}</div>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <select
                      value={roleOptions.includes(user.role) ? user.role : "researcher"}
                      onChange={(event) => {
                        const nextRole = event.target.value
                        userService.updateUserRole(user.id, nextRole)
                        refreshUserList()
                        if (currentUser.id === user.id) {
                          setNotice(`Your role was updated to ${nextRole}.`)
                        }
                      }}
                      className="h-10 rounded-xl border border-[color:var(--border-color)] bg-white px-3 text-sm outline-none"
                    >
                      {roleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        className="bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-100 disabled:text-rose-400"
                        disabled={isActive === false}
                        onClick={() => userService.deactivateUser(user.id)}
                      >
                        Deactivate
                      </Button>
                      <Button
                        variant="default"
                        className="bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-100 disabled:text-emerald-400"
                        disabled={isActive === true}
                        onClick={() => userService.reactivateUser(user.id)}
                      >
                        Activate
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <CardHeader><CardTitle>Research Labs</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {adminLabs.length ? adminLabs.map((lab) => (
                <div key={lab.id} className="rounded-xl border border-[color:var(--border-color)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{lab.name}</div>
                      <div className="text-sm text-[color:var(--text-secondary)]">{lab.department}</div>
                    </div>
                    <Button variant="outline" onClick={() => {
                      if (window.confirm(`Delete lab "${lab.name}"?`)) {
                        labService.deleteLab(lab.id)
                      }
                    }}>Delete</Button>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{lab.description}</p>
                </div>
              )) : <EmptyState title="No labs" description="No research labs are available to manage." />}
            </CardContent>
          </Card>

          <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <CardHeader><CardTitle>Research Projects</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {adminProjects.length ? adminProjects.map((project) => (
                <div key={project.id} className="rounded-xl border border-[color:var(--border-color)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{project.title}</div>
                      <div className="text-sm text-[color:var(--text-secondary)]">{project.field}</div>
                    </div>
                    <Button variant="outline" onClick={() => {
                      if (window.confirm(`Delete project "${project.title}"?`)) {
                        projectService.deleteProject(project.id)
                      }
                    }}>Delete</Button>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{project.description}</p>
                </div>
              )) : <EmptyState title="No projects" description="No research projects are available to manage." />}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (section === "help") {
    return (
      <div className="space-y-6">
        <SectionHeader title="Help" description="Quick guidance for using the Cholo Research Kori MVP." />
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"><CardHeader><CardTitle>Getting started</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-[color:var(--text-secondary)]"><p>Use Discover Research to find projects and collaborators.</p><p>Requests, messages, tasks, milestones, and publications are stored in the live MySQL-backed workspace.</p><p>Login with the demo accounts shown on the login page.</p></CardContent></Card>
          <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"><CardHeader><CardTitle>Demo accounts</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-[color:var(--text-secondary)]"><p>Admin: admin@cholo.local / admin123</p></CardContent></Card>
        </div>
      </div>
    )
  }

  return <SimpleListSection title={section} description="Content loading..." items={[]} />
}

function SimpleListSection({ title, description, items }) {
  return (
    <div className="space-y-6">
      <SectionHeader title={title[0].toUpperCase() + title.slice(1)} description={description} />
      <div className="grid gap-4 xl:grid-cols-2">
        {items.length ? items.map((item) => <Card key={item.id} className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"><CardContent className="p-5"><div className="font-medium">{item.title || item.name}</div><div className="text-sm text-[color:var(--text-secondary)]">{item.description || item.department || item.status}</div></CardContent></Card>) : <EmptyState title={`No ${title.toLowerCase()}`} description={description} />}
      </div>
    </div>
  )
}
