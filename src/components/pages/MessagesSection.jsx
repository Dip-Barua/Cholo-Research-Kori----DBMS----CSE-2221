"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/providers/AppProvider"
import { labService, messageService, projectService, userService } from "@/lib/services"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"

function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-[color:var(--border-color)] bg-white p-8 text-center text-[color:var(--text-secondary)]">
      <div className="text-base font-medium text-[color:var(--text-primary)]">{title}</div>
      <div className="mt-1 text-sm">{description}</div>
    </div>
  )
}

function conversationLabel(conversation, currentUserId, userServiceRef) {
  if (conversation.type === "project") {
    const project = projectService.getProject(conversation.projectId)
    return project?.title || "Project chat"
  }
  if (conversation.type === "lab") {
    const lab = labService.getLab(conversation.labId)
    return lab?.name || "Lab chat"
  }
  const otherId = conversation.participantIds.find((participant) => participant !== currentUserId)
  return userServiceRef.getUser(otherId)?.name || "Direct message"
}

function conversationBadge(conversation) {
  if (conversation.type === "project") return "Project"
  if (conversation.type === "lab") return "Lab"
  return "Connection"
}

export default function MessagesSection() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentUser, dbVersion } = useAuth()
  const [messageFilter, setMessageFilter] = useState("all")
  const [selectedConversationId, setSelectedConversationId] = useState(null)
  const [messageContent, setMessageContent] = useState("")
  const [notice, setNotice] = useState("")
  const bootstrappedChatsRef = useRef(false)
  const openingDirectRef = useRef(null)

  void dbVersion

  const conversations = messageService.getConversations(currentUser.id)
  const connectedUsers = userService.getConnectedUsers(currentUser.id)

  const filteredConversations = useMemo(() => {
    if (messageFilter === "connections") {
      return conversations.filter((conversation) => !conversation.type || conversation.type === "direct")
    }
    if (messageFilter === "projects") {
      return conversations.filter((conversation) => conversation.type === "project")
    }
    if (messageFilter === "labs") {
      return conversations.filter((conversation) => conversation.type === "lab")
    }
    return conversations
  }, [conversations, messageFilter])

  const selectedConversation = filteredConversations.find((conversation) => conversation.id === selectedConversationId)
    || filteredConversations[0]
    || conversations.find((conversation) => conversation.id === selectedConversationId)
    || conversations[0]
    || null

  const threadMessages = selectedConversation
    ? messageService.getConversationMessages(selectedConversation.id)
    : []

  useEffect(() => {
    const conversationParam = searchParams.get("conversation")
    if (conversationParam) {
      setSelectedConversationId(conversationParam)
      setMessageFilter("all")
    }
  }, [searchParams])

  useEffect(() => {
    const userParam = searchParams.get("userId")
    if (!userParam || userParam === currentUser.id) return
    if (openingDirectRef.current === userParam) return

    openingDirectRef.current = userParam
    let active = true

    messageService.ensureDirectChat(currentUser.id, userParam)
      .then((conversation) => {
        if (!active || !conversation) return
        setSelectedConversationId(conversation.id)
        setMessageFilter("connections")
        router.replace(`/messages?conversation=${conversation.id}`)
      })
      .catch((error) => {
        if (active) setNotice(error.message || "Could not open conversation.")
      })

    return () => {
      active = false
    }
  }, [searchParams, currentUser.id, router])

  const startChatWithUser = async (otherUserId) => {
    try {
      const conversation = await messageService.ensureDirectChat(currentUser.id, otherUserId)
      if (conversation) {
        setSelectedConversationId(conversation.id)
        setMessageFilter("connections")
        router.replace(`/messages?conversation=${conversation.id}`)
      }
    } catch (error) {
      setNotice(error.message || "Could not open conversation.")
    }
  }

  const handleSend = async (event) => {
    event.preventDefault()
    if (!selectedConversation || !messageContent.trim()) return
    try {
      if (selectedConversation.type === "direct") {
        const otherUserId = selectedConversation.participantIds.find((participant) => participant !== currentUser.id)
        await messageService.sendMessage({
          senderId: currentUser.id,
          receiverId: otherUserId,
          content: messageContent.trim(),
          conversationId: selectedConversation.id,
        })
      } else {
        await messageService.sendMessage({
          senderId: currentUser.id,
          content: messageContent.trim(),
          conversationId: selectedConversation.id,
        })
      }
      setMessageContent("")
    } catch (error) {
      setNotice(error.message || "Could not send message.")
    }
  }

  useEffect(() => {
    if (bootstrappedChatsRef.current) return
    bootstrappedChatsRef.current = true

    const syncGroupChats = async () => {
      const existing = messageService.getConversations(currentUser.id)
      const projectJobs = projectService.getProjects()
        .filter((project) => project.memberIds.includes(currentUser.id) || project.supervisorId === currentUser.id)
        .filter((project) => !existing.some((conversation) => conversation.type === "project" && conversation.projectId === project.id))
        .map((project) => messageService.ensureGroupChat({ type: "project", projectId: project.id }))

      const labJobs = labService.getLabs()
        .filter((lab) => (lab.memberIds || []).includes(currentUser.id) || lab.supervisorId === currentUser.id)
        .filter((lab) => !existing.some((conversation) => conversation.type === "lab" && conversation.labId === lab.id))
        .map((lab) => messageService.ensureGroupChat({ type: "lab", labId: lab.id }))

      await Promise.allSettled([...projectJobs, ...labJobs])
    }

    void syncGroupChats()
  }, [currentUser.id])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-[1.25rem] border border-[color:var(--border-color)] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--text-primary)]">Messages</h1>
          <p className="text-sm text-[color:var(--text-secondary)]">Connections, lab chats, and project team discussions.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", "connections", "labs", "projects"].map((filter) => (
            <Button key={filter} variant={messageFilter === filter ? "default" : "outline"} className="rounded-xl capitalize" onClick={() => setMessageFilter(filter)}>
              {filter === "all" ? "All" : filter}
            </Button>
          ))}
        </div>
      </div>

      {notice ? <div className="rounded-2xl border border-[color:var(--border-color)] bg-white px-4 py-3 text-sm">{notice}</div> : null}

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <CardHeader><CardTitle>Connected Researchers</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {connectedUsers.length ? connectedUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => startChatWithUser(user.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-[color:var(--border-color)] px-4 py-3 text-left hover:bg-[color:rgba(31,176,200,0.08)]"
                >
                  <span className="font-medium">{user.name}</span>
                  <Badge variant="outline" className="border-transparent bg-emerald-50 text-emerald-700">Connected</Badge>
                </button>
              )) : <EmptyState title="No connections yet" description="Accept collaboration requests to message researchers." />}
            </CardContent>
          </Card>

          <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <CardHeader><CardTitle>Conversations</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {filteredConversations.length ? filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => {
                    setSelectedConversationId(conversation.id)
                    router.replace(`/messages?conversation=${conversation.id}`)
                  }}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${selectedConversation?.id === conversation.id ? "border-[color:var(--primary-dark)] bg-[color:rgba(31,176,200,0.08)]" : "border-[color:var(--border-color)] hover:bg-[color:rgba(31,176,200,0.06)]"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium">{conversationLabel(conversation, currentUser.id, userService)}</div>
                    <Badge variant="outline" className="border-transparent bg-[color:rgba(31,176,200,0.12)] text-[color:var(--primary-dark)]">{conversationBadge(conversation)}</Badge>
                  </div>
                  <div className="text-sm text-[color:var(--text-secondary)]">{conversation.subject}</div>
                </button>
              )) : <EmptyState title="No conversations in this filter" description="Try another filter or start from a connected researcher." />}
            </CardContent>
          </Card>
        </div>

        <Card className="border-[color:var(--border-color)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <CardHeader>
            <CardTitle>
              {selectedConversation
                ? conversationLabel(selectedConversation, currentUser.id, userService)
                : "Conversation"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedConversation ? (
              <div className="space-y-3">
                {threadMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.senderId === currentUser.id ? "ml-auto bg-[color:var(--primary-dark)] text-white" : "bg-[color:var(--bg-main)] text-[color:var(--text-primary)]"}`}
                  >
                    {message.content}
                  </div>
                ))}
                <form onSubmit={handleSend} className="space-y-3">
                  <Textarea value={messageContent} onChange={(event) => setMessageContent(event.target.value)} placeholder="Write a message..." />
                  <Button type="submit" className="rounded-xl bg-[color:var(--primary-dark)] text-white"><Send className="h-4 w-4" /> Send</Button>
                </form>
              </div>
            ) : (
              <EmptyState title="Choose a conversation" description="Select a connected researcher or group chat." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
