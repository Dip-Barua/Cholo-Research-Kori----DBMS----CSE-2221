import { ensureDirectConversation, ensureLabConversation, ensureProjectConversation } from "@/lib/message-mutations"
import { markRequestNotificationsReadOnState } from "@/lib/notification-mutations"

const idFrom = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`
const nowIso = () => new Date().toISOString()

function getUserById(state, userId) {
  return state.users.find((user) => user.id === userId) || null
}

function normalizeId(value) {
  return value ?? null
}

function findRequest(state, { senderId, receiverId, projectId = null, labId = null }) {
  return state.collaborationRequests.find((request) => {
    if (request.senderId !== senderId || request.receiverId !== receiverId) return false
    if (normalizeId(request.projectId) !== normalizeId(projectId)) return false
    if (normalizeId(request.labId) !== normalizeId(labId)) return false
    return true
  }) || null
}

function requestKind(request) {
  if (request.labId) return "lab"
  if (request.projectId) return "project"
  return "connect"
}

function sendCollaborationRequestOnState(state, { senderId, receiverId, projectId = null, labId = null, message }) {
  const duplicate = state.collaborationRequests.some(
    (request) =>
      request.senderId === senderId &&
      request.receiverId === receiverId &&
      normalizeId(request.projectId) === normalizeId(projectId) &&
      normalizeId(request.labId) === normalizeId(labId) &&
      request.status === "pending",
  )

  if (duplicate) {
    throw new Error("A pending request already exists")
  }

  const request = {
    id: idFrom("request"),
    senderId,
    receiverId,
    projectId: normalizeId(projectId),
    labId: normalizeId(labId),
    message,
    status: "pending",
    createdAt: nowIso(),
  }

  state.collaborationRequests.unshift(request)

  const senderName = getUserById(state, senderId)?.name || "Someone"
  let notificationMessage = `${senderName} sent you a collaboration request.`
  if (request.labId) {
    const lab = state.labs.find((item) => item.id === request.labId)
    notificationMessage = `${senderName} requested to join ${lab?.name || "your lab"}.`
  } else if (request.projectId) {
    const project = state.projects.find((item) => item.id === request.projectId)
    notificationMessage = `${senderName} requested to join ${project?.title || "your project"}.`
  }

  state.notifications.unshift({
    id: idFrom("notification"),
    userId: receiverId,
    type: "request_received",
    title: "New collaboration request",
    message: notificationMessage,
    read: false,
    relatedId: request.id,
    href: "/requests",
    createdAt: nowIso(),
  })

  state.updatedAt = nowIso()
  return request
}

function acceptRequestOnState(state, requestId, actorId) {
  const request = state.collaborationRequests.find((item) => item.id === requestId)
  if (!request) throw new Error("Request not found")
  if (request.receiverId !== actorId) throw new Error("Not authorized")
  if (request.status !== "pending") throw new Error("Request is no longer pending")

  request.status = "accepted"
  const sender = getUserById(state, request.senderId)
  const receiver = getUserById(state, request.receiverId)
  const kind = requestKind(request)

  if (kind === "lab" && request.labId) {
    const lab = state.labs.find((item) => item.id === request.labId)
    if (!lab) throw new Error("Lab not found")
    if (lab.supervisorId !== actorId && getUserById(state, actorId)?.role !== "admin") {
      throw new Error("Only the lab admin can approve lab join requests")
    }
    lab.memberIds = lab.memberIds || []
    if (!lab.memberIds.includes(request.senderId)) {
      lab.memberIds.push(request.senderId)
    }
    ensureLabConversation(state, request.labId)
  } else if (kind === "project" && request.projectId) {
    const project = state.projects.find((item) => item.id === request.projectId)
    if (!project) throw new Error("Project not found")
    if (project.supervisorId !== actorId && getUserById(state, actorId)?.role !== "admin") {
      throw new Error("Only the project supervisor can approve join requests")
    }
    if (!project.memberIds.includes(request.senderId)) {
      project.memberIds.push(request.senderId)
      project.progress = Math.min(100, (project.progress || 0) + 5)
    }
    ensureProjectConversation(state, request.projectId)
  }

  const collaborationExists = state.collaborations.some(
    (collaboration) =>
      collaboration.userIds.includes(request.senderId) &&
      collaboration.userIds.includes(request.receiverId) &&
      normalizeId(collaboration.projectId) === normalizeId(request.projectId) &&
      normalizeId(collaboration.labId) === normalizeId(request.labId),
  )

  if (!collaborationExists) {
    state.collaborations.push({
      id: idFrom("collab"),
      userIds: [request.senderId, request.receiverId],
      projectId: request.projectId,
      labId: request.labId,
      role: "Researcher",
      status: "active",
      startedAt: nowIso(),
    })
  }

  let acceptedMessage = `${receiver?.name || "The researcher"} accepted your collaboration request.`
  if (kind === "lab") {
    const lab = state.labs.find((item) => item.id === request.labId)
    acceptedMessage = `You were approved to join ${lab?.name || "the lab"}.`
  } else if (kind === "project") {
    const project = state.projects.find((item) => item.id === request.projectId)
    acceptedMessage = `You were approved to join ${project?.title || "the project"}.`
  } else {
    acceptedMessage = `${receiver?.name || "The researcher"} accepted your connection request. You can now message each other.`
  }

  state.notifications.unshift({
    id: idFrom("notification"),
    userId: request.senderId,
    type: "request_accepted",
    title: "Request accepted",
    message: acceptedMessage,
    read: false,
    relatedId: request.id,
    href: kind === "project" && request.projectId
      ? `/projects/${request.projectId}`
      : kind === "lab" && request.labId
        ? `/labs/${request.labId}`
        : `/researchers/${request.receiverId}`,
    createdAt: nowIso(),
  })

  if (kind === "connect") {
    ensureDirectConversation(state, request.senderId, request.receiverId)
  }

  markRequestNotificationsReadOnState(state, requestId, actorId)

  state.updatedAt = nowIso()
  return request
}

function rejectRequestOnState(state, requestId, actorId) {
  const request = state.collaborationRequests.find((item) => item.id === requestId)
  if (!request) throw new Error("Request not found")
  if (request.receiverId !== actorId) throw new Error("Not authorized")
  if (request.status !== "pending") throw new Error("Request is no longer pending")

  if (request.labId) {
    const lab = state.labs.find((item) => item.id === request.labId)
    if (lab?.supervisorId !== actorId && getUserById(state, actorId)?.role !== "admin") {
      throw new Error("Only the lab admin can reject lab join requests")
    }
  }
  if (request.projectId) {
    const project = state.projects.find((item) => item.id === request.projectId)
    if (project?.supervisorId !== actorId && getUserById(state, actorId)?.role !== "admin") {
      throw new Error("Only the project supervisor can reject join requests")
    }
  }

  request.status = "rejected"
  const kind = requestKind(request)
  let rejectedMessage = "Your collaboration request was rejected."
  if (kind === "lab") {
    const lab = state.labs.find((item) => item.id === request.labId)
    rejectedMessage = `Your request to join ${lab?.name || "the lab"} was rejected.`
  } else if (kind === "project") {
    const project = state.projects.find((item) => item.id === request.projectId)
    rejectedMessage = `Your request to join ${project?.title || "the project"} was rejected.`
  }

  state.notifications.unshift({
    id: idFrom("notification"),
    userId: request.senderId,
    type: "request_rejected",
    title: "Request rejected",
    message: rejectedMessage,
    read: false,
    relatedId: request.id,
    href: "/requests",
    createdAt: nowIso(),
  })

  markRequestNotificationsReadOnState(state, requestId, actorId)

  state.updatedAt = nowIso()
  return request
}

export {
  acceptRequestOnState,
  findRequest,
  rejectRequestOnState,
  requestKind,
  sendCollaborationRequestOnState,
}
