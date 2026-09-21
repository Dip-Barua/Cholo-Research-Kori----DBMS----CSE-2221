"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AppProvider"
import {
  labService,
  messageService,
  projectService,
  taskService,
  milestoneService,
  userService,
  collaborationService,
} from "@/lib/services"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

function connectionLabel(state) {
  if (state === "pending_outgoing") return "Request sent"
  if (state === "pending_incoming") return "Respond in Requests"
  if (state === "connected" || state === "member") return "Connected"
  if (state === "rejected_outgoing") return "Request declined"
  return "Collaborate"
}

function connectionDisabled(state) {
  return state === "pending_outgoing" || state === "connected" || state === "member" || state === "self"
}

export default function DetailPage({ section, id: idProp }) {
  const params = useParams()
  const router = useRouter()
  const { currentUser, dbVersion } = useAuth()
  const entityId = idProp || params?.id

  const [message, setMessage] = useState("")
  const [taskTitle, setTaskTitle] = useState("")
  const [taskAssignee, setTaskAssignee] = useState("")
  const [taskDueDate, setTaskDueDate] = useState("")
  const [milestoneTitle, setMilestoneTitle] = useState("")
  const [milestoneDueDate, setMilestoneDueDate] = useState("")
  const [collaborateMessage, setCollaborateMessage] = useState("Interested in collaborating on a research project.")
  const [notice, setNotice] = useState("")
  const [labMemberSearch, setLabMemberSearch] = useState("")
  const [labMemberResults, setLabMemberResults] = useState([])

  const requests = useMemo(() => collaborationService.getResearchRequests(), [dbVersion])
  const projects = useMemo(() => projectService.getProjects(), [dbVersion])

  if (!currentUser) {
    return <Card><CardContent className="p-6">Loading profile...</CardContent></Card>
  }

  if (!entityId) {
    return <Card><CardContent className="p-6">Missing record id.</CardContent></Card>
  }

  if (section === "projects") {
    const project = projectService.getProject(entityId)
    if (!project) return <Card><CardContent className="p-6">Project not found.</CardContent></Card>
    const supervisor = userService.getUser(project.supervisorId)
    const members = project.memberIds.map((memberId) => userService.getUser(memberId)).filter(Boolean)
    const projectTasks = taskService.getTasks().filter((task) => task.projectId === project.id)
    const projectMilestones = milestoneService.getMilestones().filter((milestone) => milestone.projectId === project.id)
    const joinState = collaborationService.getConnectionState({
      viewerId: currentUser.id,
      targetId: project.supervisorId,
      projectId: project.id,
    })
    const projectChat = messageService.getConversations(currentUser.id).find((conversation) => conversation.type === "project" && conversation.projectId === project.id)
    const parentLab = project.labId ? labService.getLab(project.labId) : null

    return (
      <div className="space-y-6">
        <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"><CardHeader><CardTitle>{project.title}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="text-sm text-[color:var(--text-secondary)]">Supervisor: {supervisor ? <Link href={`/researchers/${supervisor.id}`} className="font-medium text-[color:var(--primary-dark)] hover:underline">{supervisor.name}</Link> : "Unknown"}</div>{parentLab ? <div className="text-sm text-[color:var(--text-secondary)]">Research lab: <Link href={`/labs/${parentLab.id}`} className="font-medium text-[color:var(--primary-dark)] hover:underline">{parentLab.name}</Link></div> : null}<p className="text-sm text-[color:var(--text-secondary)]">{project.description}</p><Progress value={project.progress} /><div className="flex flex-wrap gap-2">{project.skills.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}</div><div className="flex flex-wrap gap-2">{joinState === "member" && projectChat ? <Link href={`/messages?conversation=${projectChat.id}`} className="inline-flex h-9 items-center rounded-xl bg-[color:var(--primary-dark)] px-3.5 text-sm font-medium text-white">Open Project Chat</Link> : null}{joinState !== "member" ? <Button disabled={connectionDisabled(joinState)} className="h-9 rounded-xl bg-[color:var(--primary-dark)] text-white disabled:opacity-60" onClick={async () => { try { await collaborationService.sendProjectJoinRequest({ senderId: currentUser.id, projectId: project.id, message: `I would like to join ${project.title}.` }); setNotice("Join request sent to the project supervisor.") } catch (error) { setNotice(error.message || "Could not send join request.") } }}>{joinState === "pending_outgoing" ? "Waiting for approval" : "Request to Join Project"}</Button> : null}</div></CardContent></Card>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>Members</CardTitle></CardHeader><CardContent className="space-y-2">{members.map((member) => <Link key={member.id} href={`/researchers/${member.id}`} className="block rounded-xl border border-[color:var(--border-color)] p-3 hover:bg-[color:rgba(31,176,200,0.08)]">{member.name} · {member.role}</Link>)}</CardContent></Card>
          {(project.supervisorId === currentUser.id || currentUser.role === "admin") ? (
            <Card>
              <CardHeader><CardTitle>Add Project Member</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Search by name or email" value={labMemberSearch} onChange={(e) => { setLabMemberSearch(e.target.value); setLabMemberResults(userService.searchUsers(e.target.value, { excludeUserId: currentUser.id })) }} />
                {labMemberResults.length ? (
                  <div className="space-y-2">
                    {labMemberResults.map((user) => (
                      <div key={user.id} className="flex items-center justify-between rounded-xl border border-[color:var(--border-color)] p-3">
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-[color:var(--text-secondary)]">{user.email}</div>
                        </div>
                        <Button className="rounded-xl bg-[color:var(--primary-dark)] text-white" onClick={async () => { try { await projectService.addProjectMember(project.id, user.id); setNotice(`${user.name} was added to ${project.title}.`); setLabMemberSearch(""); setLabMemberResults([]) } catch (error) { setNotice(error.message || "Could not add member.") } }}>Add</Button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
          <Card><CardHeader><CardTitle>Discussion</CardTitle></CardHeader><CardContent className="space-y-3"><Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Add a project update..." /><Button className="rounded-xl bg-[color:var(--primary-dark)] text-white" onClick={() => { if (!message.trim()) return; messageService.sendMessage({ senderId: currentUser.id, receiverId: project.supervisorId, content: message }); setMessage("") }}>Post</Button></CardContent></Card>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>Tasks</CardTitle></CardHeader><CardContent className="space-y-2">{projectTasks.map((task) => <div key={task.id} className="rounded-xl border border-[color:var(--border-color)] p-3"><div className="font-medium">{task.title}</div><div className="text-sm text-[color:var(--text-secondary)]">{task.status} · {task.dueDate}</div></div>)}{!projectTasks.length ? <div className="text-sm text-[color:var(--text-secondary)]">No tasks yet.</div> : null}</CardContent></Card>
          <Card><CardHeader><CardTitle>Milestones</CardTitle></CardHeader><CardContent className="space-y-2">{projectMilestones.map((milestone) => <div key={milestone.id} className="rounded-xl border border-[color:var(--border-color)] p-3"><div className="font-medium">{milestone.title}</div><div className="text-sm text-[color:var(--text-secondary)]">{milestone.status} · {milestone.dueDate}</div></div>)}{!projectMilestones.length ? <div className="text-sm text-[color:var(--text-secondary)]">No milestones yet.</div> : null}</CardContent></Card>
        </div>
        {(project.supervisorId === currentUser.id || currentUser.role === "admin") ? <Card><CardHeader><CardTitle>Create Task / Milestone</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Task title" /><Input value={taskAssignee} onChange={(event) => setTaskAssignee(event.target.value)} placeholder="Assignee user id or email" /><Input type="date" value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)} /><Button className="rounded-xl bg-[color:var(--primary-dark)] text-white" onClick={() => { const assignee = userService.getUsers().find((user) => user.id === taskAssignee || user.email === taskAssignee); if (!assignee || !taskTitle) return; taskService.createTask({ projectId: project.id, assignedTo: assignee.id, title: taskTitle, description: taskTitle, priority: "Medium", status: "Todo", dueDate: taskDueDate }, currentUser.id); setTaskTitle("") }}>Create Task</Button></div><div className="space-y-2"><Input value={milestoneTitle} onChange={(event) => setMilestoneTitle(event.target.value)} placeholder="Milestone title" /><Input type="date" value={milestoneDueDate} onChange={(event) => setMilestoneDueDate(event.target.value)} /><Button className="rounded-xl bg-[color:var(--primary-dark)] text-white" onClick={() => { if (!milestoneTitle) return; milestoneService.createMilestone({ projectId: project.id, title: milestoneTitle, description: milestoneTitle, dueDate: milestoneDueDate, status: "Todo", progress: 0 }, currentUser.id); setMilestoneTitle("") }}>Create Milestone</Button></div></CardContent></Card> : null}
      </div>
    )
  }

  if (section === "labs") {
    const lab = labService.getLab(entityId)
    if (!lab) return <Card><CardContent className="p-6">Lab not found.</CardContent></Card>
    const admin = userService.getUser(lab.supervisorId)
    const members = (lab.memberIds || []).map((memberId) => userService.getUser(memberId)).filter(Boolean)
    const joinState = collaborationService.getConnectionState({ viewerId: currentUser.id, labId: lab.id })
    const labChat = messageService.getConversations(currentUser.id).find((conversation) => conversation.type === "lab" && conversation.labId === lab.id)
    const isLabAdmin = lab.supervisorId === currentUser.id || currentUser.role === "admin"
    const labProjects = projects.filter((project) => project.labId === lab.id || (lab.projectIds || []).includes(project.id))

    return (
      <div className="space-y-6">
        {notice ? <div className="rounded-2xl border border-[color:var(--border-color)] bg-white px-4 py-3 text-sm">{notice}</div> : null}
        <Card><CardHeader><CardTitle>{lab.name}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="text-sm text-[color:var(--text-secondary)]">Lab admin: {admin?.name || "Unknown"} · {lab.department}</div><p>{lab.description}</p><div className="flex flex-wrap gap-2">{lab.researchAreas.map((area) => <Badge key={area} variant="outline">{area}</Badge>)}</div><div className="flex flex-wrap gap-2">{joinState === "member" && labChat ? <Link href={`/messages?conversation=${labChat.id}`} className="inline-flex h-9 items-center rounded-xl bg-[color:var(--primary-dark)] px-3.5 text-sm font-medium text-white">Open Lab Chat</Link> : null}{!isLabAdmin && joinState !== "member" ? <Button disabled={connectionDisabled(joinState)} className="h-9 rounded-xl bg-[color:var(--primary-dark)] text-white disabled:opacity-60" onClick={async () => { try { await collaborationService.sendLabJoinRequest({ senderId: currentUser.id, labId: lab.id, message: `I would like to join ${lab.name}.` }); setNotice("Join request sent to the lab admin.") } catch (error) { setNotice(error.message || "Could not send lab join request.") } }}>{joinState === "pending_outgoing" ? "Waiting for approval" : "Request to Join Lab"}</Button> : null}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Lab Members</CardTitle></CardHeader><CardContent className="space-y-2">{members.map((member) => <Link key={member.id} href={`/researchers/${member.id}`} className="block rounded-xl border border-[color:var(--border-color)] p-3 hover:bg-[color:rgba(31,176,200,0.08)]">{member.name} · {member.role}</Link>)}</CardContent></Card>
        {isLabAdmin ? (
          <Card>
            <CardHeader><CardTitle>Add Lab Member</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input value={labMemberSearch} onChange={(event) => { setLabMemberSearch(event.target.value); setLabMemberResults(userService.searchUsers(event.target.value, { excludeUserId: currentUser.id })) }} placeholder="Search by name or email" />
              {labMemberResults.length ? (
                <div className="space-y-2">
                  {labMemberResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between rounded-xl border border-[color:var(--border-color)] p-3">
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-[color:var(--text-secondary)]">{user.email}</div>
                      </div>
                      <Button className="rounded-xl bg-[color:var(--primary-dark)] text-white" onClick={() => { try { labService.addLabMember(lab.id, user.id, currentUser.id); setNotice(`${user.name} was added to ${lab.name}.`); setLabMemberSearch(""); setLabMemberResults([]) } catch (error) { setNotice(error.message || "Could not add member.") } }}>Add</Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
        <Card><CardHeader><CardTitle>Lab Projects</CardTitle></CardHeader><CardContent className="space-y-2">{labProjects.length ? labProjects.map((project) => <Link key={project.id} href={`/projects/${project.id}`} className="block rounded-xl border border-[color:var(--border-color)] p-3 hover:bg-[color:rgba(31,176,200,0.08)]">{project.title} · {project.status}</Link>) : <div className="text-sm text-[color:var(--text-secondary)]">No projects under this lab yet.</div>}</CardContent></Card>
      </div>
    )
  }

  if (section === "researchers") {
    const user = userService.getUser(entityId)
    if (!user) {
      return (
        <Card>
          <CardContent className="space-y-3 p-6">
            <div>Researcher not found.</div>
            <Button variant="outline" className="rounded-xl" onClick={() => router.push("/researchers")}>Back to Researchers</Button>
          </CardContent>
        </Card>
      )
    }

    const isSelf = user.id === currentUser.id
    const connectionState = collaborationService.getConnectionState({
      viewerId: currentUser.id,
      targetId: user.id,
      projectId: null,
    })
    const incomingRequests = requests.filter((request) => request.receiverId === user.id && request.status === "pending")
    const userProjects = projects.filter((project) => project.memberIds.includes(user.id) || project.supervisorId === user.id)
    const assignedTasks = taskService.getTasks().filter((task) => task.assignedTo === user.id)
    const connected = userService.isConnected(currentUser.id, user.id)

    const sendCollaboration = async () => {
      try {
        await collaborationService.sendCollaborationRequest({
          senderId: currentUser.id,
          receiverId: user.id,
          message: collaborateMessage.trim() || "Interested in collaborating.",
        })
        setNotice(`Collaboration request sent to ${user.name}.`)
      } catch (error) {
        setNotice(error.message || "Could not send request.")
      }
    }

    const respondToRequest = async (requestId, action) => {
      try {
        if (action === "accept") await collaborationService.acceptRequest(requestId, currentUser.id)
        else await collaborationService.rejectRequest(requestId, currentUser.id)
        setNotice(action === "accept" ? "Request accepted." : "Request rejected.")
      } catch (error) {
        setNotice(error.message || "Could not update request.")
      }
    }

    return (
      <div className="space-y-6">
        {notice ? <div className="rounded-2xl border border-[color:var(--border-color)] bg-white px-4 py-3 text-sm shadow-[0_8px_24px_rgba(15,23,42,0.04)]">{notice}</div> : null}
        <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <Avatar className="size-14"><AvatarFallback className="bg-[color:rgba(11,94,215,0.08)] text-[color:var(--primary-dark)]">{(user.name || "CR").slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                <div>
                  <h1 className="text-2xl font-semibold">{user.name}</h1>
                  <div className="text-sm text-[color:var(--text-secondary)]">{user.role} · {user.department}</div>
                  <div className="text-sm text-[color:var(--text-secondary)]">{user.university}</div>
                  <div className="text-sm text-[color:var(--text-secondary)]">{user.email}</div>
                </div>
              </div>
              {!isSelf ? (
                <Badge variant="outline" className="border-transparent bg-[color:rgba(31,176,200,0.12)] text-[color:var(--primary-dark)]">{connectionLabel(connectionState)}</Badge>
              ) : null}
            </div>
            <p className="text-sm text-[color:var(--text-secondary)]">{user.bio || "No bio added yet."}</p>
            <div className="flex flex-wrap gap-2">{(user.researchInterests || []).map((item) => <Badge key={item} variant="outline">{item}</Badge>)}</div>
            <div className="flex flex-wrap gap-2">{(user.skills || []).map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}</div>
            {!isSelf ? (
              <div className="space-y-3 rounded-2xl border border-[color:var(--border-color)] p-4">
                {connected || connectionState === "connected" ? (
                  <div className="flex flex-wrap gap-2">
                    <Button className="rounded-xl bg-[color:var(--primary-dark)] text-white" onClick={() => router.push(`/messages?userId=${user.id}`)}>Send Message</Button>
                    <Button variant="outline" className="rounded-xl" onClick={() => router.push("/researchers")}>Back</Button>
                  </div>
                ) : (
                  <>
                    <Textarea value={collaborateMessage} onChange={(event) => setCollaborateMessage(event.target.value)} placeholder="Write a short collaboration message..." />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        className="rounded-xl bg-[color:var(--primary-dark)] text-white disabled:opacity-60"
                        disabled={connectionDisabled(connectionState)}
                        onClick={sendCollaboration}
                      >
                        {connectionLabel(connectionState)}
                      </Button>
                      <Button variant="outline" className="rounded-xl" onClick={() => router.push("/researchers")}>Back</Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <Button className="rounded-xl bg-[color:var(--primary-dark)] text-white" onClick={() => router.push("/profile")}>Edit Profile</Button>
                <Button variant="outline" className="rounded-xl" onClick={() => router.back()}>Back</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {isSelf && incomingRequests.length ? (
          <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <CardHeader><CardTitle>Incoming Collaboration Requests</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {incomingRequests.map((request) => {
                const sender = userService.getUser(request.senderId)
                const project = projects.find((item) => item.id === request.projectId)
                return (
                  <div key={request.id} className="rounded-xl border border-[color:var(--border-color)] p-4">
                    <div className="font-medium">{sender?.name || "Unknown researcher"}</div>
                    <div className="text-sm text-[color:var(--text-secondary)]">{request.labId ? `${labService.getLab(request.labId)?.name || "Lab"} join request` : project?.title || "General collaboration"}</div>
                    <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{request.message}</p>
                    <div className="mt-3 flex gap-2">
                      <Button className="h-9 rounded-xl bg-[color:var(--primary-dark)] text-white" onClick={() => respondToRequest(request.id, "accept")}>Accept</Button>
                      <Button variant="outline" className="h-9 rounded-xl" onClick={() => respondToRequest(request.id, "reject")}>Reject</Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <CardHeader><CardTitle>Research Projects</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {userProjects.length ? userProjects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="block rounded-xl border border-[color:var(--border-color)] p-3 hover:bg-[color:rgba(31,176,200,0.08)]">
                <div className="font-medium">{project.title}</div>
                <div className="text-sm text-[color:var(--text-secondary)]">{project.field} · {project.status}</div>
              </Link>
            )) : <div className="text-sm text-[color:var(--text-secondary)]">No linked projects yet.</div>}
          </CardContent>
        </Card>
        <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <CardHeader><CardTitle>Assigned Tasks</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {assignedTasks.length ? assignedTasks.map((task) => {
              const taskProject = projects.find((project) => project.id === task.projectId)
              return (
                <div key={task.id} className="rounded-xl border border-[color:var(--border-color)] p-3">
                  <div className="font-medium">{task.title}</div>
                  <div className="text-sm text-[color:var(--text-secondary)]">{taskProject?.title || "Project"} · {task.status} · Due {task.dueDate || "N/A"}</div>
                </div>
              )
            }) : <div className="text-sm text-[color:var(--text-secondary)]">No assigned tasks yet.</div>}
          </CardContent>
        </Card>
      </div>
    )
  }

  return <Card><CardContent className="p-6">Not found.</CardContent></Card>
}
