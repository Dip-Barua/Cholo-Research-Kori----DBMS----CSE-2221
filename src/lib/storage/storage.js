const nowIso = () => new Date().toISOString()

function isBrowser() {
  return typeof window !== "undefined"
}

function emitChange(type, detail = {}) {
  if (!isBrowser()) return
  window.dispatchEvent(new CustomEvent("cholo-storage-change", { detail: { type, ...detail } }))
}

let databaseCache = null
let sessionCache = { currentUserId: null }

async function persistDatabase(nextDb) {
  if (!isBrowser()) return true
  try {
    const response = await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ state: nextDb }),
    })
    return response.ok
  } catch {
    return false
  }
}

function hydrateDatabase(nextDb) {
  const normalized = normalizeDatabase(nextDb || {})
  databaseCache = normalized
  emitChange("database", { database: normalized })
  return normalized
}

function hydrateSession(nextSession) {
  sessionCache = nextSession || { currentUserId: null }
  emitChange("session", { session: sessionCache })
  return sessionCache
}

function mergeRecordsById(seedItems = [], dbItems = []) {
  const map = new Map()
  seedItems.forEach((item) => map.set(item.id, item))
  dbItems.forEach((item) => map.set(item.id, item))
  return Array.from(map.values())
}

function createSeedDatabase() {
  const users = [
    {
      id: "user-admin-1",
      name: "Admin User",
      email: "admin@cholo.local",
      password: "admin123",
      university: "Cholo Research Kori",
      department: "Platform",
      role: "admin",
      bio: "Platform administrator for users, content, and global settings.",
      researchInterests: ["Platform Operations"],
      skills: ["Moderation", "Support", "Analytics"],
      avatarSeed: "AU",
      joinedAt: "2025-08-01T08:00:00.000Z",
      active: true,
    },
    {
      id: "user-supervisor-1",
      name: "Dip Barua",
      email: "dip.barua@gmail.com",
      password: "dip.barua@gmail.com",
      university: "Cholo Research Kori",
      department: "CSE",
      role: "supervisor",
      bio: "Supervisor for applied AI, NLP, and climate analytics projects.",
      researchInterests: ["Machine Learning", "Natural Language Processing", "Climate Research"],
      skills: ["Python", "Research Supervision", "Publication"],
      avatarSeed: "SR",
      joinedAt: "2025-08-15T08:00:00.000Z",
      active: true,
    },
    {
      id: "user-supervisor-2",
      name: "Miftahul Jannat Mim",
      email: "nusrat.jahan@cholo.local",
      password: "demo1234",
      university: "Cholo Research Kori",
      department: "ECE",
      role: "supervisor",
      bio: "Leads secure systems, IoT, and cybersecurity research.",
      researchInterests: ["Cybersecurity", "IoT", "Embedded Systems"],
      skills: ["Security", "Networking", "Research Leadership"],
      avatarSeed: "NJ",
      joinedAt: "2025-08-15T08:00:00.000Z",
      active: true,
    },
    {
      id: "user-student-1",
      name: "Arafat Rahman",
      email: "arafat.rahman@cholo.local",
      password: "demo1234",
      university: "Cholo Research Kori",
      department: "CSE",
      role: "student",
      bio: "Graduate researcher focused on NLP datasets and annotation workflows.",
      researchInterests: ["Natural Language Processing", "Data Science"],
      skills: ["Python", "Annotation", "Statistics"],
      avatarSeed: "AR",
      joinedAt: "2026-01-10T08:00:00.000Z",
      active: true,
    },
    {
      id: "user-researcher-1",
      name: "Tanvir Ahmed",
      email: "tanvir.ahmed@cholo.local",
      password: "demo1234",
      university: "Cholo Research Kori",
      department: "CSE",
      role: "researcher",
      bio: "Researcher working on computer vision and security analytics.",
      researchInterests: ["Computer Vision", "Cybersecurity"],
      skills: ["Python", "PyTorch", "Anomaly Detection"],
      avatarSeed: "TA",
      joinedAt: "2026-01-12T08:00:00.000Z",
      active: true,
    },
    {
      id: "user-researcher-2",
      name: "Sadia Rahman",
      email: "sadia.rahman@cholo.local",
      password: "demo1234",
      university: "Cholo Research Kori",
      department: "CSE",
      role: "researcher",
      bio: "Health AI researcher with experience in medical imaging pipelines.",
      researchInterests: ["Medical AI", "Computer Vision"],
      skills: ["PyTorch", "Medical AI", "Data Labeling"],
      avatarSeed: "SA",
      joinedAt: "2026-02-01T08:00:00.000Z",
      active: true,
    },
  ]

  const projects = [
    {
      id: "project-ml-climate",
      title: "Machine Learning for Climate Prediction",
      description: "Forecast precipitation, temperature anomalies, and local climate risk using multi-source datasets.",
      supervisorId: "user-supervisor-1",
      memberIds: ["user-student-1", "user-researcher-1"],
      field: "Machine Learning",
      skills: ["Python", "PyTorch", "Statistics"],
      status: "In Progress",
      progress: 72,
      startDate: "2026-02-10",
      endDate: "2026-11-30",
      createdAt: "2026-02-10T08:00:00.000Z",
      labId: "lab-ai",
    },
    {
      id: "project-bangla-nlp",
      title: "Bangla Natural Language Processing",
      description: "Develop language resources and models for Bangla text classification and summarization.",
      supervisorId: "user-supervisor-1",
      memberIds: ["user-student-1"],
      field: "Natural Language Processing",
      skills: ["Python", "NLTK", "Transformers"],
      status: "Data Collection",
      progress: 48,
      startDate: "2026-03-01",
      endDate: "2026-10-30",
      createdAt: "2026-03-01T08:00:00.000Z",
      labId: "lab-ai",
    },
    {
      id: "project-cyber-threat",
      title: "Cybersecurity Threat Detection",
      description: "Create detection pipelines for phishing, intrusion, and suspicious system behavior.",
      supervisorId: "user-supervisor-2",
      memberIds: ["user-researcher-1"],
      field: "Cybersecurity",
      skills: ["Anomaly Detection", "Networking", "Python"],
      status: "Paper Writing",
      progress: 85,
      startDate: "2026-01-20",
      endDate: "2026-09-30",
      createdAt: "2026-01-20T08:00:00.000Z",
      labId: "lab-secure",
    },
    {
      id: "project-medical-vision",
      title: "Computer Vision for Medical Imaging",
      description: "Research segmentation and classification methods for radiology assistance.",
      supervisorId: "user-supervisor-1",
      memberIds: ["user-researcher-2"],
      field: "Computer Vision",
      skills: ["Computer Vision", "PyTorch", "Medical AI"],
      status: "Recruiting",
      progress: 32,
      startDate: "2026-04-10",
      endDate: "2026-12-20",
      createdAt: "2026-04-10T08:00:00.000Z",
      labId: "lab-ai",
    },
    {
      id: "project-iot-secure",
      title: "Secure IoT Systems",
      description: "Study low-power secure communication protocols for campus IoT deployments.",
      supervisorId: "user-supervisor-2",
      memberIds: ["user-student-1", "user-researcher-1"],
      field: "IoT",
      skills: ["Embedded Systems", "Security", "Networks"],
      status: "In Progress",
      progress: 61,
      startDate: "2026-05-01",
      endDate: "2026-12-01",
      createdAt: "2026-05-01T08:00:00.000Z",
      labId: "lab-secure",
    },
  ]

  const labs = [
    {
      id: "lab-ai",
      name: "Applied AI Lab",
      supervisorId: "user-supervisor-1",
      department: "CSE",
      description: "A collaborative lab for machine learning, language technology, and climate analytics.",
      researchAreas: ["Machine Learning", "NLP", "Climate Research"],
      memberIds: ["user-supervisor-1", "user-student-1", "user-researcher-1", "user-researcher-2"],
      projectIds: ["project-ml-climate", "project-bangla-nlp", "project-medical-vision"],
      openProjects: 2,
    },
    {
      id: "lab-secure",
      name: "Secure Systems Lab",
      supervisorId: "user-supervisor-2",
      department: "ECE",
      description: "Focused on cybersecurity, embedded systems, and secure IoT prototypes.",
      researchAreas: ["Cybersecurity", "IoT", "Embedded Systems"],
      memberIds: ["user-supervisor-2", "user-researcher-1", "user-student-1"],
      projectIds: ["project-cyber-threat", "project-iot-secure"],
      openProjects: 1,
    },
    {
      id: "lab-data",
      name: "Data Science Studio",
      supervisorId: "user-supervisor-1",
      department: "CSE",
      description: "Supports quantitative studies, reproducible analysis, and publication workflows.",
      researchAreas: ["Data Science", "Analytics", "Publication"],
      memberIds: ["user-supervisor-1", "user-student-1"],
      projectIds: ["project-bangla-nlp"],
      openProjects: 1,
    },
  ]

  const collaborationRequests = [
    {
      id: "request-1",
      senderId: "user-student-1",
      receiverId: "user-supervisor-1",
      projectId: "project-medical-vision",
      message: "I have experience with labeling and want to help with model experiments.",
      status: "pending",
      createdAt: "2026-09-14T08:00:00.000Z",
    },
    {
      id: "request-2",
      senderId: "user-researcher-2",
      receiverId: "user-supervisor-2",
      projectId: "project-iot-secure",
      message: "I want to contribute to secure firmware review and documentation.",
      status: "accepted",
      createdAt: "2026-08-30T08:00:00.000Z",
    },
    {
      id: "request-3",
      senderId: "user-researcher-1",
      receiverId: "user-supervisor-1",
      projectId: "project-ml-climate",
      message: "Interested in helping with computer vision evaluation and data pipelines.",
      status: "rejected",
      createdAt: "2026-08-21T08:00:00.000Z",
    },
  ]

  const collaborations = [
    {
      id: "collab-1",
      userIds: ["user-student-1", "user-supervisor-1"],
      projectId: "project-bangla-nlp",
      role: "Researcher",
      status: "active",
      startedAt: "2026-03-01T08:00:00.000Z",
    },
    {
      id: "collab-2",
      userIds: ["user-researcher-1", "user-supervisor-2"],
      projectId: "project-cyber-threat",
      role: "Researcher",
      status: "active",
      startedAt: "2026-01-20T08:00:00.000Z",
    },
    {
      id: "collab-3",
      userIds: ["user-researcher-2", "user-supervisor-2"],
      projectId: "project-iot-secure",
      role: "Researcher",
      status: "active",
      startedAt: "2026-08-30T08:00:00.000Z",
    },
  ]

  const conversations = [
    {
      id: "conversation-1",
      type: "direct",
      participantIds: ["user-student-1", "user-supervisor-1"],
      messageIds: ["message-1", "message-2", "message-3"],
      updatedAt: "2026-09-18T10:00:00.000Z",
      subject: "Bangla NLP project",
      projectId: null,
      labId: null,
    },
    {
      id: "conversation-2",
      type: "direct",
      participantIds: ["user-researcher-1", "user-supervisor-2"],
      messageIds: ["message-4", "message-5"],
      updatedAt: "2026-09-19T08:00:00.000Z",
      subject: "IoT security follow-up",
      projectId: null,
      labId: null,
    },
  ]

  const messages = [
    {
      id: "message-1",
      conversationId: "conversation-1",
      senderId: "user-supervisor-1",
      receiverId: "user-student-1",
      content: "Please finalize the annotated sample set by tomorrow.",
      createdAt: "2026-09-17T08:00:00.000Z",
      read: true,
    },
    {
      id: "message-2",
      conversationId: "conversation-1",
      senderId: "user-student-1",
      receiverId: "user-supervisor-1",
      content: "I have started cleaning the dataset and will share a draft tonight.",
      createdAt: "2026-09-17T10:15:00.000Z",
      read: true,
    },
    {
      id: "message-3",
      conversationId: "conversation-1",
      senderId: "user-supervisor-1",
      receiverId: "user-student-1",
      content: "Great. We also need a short note on the annotation scheme.",
      createdAt: "2026-09-18T10:00:00.000Z",
      read: false,
    },
    {
      id: "message-4",
      conversationId: "conversation-2",
      senderId: "user-researcher-1",
      receiverId: "user-supervisor-2",
      content: "The intrusion detection benchmark is ready for review.",
      createdAt: "2026-09-18T09:00:00.000Z",
      read: true,
    },
    {
      id: "message-5",
      conversationId: "conversation-2",
      senderId: "user-supervisor-2",
      receiverId: "user-researcher-1",
      content: "Please share the evaluation notes before the lab meeting.",
      createdAt: "2026-09-19T08:00:00.000Z",
      read: false,
    },
  ]

  const tasks = [
    {
      id: "task-1",
      projectId: "project-bangla-nlp",
      assignedTo: "user-student-1",
      createdBy: "user-supervisor-1",
      title: "Annotate training samples",
      description: "Review 120 samples for sentiment and intent labels.",
      priority: "High",
      status: "In Progress",
      dueDate: "2026-09-22",
      createdAt: "2026-09-10T08:00:00.000Z",
    },
    {
      id: "task-2",
      projectId: "project-ml-climate",
      assignedTo: "user-researcher-1",
      createdBy: "user-supervisor-1",
      title: "Run baseline experiment",
      description: "Compare RF, XGBoost, and LSTM baselines on rainfall data.",
      priority: "Medium",
      status: "Todo",
      dueDate: "2026-09-25",
      createdAt: "2026-09-12T08:00:00.000Z",
    },
    {
      id: "task-3",
      projectId: "project-cyber-threat",
      assignedTo: "user-researcher-1",
      createdBy: "user-supervisor-2",
      title: "Draft paper section",
      description: "Summarize threat model and evaluation methodology.",
      priority: "High",
      status: "In Progress",
      dueDate: "2026-09-28",
      createdAt: "2026-09-08T08:00:00.000Z",
    },
    {
      id: "task-4",
      projectId: "project-iot-secure",
      assignedTo: "user-student-1",
      createdBy: "user-supervisor-2",
      title: "Document test results",
      description: "Write up the secure firmware smoke test results.",
      priority: "Low",
      status: "Completed",
      dueDate: "2026-09-12",
      createdAt: "2026-09-01T08:00:00.000Z",
    },
  ]

  const milestones = [
    {
      id: "milestone-1",
      projectId: "project-ml-climate",
      title: "Literature Review",
      description: "Survey climate forecasting papers and define evaluation metrics.",
      dueDate: "2026-09-18",
      status: "Completed",
      progress: 100,
      createdBy: "user-supervisor-1",
    },
    {
      id: "milestone-2",
      projectId: "project-bangla-nlp",
      title: "Dataset Submission",
      description: "Finalize and upload cleaned annotation batches.",
      dueDate: "2026-09-22",
      status: "In Progress",
      progress: 68,
      createdBy: "user-supervisor-1",
    },
    {
      id: "milestone-3",
      projectId: "project-cyber-threat",
      title: "Paper Draft",
      description: "Prepare abstract, method, and initial results.",
      dueDate: "2026-09-28",
      status: "In Progress",
      progress: 85,
      createdBy: "user-supervisor-2",
    },
    {
      id: "milestone-4",
      projectId: "project-medical-vision",
      title: "Protocol Review",
      description: "Review annotation protocol and experiment checklist.",
      dueDate: "2026-09-30",
      status: "Todo",
      progress: 20,
      createdBy: "user-supervisor-1",
    },
  ]

  const publications = [
    {
      id: "pub-1",
      projectId: "project-ml-climate",
      authorIds: ["user-supervisor-1", "user-student-1"],
      title: "Forecasting Regional Rainfall with Multi-Source Climate Data",
      venue: "ICLR Workshop",
      year: 2026,
      status: "Published",
      link: "https://example.org/climate-paper",
      createdBy: "user-supervisor-1",
    },
    {
      id: "pub-2",
      projectId: "project-cyber-threat",
      authorIds: ["user-supervisor-2", "user-researcher-1"],
      title: "Anomaly Detection for Phishing and Network Intrusion",
      venue: "Under Review",
      year: 2026,
      status: "Under Review",
      link: "",
      createdBy: "user-supervisor-2",
    },
    {
      id: "pub-3",
      projectId: "project-bangla-nlp",
      authorIds: ["user-supervisor-1", "user-student-1"],
      title: "Bangla Dataset Construction for Low-Resource NLP",
      venue: "Draft Manuscript",
      year: 2026,
      status: "Draft",
      link: "",
      createdBy: "user-student-1",
    },
  ]

  const notifications = [
    {
      id: "notification-1",
      userId: "user-supervisor-1",
      type: "request_received",
      title: "New collaboration request",
      message: "Arafat Rahman requested to join Computer Vision for Medical Imaging.",
      read: false,
      relatedId: "request-1",
      href: "/requests",
      createdAt: "2026-09-14T08:00:00.000Z",
    },
    {
      id: "notification-2",
      userId: "user-student-1",
      type: "task_assigned",
      title: "New task assigned",
      message: "Annotate training samples was assigned to you.",
      read: false,
      relatedId: "task-1",
      href: "/tasks",
      createdAt: "2026-09-10T08:00:00.000Z",
    },
    {
      id: "notification-3",
      userId: "user-researcher-1",
      type: "message_received",
      title: "New message",
      message: "You have a new message from Dr. Nusrat Jahan.",
      read: false,
      relatedId: "conversation-2",
      href: "/messages",
      createdAt: "2026-09-19T08:00:00.000Z",
    },
    {
      id: "notification-4",
      userId: "user-student-1",
      type: "milestone_due",
      title: "Milestone approaching",
      message: "Dataset Submission is due in 4 days.",
      read: true,
      relatedId: "milestone-2",
      href: "/milestones",
      createdAt: "2026-09-18T08:00:00.000Z",
    },
    {
      id: "notification-5",
      userId: "user-supervisor-2",
      type: "request_accepted",
      title: "Collaboration accepted",
      message: "A new collaborator joined your Secure IoT Systems project.",
      read: true,
      relatedId: "request-2",
      href: "/collaborations",
      createdAt: "2026-08-30T08:00:00.000Z",
    },
  ]

  const settings = {
    "user-student-1": {
      notifications: {
        collaborationRequests: true,
        projectUpdates: true,
        messages: true,
        milestones: true,
      },
      appearance: { compactMode: false, theme: "light" },
    },
    "user-researcher-1": {
      notifications: {
        collaborationRequests: true,
        projectUpdates: true,
        messages: true,
        milestones: true,
      },
      appearance: { compactMode: false, theme: "light" },
    },
    "user-supervisor-1": {
      notifications: {
        collaborationRequests: true,
        projectUpdates: true,
        messages: true,
        milestones: true,
      },
      appearance: { compactMode: false, theme: "light" },
    },
    "user-admin-1": {
      notifications: {
        collaborationRequests: true,
        projectUpdates: true,
        messages: true,
        milestones: true,
      },
      appearance: { compactMode: false, theme: "light" },
    },
    "user-supervisor-2": {
      notifications: {
        collaborationRequests: true,
        projectUpdates: true,
        messages: true,
        milestones: true,
      },
      appearance: { compactMode: false, theme: "light" },
    },
    "user-researcher-2": {
      notifications: {
        collaborationRequests: true,
        projectUpdates: true,
        messages: true,
        milestones: true,
      },
      appearance: { compactMode: false, theme: "light" },
    },
  }

  return {
    users,
    projects,
    labs,
    collaborationRequests,
    collaborations,
    conversations,
    messages,
    tasks,
    milestones,
    publications,
    notifications,
    settings,
    updatedAt: nowIso(),
  }
}

function normalizeDatabase(db) {
  const incoming = db || {}
  const hasServerPayload = Array.isArray(incoming.users) && incoming.users.length > 0

  if (hasServerPayload) {
    return {
      users: incoming.users || [],
      projects: incoming.projects || [],
      labs: incoming.labs || [],
      collaborationRequests: incoming.collaborationRequests || [],
      collaborations: incoming.collaborations || [],
      conversations: incoming.conversations || [],
      messages: incoming.messages || [],
      tasks: incoming.tasks || [],
      milestones: incoming.milestones || [],
      publications: incoming.publications || [],
      notifications: incoming.notifications || [],
      settings: incoming.settings || {},
      updatedAt: incoming.updatedAt || nowIso(),
    }
  }

  const seed = createSeedDatabase()
  return {
    ...seed,
    ...incoming,
    users: mergeRecordsById(seed.users, incoming.users || []),
    settings: {
      ...seed.settings,
      ...(incoming.settings || {}),
    },
  }
}

function ensureDatabase() {
  if (!databaseCache) {
    databaseCache = normalizeDatabase(createSeedDatabase())
  }

  return databaseCache
}

function getDatabase() {
  return ensureDatabase()
}

function setDatabase(nextDb, changeType = "update") {
  const normalized = {
    ...normalizeDatabase(nextDb),
    updatedAt: nowIso(),
  }
  databaseCache = normalized
  emitChange(changeType, { database: normalized })
  void persistDatabase(normalized)
  return normalized
}

function updateDatabase(updater, changeType = "update") {
  const current = getDatabase()
  const draft = JSON.parse(JSON.stringify(current))
  const updated = updater(draft) || draft
  return setDatabase(updated, changeType)
}

function getSession() {
  return sessionCache
}

function setSession(session) {
  return hydrateSession(session)
}

function clearSession() {
  return hydrateSession({ currentUserId: null })
}

export {
  clearSession,
  createSeedDatabase,
  hydrateDatabase,
  hydrateSession,
  ensureDatabase,
  emitChange,
  getDatabase,
  getSession,
  isBrowser,
  nowIso,
  setDatabase,
  setSession,
  updateDatabase,
}
