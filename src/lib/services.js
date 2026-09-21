import {
  acceptRequestOnState,
  rejectRequestOnState,
  sendCollaborationRequestOnState,
} from "@/lib/collaboration-mutations"
import { getConnectedUserIds, isConnected } from "@/lib/connections"
import {
  ensureDirectConversation,
  ensureLabConversation,
  ensureProjectConversation,
  sendMessageOnState,
} from "@/lib/message-mutations"
import {
  clearSession,
  getDatabase,
  getSession,
  hydrateDatabase,
  isBrowser,
  nowIso,
  setDatabase,
  setSession,
  updateDatabase,
} from "@/lib/storage/storage"

async function applyCollaborationResponse(response) {
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || "Collaboration request failed")
  }
  if (data.state) {
    hydrateDatabase(data.state)
  }
  return data
}

async function applyMessageResponse(response) {
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || "Message failed")
  }
  if (data.state) {
    hydrateDatabase(data.state)
  }
  return data
}

async function applyStateResponse(response, errorMessage = "Request failed") {
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || errorMessage)
  }
  if (data.state) {
    hydrateDatabase(data.state)
  }
  return data
}

const clone = (value) => JSON.parse(JSON.stringify(value))

const idFrom = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`

function getUserById(db, userId) {
  return db.users.find((user) => user.id === userId) || null
}

function getCurrentUser() {
  const db = getDatabase()
  const session = getSession()
  return session.currentUserId ? getUserById(db, session.currentUserId) : null
}

function getUsers() {
  return clone(getDatabase().users)
}

function getConnectedUsers(userId) {
  const ids = getConnectedUserIds(getDatabase, userId)
  return ids.map((id) => getUser(id)).filter(Boolean)
}

function getUser(userId) {
  return clone(getUserById(getDatabase(), userId))
}

function updateProfile(userId, updates) {
  return updateDatabase((db) => {
    const index = db.users.findIndex((user) => user.id === userId)
    if (index < 0) throw new Error("User not found")
    const nextUser = {
      ...db.users[index],
      ...updates,
      skills: Array.isArray(updates.skills) ? updates.skills : db.users[index].skills,
      researchInterests: Array.isArray(updates.researchInterests) ? updates.researchInterests : db.users[index].researchInterests,
    }
    db.users[index] = nextUser
    return db
  })
}

function login({ email, password }) {
  const db = getDatabase()
  const user = db.users.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password && item.active !== false)
  if (!user) throw new Error("Invalid email or password")
  setSession({ currentUserId: user.id })
  return clone(user)
}

function register(payload) {
  const db = getDatabase()
  const duplicate = db.users.some((user) => user.email.toLowerCase() === payload.email.toLowerCase())
  if (duplicate) throw new Error("An account with this email already exists")

  const user = {
    id: idFrom("user"),
    name: payload.name,
    email: payload.email,
    password: payload.password,
    university: payload.university,
    department: payload.department,
    role: payload.role,
    bio: "",
    researchInterests: [],
    skills: [],
    avatarSeed: payload.name.slice(0, 2).toUpperCase(),
    joinedAt: nowIso(),
    active: true,
  }

  updateDatabase((draft) => {
    draft.users.push(user)
    draft.settings[user.id] = {
      notifications: {
        collaborationRequests: true,
        projectUpdates: true,
        messages: true,
        milestones: true,
      },
      appearance: { compactMode: false, theme: "light" },
    }
    return draft
  }, "create")

  setSession({ currentUserId: user.id })
  return clone(user)
}

function logout() {
  clearSession()
}

function getProjects() {
  return clone(getDatabase().projects)
}

function getProject(projectId) {
  return clone(getDatabase().projects.find((project) => project.id === projectId) || null)
}

function createProject(payload, actorId) {
  if (isBrowser()) {
    return (async () => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      })
      const data = await applyStateResponse(response, "Could not create project")
      return clone(data.project)
    })()
  }

  if (!payload.labId) {
    throw new Error("Select a research lab for this project")
  }

  const lab = getDatabase().labs.find((item) => item.id === payload.labId)
  if (!lab) throw new Error("Lab not found")
  if (lab.supervisorId !== actorId && getUserById(getDatabase(), actorId)?.role !== "admin") {
    throw new Error("Only the lab admin can create projects under this lab")
  }

  const project = {
    id: idFrom("project"),
    title: payload.title,
    description: payload.description,
    supervisorId: actorId,
    memberIds: [actorId],
    field: payload.field,
    skills: payload.skills,
    status: "Recruiting",
    progress: 0,
    startDate: payload.startDate,
    endDate: payload.endDate,
    createdAt: nowIso(),
    labId: payload.labId,
    maxMembers: payload.maxMembers,
  }

  updateDatabase((draft) => {
    draft.projects.push(project)
    const linkedLab = draft.labs.find((item) => item.id === payload.labId)
    if (linkedLab) {
      linkedLab.projectIds = linkedLab.projectIds || []
      if (!linkedLab.projectIds.includes(project.id)) {
        linkedLab.projectIds.push(project.id)
      }
    }
    ensureProjectConversation(draft, project.id)
    return draft
  }, "create")

  return clone(project)
}

function updateProject(projectId, updates) {
  return updateDatabase((draft) => {
    const index = draft.projects.findIndex((project) => project.id === projectId)
    if (index < 0) throw new Error("Project not found")
    draft.projects[index] = {
      ...draft.projects[index],
      ...updates,
      memberIds: updates.memberIds || draft.projects[index].memberIds,
      skills: updates.skills || draft.projects[index].skills,
    }
    return draft
  })
}

function addProjectMember(projectId, userId) {
  if (isBrowser()) {
    return (async () => {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ userId }),
      })
      const data = await applyStateResponse(response, "Could not add project member")
      return clone(data.project)
    })()
  }

  updateDatabase((draft) => {
    const project = draft.projects.find((item) => item.id === projectId)
    if (!project) throw new Error("Project not found")
    if (!project.memberIds.includes(userId)) {
      project.memberIds.push(userId)
    }
    return draft
  })
}

function getLabs() {
  return clone(getDatabase().labs)
}

function getLab(labId) {
  return clone(getDatabase().labs.find((lab) => lab.id === labId) || null)
}

function createLab(payload, actorId) {
  if (isBrowser()) {
    return (async () => {
      const response = await fetch("/api/labs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      })
      const data = await applyStateResponse(response, "Could not create lab")
      return clone(data.lab)
    })()
  }

  const extraMembers = Array.isArray(payload.memberIds)
    ? payload.memberIds.filter((memberId) => memberId && memberId !== actorId)
    : []
  const memberIds = Array.from(new Set([actorId, ...extraMembers]))

  const lab = {
    id: idFrom("lab"),
    name: payload.name,
    supervisorId: actorId,
    department: payload.department,
    description: payload.description,
    researchAreas: payload.researchAreas,
    memberIds,
    projectIds: [],
    openProjects: 0,
    createdAt: nowIso(),
  }

  updateDatabase((draft) => {
    draft.labs.push(lab)
    ensureLabConversation(draft, lab.id)
    memberIds.forEach((memberId) => {
      if (memberId === actorId) return
      draft.notifications.unshift({
        id: idFrom("notification"),
        userId: memberId,
        type: "lab_invite",
        title: "Added to research lab",
        message: `You were added to ${lab.name}.`,
        read: false,
        relatedId: lab.id,
        href: `/labs/${lab.id}`,
        createdAt: nowIso(),
      })
    })
    return draft
  }, "create")

  return clone(lab)
}

function addLabMember(labId, userId, actorId) {
  const lab = getLab(labId)
  if (!lab) throw new Error("Lab not found")
  if (lab.supervisorId !== actorId && getUserById(getDatabase(), actorId)?.role !== "admin") {
    throw new Error("Only the lab admin can add members")
  }
  if (!getUser(userId)) throw new Error("User not found")
  if ((lab.memberIds || []).includes(userId)) {
    return lab
  }

  if (isBrowser()) {
    return (async () => {
      const response = await fetch(`/api/labs/${encodeURIComponent(labId)}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ userId }),
      })
      const data = await applyStateResponse(response, "Could not add lab member")
      return clone(data.lab)
    })()
  }

  updateDatabase((draft) => {
    const targetLab = draft.labs.find((item) => item.id === labId)
    if (!targetLab) throw new Error("Lab not found")
    targetLab.memberIds = targetLab.memberIds || []
    targetLab.memberIds.push(userId)
    const conversation = ensureLabConversation(draft, labId)
    if (!conversation.participantIds.includes(userId)) {
      conversation.participantIds.push(userId)
    }
    draft.notifications.unshift({
      id: idFrom("notification"),
      userId,
      type: "lab_invite",
      title: "Added to research lab",
      message: `You were added to ${targetLab.name}.`,
      read: false,
      relatedId: labId,
      href: `/labs/${labId}`,
      createdAt: nowIso(),
    })
    return draft
  })

  return getLab(labId)
}

function searchUsers(query, { excludeUserId = null, limit = 8 } = {}) {
  const normalized = String(query || "").trim().toLowerCase()
  if (!normalized) return []
  return getDatabase().users
    .filter((user) => user.active !== false && user.id !== excludeUserId)
    .filter((user) => [user.name, user.email, user.department, user.role].join(" ").toLowerCase().includes(normalized))
    .slice(0, limit)
    .map((user) => clone(user))
}

function getManagedLabs(userId) {
  return clone(getDatabase().labs.filter((lab) => lab.supervisorId === userId))
}

function getResearchRequests() {
  return clone(getDatabase().collaborationRequests)
}

function findCollaborationRequest({ senderId, receiverId, projectId = null, labId = null }) {
  return getDatabase().collaborationRequests.find((request) => {
    if (request.senderId !== senderId || request.receiverId !== receiverId) return false
    if ((request.projectId ?? null) !== (projectId ?? null)) return false
    if ((request.labId ?? null) !== (labId ?? null)) return false
    return true
  }) || null
}

function getConnectionState({ viewerId, targetId, projectId = null, labId = null }) {
  const db = getDatabase()

  if (labId) {
    const lab = db.labs.find((item) => item.id === labId)
    if (!lab) return "unknown"
    if ((lab.memberIds || []).includes(viewerId) || lab.supervisorId === viewerId) return "member"
    const outgoing = db.collaborationRequests.find(
      (request) => request.senderId === viewerId && request.labId === labId && request.status === "pending",
    )
    if (outgoing) return "pending_outgoing"
    const rejected = db.collaborationRequests.find(
      (request) => request.senderId === viewerId && request.labId === labId && request.status === "rejected",
    )
    if (rejected) return "rejected_outgoing"
    return "none"
  }

  if (projectId) {
    const project = db.projects.find((item) => item.id === projectId)
    if (!project) return "unknown"
    if ((project.memberIds || []).includes(viewerId) || project.supervisorId === viewerId) return "member"
    const outgoing = db.collaborationRequests.find(
      (request) => request.senderId === viewerId && request.projectId === projectId && request.status === "pending",
    )
    if (outgoing) return "pending_outgoing"
    const rejected = db.collaborationRequests.find(
      (request) => request.senderId === viewerId && request.projectId === projectId && request.status === "rejected",
    )
    if (rejected) return "rejected_outgoing"
    return "none"
  }

  if (!viewerId || !targetId) return "unknown"
  if (viewerId === targetId) return "self"

  if (isConnected(getDatabase, viewerId, targetId)) return "connected"

  const outgoing = findCollaborationRequest({ senderId: viewerId, receiverId: targetId, projectId: null, labId: null })
  if (outgoing?.status === "pending") return "pending_outgoing"
  if (outgoing?.status === "accepted") return "connected"
  if (outgoing?.status === "rejected") return "rejected_outgoing"

  const incoming = findCollaborationRequest({ senderId: targetId, receiverId: viewerId, projectId: null, labId: null })
  if (incoming?.status === "pending") return "pending_incoming"

  return "none"
}

async function sendCollaborationRequest({ senderId, receiverId, projectId = null, labId = null, message }) {
  if (isBrowser()) {
    const response = await fetch("/api/collaboration/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ receiverId, projectId, labId, message }),
    })
    const data = await applyCollaborationResponse(response)
    return clone(data.request)
  }

  let createdRequest = null
  updateDatabase((draft) => {
    createdRequest = sendCollaborationRequestOnState(draft, { senderId, receiverId, projectId, labId, message })
    return draft
  }, "create")

  return clone(createdRequest)
}

async function sendLabJoinRequest({ senderId, labId, message }) {
  const lab = getLab(labId)
  if (!lab) throw new Error("Lab not found")
  return sendCollaborationRequest({
    senderId,
    receiverId: lab.supervisorId,
    labId,
    projectId: null,
    message,
  })
}

async function sendProjectJoinRequest({ senderId, projectId, message }) {
  const project = getProject(projectId)
  if (!project) throw new Error("Project not found")
  return sendCollaborationRequest({
    senderId,
    receiverId: project.supervisorId,
    projectId,
    labId: null,
    message,
  })
}

async function acceptRequest(requestId, actorId) {
  if (isBrowser()) {
    const response = await fetch(`/api/collaboration/requests/${requestId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ action: "accept" }),
    })
    await applyCollaborationResponse(response)
    return true
  }

  return updateDatabase((draft) => {
    acceptRequestOnState(draft, requestId, actorId)
    return draft
  })
}

async function rejectRequest(requestId, actorId) {
  if (isBrowser()) {
    const response = await fetch(`/api/collaboration/requests/${requestId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ action: "reject" }),
    })
    await applyCollaborationResponse(response)
    return true
  }

  return updateDatabase((draft) => {
    rejectRequestOnState(draft, requestId, actorId)
    return draft
  })
}

function getCollaborations() {
  return clone(getDatabase().collaborations)
}

function getConversations(userId) {
  const db = getDatabase()
  return clone(db.conversations.filter((conversation) => conversation.participantIds.includes(userId)))
}

function getConversationByParticipants(participantIds) {
  const sortedKey = [...participantIds].sort().join(":")
  return getDatabase().conversations.find((conversation) => {
    if (conversation.type && conversation.type !== "direct") return false
    return [...conversation.participantIds].sort().join(":") === sortedKey
  }) || null
}

function getConversationMessages(conversationId) {
  return clone(getDatabase().messages.filter((message) => message.conversationId === conversationId))
}

function getDirectConversation(userId, otherUserId) {
  return clone(getConversationByParticipants([userId, otherUserId]))
}

function openProjectChat(projectId) {
  return updateDatabase((draft) => {
    ensureProjectConversation(draft, projectId)
    return draft
  })
}

function openLabChat(labId) {
  return updateDatabase((draft) => {
    ensureLabConversation(draft, labId)
    return draft
  })
}

async function sendMessage({ senderId, receiverId, content, conversationId = null }) {
  if (isBrowser()) {
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ content, receiverId, conversationId }),
    })
    const data = await applyMessageResponse(response)
    return clone(data.message)
  }

  let createdMessage = null
  updateDatabase((draft) => {
    const result = sendMessageOnState(draft, { senderId, receiverId, content, conversationId })
    createdMessage = result.message
    return draft
  }, "create")

  return clone(createdMessage)
}

async function startDirectMessage({ senderId, receiverId, content }) {
  return sendMessage({ senderId, receiverId, content })
}

async function ensureDirectChat(userId, otherUserId) {
  if (isBrowser()) {
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ type: "direct", otherUserId }),
    })
    const data = await applyStateResponse(response, "Could not open conversation")
    return clone(data.conversation)
  }

  // Server-side (non-browser) path: ensure the conversation exists and return it
  let createdConversation = null
  updateDatabase((draft) => {
    createdConversation = ensureDirectConversation(draft, userId, otherUserId)
    return draft
  })

  return clone(createdConversation)
}

async function ensureGroupChat({ type, projectId = null, labId = null }) {
  if (isBrowser()) {
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ type, projectId, labId }),
    })
    const data = await applyStateResponse(response, "Could not open group chat")
    return clone(data.conversation)
  }

  // Server-side (non-browser) path: create and return the group conversation
  let createdConversation = null
  updateDatabase((draft) => {
    if (type === "project") createdConversation = ensureProjectConversation(draft, projectId)
    if (type === "lab") createdConversation = ensureLabConversation(draft, labId)
    return draft
  })

  return clone(createdConversation)
}

function markConversationMessagesRead(conversationId, userId) {
  updateDatabase((draft) => {
    draft.messages.forEach((message) => {
      if (message.conversationId === conversationId && message.receiverId === userId) {
        message.read = true
      }
    })
    return draft
  })
}

function getTasks() {
  return clone(getDatabase().tasks)
}

function createTask(payload, actorId) {
  const task = {
    id: idFrom("task"),
    projectId: payload.projectId,
    assignedTo: payload.assignedTo,
    createdBy: actorId,
    title: payload.title,
    description: payload.description,
    priority: payload.priority,
    status: payload.status || "Todo",
    dueDate: payload.dueDate,
    createdAt: nowIso(),
  }

  updateDatabase((draft) => {
    draft.tasks.unshift(task)
    draft.notifications.unshift({
      id: idFrom("notification"),
      userId: payload.assignedTo,
      type: "task_assigned",
      title: "New task assigned",
      message: task.title,
      read: false,
      relatedId: task.id,
      href: "/tasks",
      createdAt: nowIso(),
    })
    return draft
  }, "create")

  return clone(task)
}

function updateTask(taskId, updates) {
  return updateDatabase((draft) => {
    const task = draft.tasks.find((item) => item.id === taskId)
    if (!task) throw new Error("Task not found")
    Object.assign(task, updates)
    if (task.assignedTo) {
      draft.notifications.unshift({
        id: idFrom("notification"),
        userId: task.assignedTo,
        type: "task_updated",
        title: "Task updated",
        message: task.title,
        read: false,
        relatedId: task.id,
        href: "/tasks",
        createdAt: nowIso(),
      })
    }
    return draft
  })
}

function getMilestones() {
  return clone(getDatabase().milestones)
}

function createMilestone(payload, actorId) {
  const milestone = {
    id: idFrom("milestone"),
    projectId: payload.projectId,
    title: payload.title,
    description: payload.description,
    dueDate: payload.dueDate,
    status: payload.status || "Todo",
    progress: payload.progress || 0,
    createdBy: actorId,
  }

  updateDatabase((draft) => {
    draft.milestones.unshift(milestone)
    return draft
  }, "create")

  return clone(milestone)
}

function updateMilestone(milestoneId, updates) {
  return updateDatabase((draft) => {
    const milestone = draft.milestones.find((item) => item.id === milestoneId)
    if (!milestone) throw new Error("Milestone not found")
    Object.assign(milestone, updates)
    return draft
  })
}

function getPublications() {
  return clone(getDatabase().publications)
}

function createPublication(payload, actorId) {
  const publication = {
    id: idFrom("pub"),
    projectId: payload.projectId || null,
    authorIds: payload.authorIds,
    title: payload.title,
    venue: payload.venue,
    year: payload.year,
    status: payload.status,
    link: payload.link || "",
    createdBy: actorId,
  }

  updateDatabase((draft) => {
    draft.publications.unshift(publication)
    return draft
  }, "create")

  return clone(publication)
}

function updatePublication(publicationId, updates) {
  return updateDatabase((draft) => {
    const publication = draft.publications.find((item) => item.id === publicationId)
    if (!publication) throw new Error("Publication not found")
    Object.assign(publication, updates)
    return draft
  })
}

function deletePublication(publicationId) {
  updateDatabase((draft) => {
    draft.publications = draft.publications.filter((publication) => publication.id !== publicationId)
    return draft
  })
}

function getNotifications(userId) {
  return clone(getDatabase().notifications.filter((notification) => notification.userId === userId))
}

async function markNotificationRead(notificationId) {
  if (isBrowser()) {
    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ action: "markRead", notificationId }),
    })
    await applyStateResponse(response, "Could not mark notification as read")
    return true
  }

  updateDatabase((draft) => {
    const notification = draft.notifications.find((item) => item.id === notificationId)
    if (notification) notification.read = true
    return draft
  })
  return true
}

async function markAllNotificationsRead(userId) {
  if (isBrowser()) {
    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ action: "markAllRead" }),
    })
    await applyStateResponse(response, "Could not mark notifications as read")
    return true
  }

  updateDatabase((draft) => {
    draft.notifications.forEach((notification) => {
      if (notification.userId === userId) notification.read = true
    })
    return draft
  })
  return true
}

function getSettings(userId) {
  const db = getDatabase()
  return clone(db.settings[userId] || { notifications: {}, appearance: { compactMode: false, theme: "light" } })
}

function updateSettings(userId, updates) {
  return updateDatabase((draft) => {
    draft.settings[userId] = {
      ...(draft.settings[userId] || { notifications: {}, appearance: { compactMode: false, theme: "light" } }),
      ...updates,
      notifications: {
        ...(((draft.settings[userId] || {}).notifications) || {}),
        ...(updates.notifications || {}),
      },
      appearance: {
        ...(((draft.settings[userId] || {}).appearance) || { compactMode: false, theme: "light" }),
        ...(updates.appearance || {}),
      },
    }
    return draft
  })
}

function searchAll(query) {
  const db = getDatabase()
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return { researchers: [], projects: [], labs: [], publications: [] }
  }

  return {
    researchers: db.users.filter((user) => [user.name, user.department, user.role, ...(user.researchInterests || []), ...(user.skills || [])].join(" ").toLowerCase().includes(normalized)),
    projects: db.projects.filter((project) => [project.title, project.description, project.field, ...(project.skills || [])].join(" ").toLowerCase().includes(normalized)),
    labs: db.labs.filter((lab) => [lab.name, lab.description, lab.department, ...(lab.researchAreas || [])].join(" ").toLowerCase().includes(normalized)),
    publications: db.publications.filter((publication) => [publication.title, publication.venue, publication.status].join(" ").toLowerCase().includes(normalized)),
  }
}

function getUnreadNotificationCount(userId) {
  return getDatabase().notifications.filter((notification) => notification.userId === userId && !notification.read).length
}

function getDashboardMetrics(user) {
  const db = getDatabase()
  const isSupervisor = !!user && user.role === "supervisor"
  const isAdmin = !!user && user.role === "admin"

  if (!user) {
    return {
      activeProjects: 0,
      collaborators: 0,
      publications: 0,
      progress: 0,
      taskCount: 0,
      milestoneCount: 0,
      totalUsers: db.users.length,
      totalProjects: db.projects.length,
      totalLabs: db.labs.length,
      unreadNotifications: 0,
    }
  }

  const userProjects = db.projects.filter((project) => project.memberIds.includes(user.id) || project.supervisorId === user.id)
  const collaborators = new Set()
  userProjects.forEach((project) => project.memberIds.forEach((memberId) => memberId !== user.id && collaborators.add(memberId)))
  db.collaborations.forEach((collaboration) => {
    if (collaboration.userIds.includes(user.id)) {
      collaboration.userIds.forEach((memberId) => memberId !== user.id && collaborators.add(memberId))
    }
  })

  const publications = db.publications.filter((publication) => publication.authorIds.includes(user.id))
  const tasks = db.tasks.filter((task) => task.assignedTo === user.id || (isSupervisor && userProjects.some((project) => project.id === task.projectId)))
  const milestones = db.milestones.filter((milestone) => userProjects.some((project) => project.id === milestone.projectId))
  const progress = userProjects.length
    ? Math.round(userProjects.reduce((sum, project) => sum + project.progress, 0) / userProjects.length)
    : 0

  return {
    activeProjects: userProjects.filter((project) => project.status !== "Completed").length,
    collaborators: collaborators.size,
    publications: publications.length,
    progress,
    taskCount: tasks.length,
    milestoneCount: milestones.length,
    totalUsers: db.users.length,
    totalProjects: db.projects.length,
    totalLabs: db.labs.length,
    unreadNotifications: getUnreadNotificationCount(user.id),
  }
}

function deactivateUser(userId) {
  updateDatabase((draft) => {
    const user = draft.users.find((item) => item.id === userId)
    if (user) user.active = false
    return draft
  })
}

function reactivateUser(userId) {
  updateDatabase((draft) => {
    const user = draft.users.find((item) => item.id === userId)
    if (user) user.active = true
    return draft
  })
}

export const authService = { login, register, logout, getCurrentUser, getSession: getSession }
export const userService = {
  getUsers,
  getUser,
  getCurrentUser,
  getConnectedUsers,
  searchUsers,
  isConnected: (viewerId, targetId) => isConnected(getDatabase, viewerId, targetId),
  updateProfile,
  deactivateUser,
  reactivateUser,
}
export const projectService = { getProjects, getProject, createProject, updateProject, addProjectMember }
export const labService = { getLabs, getLab, createLab, addLabMember, getManagedLabs }
export const collaborationService = {
  getResearchRequests,
  findCollaborationRequest,
  getConnectionState,
  sendCollaborationRequest,
  sendLabJoinRequest,
  sendProjectJoinRequest,
  acceptRequest,
  rejectRequest,
  getCollaborations,
}
export const messageService = {
  getConversations,
  getConversationByParticipants,
  getDirectConversation,
  getConversationMessages,
  sendMessage,
  startDirectMessage,
  ensureDirectChat,
  ensureGroupChat,
  openProjectChat,
  openLabChat,
  markConversationMessagesRead,
}
export const taskService = { getTasks, createTask, updateTask }
export const milestoneService = { getMilestones, createMilestone, updateMilestone }
export const publicationService = { getPublications, createPublication, updatePublication, deletePublication }
export const notificationService = { getNotifications, markNotificationRead, markAllNotificationsRead, getUnreadNotificationCount }
export const settingsService = { getSettings, updateSettings }
export const searchService = { searchAll }
export const analyticsService = { getDashboardMetrics }
