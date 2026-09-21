import { isConnected } from "@/lib/connections"

const idFrom = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`
const nowIso = () => new Date().toISOString()

function getUserById(state, userId) {
  return state.users.find((user) => user.id === userId) || null
}

function ensureDirectConversation(state, senderId, receiverId) {
  const key = [senderId, receiverId].sort().join(":")
  let conversation = state.conversations.find((item) => {
    if (item.type && item.type !== "direct") return false
    return [...(item.participantIds || [])].sort().join(":") === key
  })

  if (!conversation) {
    const receiver = getUserById(state, receiverId)
    conversation = {
      id: idFrom("conversation"),
      type: "direct",
      participantIds: [senderId, receiverId],
      messageIds: [],
      updatedAt: nowIso(),
      subject: receiver?.name ? `Chat with ${receiver.name}` : "Direct message",
      projectId: null,
      labId: null,
    }
    state.conversations.unshift(conversation)
  }

  return conversation
}

function ensureProjectConversation(state, projectId) {
  let conversation = state.conversations.find((item) => item.type === "project" && item.projectId === projectId)
  if (conversation) return conversation

  const project = state.projects.find((item) => item.id === projectId)
  if (!project) throw new Error("Project not found")

  const participantIds = Array.from(new Set([project.supervisorId, ...(project.memberIds || [])].filter(Boolean)))
  conversation = {
    id: idFrom("conversation"),
    type: "project",
    projectId,
    labId: null,
    participantIds,
    messageIds: [],
    updatedAt: nowIso(),
    subject: `${project.title} · Project chat`,
  }
  state.conversations.unshift(conversation)
  return conversation
}

function ensureLabConversation(state, labId) {
  let conversation = state.conversations.find((item) => item.type === "lab" && item.labId === labId)
  if (conversation) return conversation

  const lab = state.labs.find((item) => item.id === labId)
  if (!lab) throw new Error("Lab not found")

  const participantIds = Array.from(new Set([lab.supervisorId, ...(lab.memberIds || [])].filter(Boolean)))
  conversation = {
    id: idFrom("conversation"),
    type: "lab",
    labId,
    projectId: null,
    participantIds,
    messageIds: [],
    updatedAt: nowIso(),
    subject: `${lab.name} · Lab chat`,
  }
  state.conversations.unshift(conversation)
  return conversation
}

function notifyMessageRecipients(state, { senderId, recipientIds, conversationId, preview }) {
  const senderName = getUserById(state, senderId)?.name || "Someone"
  recipientIds.forEach((userId) => {
    state.notifications.unshift({
      id: idFrom("notification"),
      userId,
      type: "message_received",
      title: "New message",
      message: preview || `${senderName} sent you a message.`,
      read: false,
      relatedId: conversationId,
      href: `/messages?conversation=${conversationId}`,
      createdAt: nowIso(),
    })
  })
}

function sendMessageOnState(state, { senderId, content, receiverId = null, conversationId = null }) {
  const trimmed = String(content || "").trim()
  if (!trimmed) throw new Error("Message cannot be empty")

  let conversation = null
  if (conversationId) {
    conversation = state.conversations.find((item) => item.id === conversationId)
    if (!conversation && receiverId) {
      conversation = ensureDirectConversation(state, senderId, receiverId)
    }
    if (!conversation) throw new Error("Conversation not found")
    if (!conversation.participantIds.includes(senderId)) throw new Error("Not authorized")
  } else if (receiverId) {
    if (!isConnected(state, senderId, receiverId)) {
      throw new Error("You must be connected with this researcher before sending a direct message")
    }
    conversation = ensureDirectConversation(state, senderId, receiverId)
  } else {
    throw new Error("receiverId or conversationId is required")
  }

  const messageReceiver = conversation.type === "direct"
    ? conversation.participantIds.find((participant) => participant !== senderId)
    : (conversation.participantIds.find((participant) => participant !== senderId) || senderId)

  const message = {
    id: idFrom("message"),
    conversationId: conversation.id,
    senderId,
    receiverId: messageReceiver,
    content: trimmed,
    createdAt: nowIso(),
    read: false,
  }

  state.messages.push(message)
  conversation.messageIds.push(message.id)
  conversation.updatedAt = nowIso()

  const recipients = conversation.participantIds.filter((participant) => participant !== senderId)
  notifyMessageRecipients(state, {
    senderId,
    recipientIds: recipients,
    conversationId: conversation.id,
    preview: `${getUserById(state, senderId)?.name || "Someone"}: ${trimmed.slice(0, 80)}`,
  })

  state.updatedAt = nowIso()
  return { message, conversation }
}

export {
  ensureDirectConversation,
  ensureLabConversation,
  ensureProjectConversation,
  sendMessageOnState,
}
