import { ensureAppTables, getPool } from "./mysql"
import { createSeedDatabase } from "@/lib/storage/storage"

const STATE_ROW_ID = 1

function parseJsonValue(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return parsed
    } catch {
      return fallback
    }
  }
  if (typeof value === "object") {
    return value
  }
  return fallback
}

function jsonArray(value) {
  const parsed = parseJsonValue(value, [])
  return Array.isArray(parsed) ? parsed : []
}

function getValue(source, key, fallback = null) {
  if (source && Object.prototype.hasOwnProperty.call(source, key)) {
    return source[key]
  }
  return fallback
}

function toBoolean(value) {
  return value === 1 || value === true || value === "1"
}

function toMysqlDatetime(value, fallback = new Date()) {
  const dateValue = value ? new Date(value) : new Date(fallback)
  if (Number.isNaN(dateValue.getTime())) {
    return new Date(fallback).toISOString().slice(0, 19).replace("T", " ")
  }
  return dateValue.toISOString().slice(0, 19).replace("T", " ")
}

function toMysqlDate(value, fallback = new Date()) {
  const dateValue = value ? new Date(value) : new Date(fallback)
  if (Number.isNaN(dateValue.getTime())) {
    return new Date(fallback).toISOString().slice(0, 10)
  }
  return dateValue.toISOString().slice(0, 10)
}

function normalizeStateLists() {
  return {
    users: [],
    projects: [],
    labs: [],
    collaborationRequests: [],
    collaborations: [],
    conversations: [],
    messages: [],
    tasks: [],
    milestones: [],
    publications: [],
    notifications: [],
    settings: {},
  }
}

async function seedStateIntoSql(seed) {
  await ensureAppTables()
  const pool = getPool()
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const tables = [
      "project_members",
      "project_skills",
      "lab_members",
      "lab_projects",
      "conversation_participants",
      "collaboration_members",
      "publication_authors",
      "notifications",
      "messages",
      "conversations",
      "collaborations",
      "collaboration_requests",
      "publications",
      "milestones",
      "tasks",
      "settings",
      "projects",
      "labs",
      "users",
    ]

    for (const table of tables) {
      await connection.query(`DELETE FROM ${table}`)
    }

    for (const user of seed.users) {
      await connection.query(
        `INSERT INTO users (id, name, email, password, university, department, role, bio, research_interests, skills, avatar_seed, joined_at, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.name,
          user.email,
          user.password,
          user.university || null,
          user.department || null,
          user.role,
          user.bio || "",
          JSON.stringify(user.researchInterests || []),
          JSON.stringify(user.skills || []),
          user.avatarSeed || user.name?.slice(0, 2).toUpperCase() || "CR",
          toMysqlDatetime(user.joinedAt, new Date()),
          user.active === false ? 0 : 1,
        ],
      )
    }

    const seedUserIds = new Set(seed.users.map((u) => u.id))
    for (const project of seed.projects) {
      if (!project.supervisorId || !seedUserIds.has(project.supervisorId)) {
        project.supervisorId = "user-admin-1"
      }
      await connection.query(
        `INSERT INTO projects (id, supervisor_id, title, description, field, skills, status, progress, max_members, start_date, end_date, created_at, lab_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          project.id,
          project.supervisorId,
          project.title,
          project.description,
          project.field,
          JSON.stringify(project.skills || []),
          project.status,
          project.progress || 0,
          project.maxMembers || null,
          project.startDate ? toMysqlDate(project.startDate, new Date()) : null,
          project.endDate ? toMysqlDate(project.endDate, new Date()) : null,
          toMysqlDatetime(project.createdAt, new Date()),
          project.labId || null,
        ],
      )

      for (const memberId of project.memberIds || []) {
        const pmId = `project-member-${project.id}-${memberId}`
        await connection.query(
          `INSERT INTO project_members (id, project_id, user_id, joined_at) VALUES (?, ?, ?, ?)`,
          [pmId, project.id, memberId, toMysqlDatetime(new Date())],
        )
      }
      for (const skill of project.skills || []) {
        const psId = `project-skill-${project.id}-${skill}`
        await connection.query(`INSERT INTO project_skills (id, project_id, skill) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE skill = VALUES(skill)`, [psId, project.id, skill])
      }
    }

    const seedUserIds2 = seed.users.map((u) => u.id)
    for (const lab of seed.labs) {
      if (!lab.supervisorId || !seedUserIds2.includes(lab.supervisorId)) {
        lab.supervisorId = "user-admin-1"
      }
      await connection.query(
        `INSERT INTO labs (id, supervisor_id, name, department, description, research_areas, member_ids, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [lab.id, lab.supervisorId, lab.name, lab.department, lab.description, JSON.stringify(lab.researchAreas || []), JSON.stringify(lab.memberIds || []), toMysqlDatetime(lab.createdAt, new Date())],
      )

      for (const projectId of lab.projectIds || []) {
        const lpId = `lab-project-${lab.id}-${projectId}`
        await connection.query(
          `INSERT INTO lab_projects (id, lab_id, project_id, created_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE created_at = VALUES(created_at)`,
          [lpId, lab.id, projectId, toMysqlDatetime(new Date())],
        )
      }
      for (const memberId of lab.memberIds || []) {
        const lmId = `lab-member-${lab.id}-${memberId}`
        await connection.query(`INSERT INTO lab_members (id, lab_id, user_id, joined_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE joined_at = VALUES(joined_at)`, [lmId, lab.id, memberId, toMysqlDatetime(new Date())])
      }
    }

    for (const request of seed.collaborationRequests) {
      await connection.query(
        `INSERT INTO collaboration_requests (id, sender_id, receiver_id, project_id, lab_id, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [request.id, request.senderId, request.receiverId, request.projectId || null, request.labId || null, request.message || "", request.status, toMysqlDatetime(request.createdAt, new Date())],
      )
    }

    for (const collaboration of seed.collaborations) {
      await connection.query(
        `INSERT INTO collaborations (id, project_id, lab_id, user_ids, role, status, started_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [collaboration.id, collaboration.projectId || null, collaboration.labId || null, JSON.stringify(collaboration.userIds || []), collaboration.role || "Researcher", collaboration.status || "active", toMysqlDatetime(collaboration.startedAt, new Date()), toMysqlDatetime(collaboration.createdAt || collaboration.startedAt, new Date())],
      )
      for (const userId of collaboration.userIds || []) {
        const cmId = `collab-member-${collaboration.id}-${userId}`
        await connection.query(`INSERT INTO collaboration_members (id, collaboration_id, user_id, role, joined_at) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE role = VALUES(role)`, [cmId, collaboration.id, userId, collaboration.role || "Researcher", toMysqlDatetime(new Date())])
      }
    }

    for (const conversation of seed.conversations) {
      await connection.query(
        `INSERT INTO conversations (id, subject, participant_ids, message_ids, conversation_type, project_id, lab_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [conversation.id, conversation.subject || "Direct message", JSON.stringify(conversation.participantIds || []), JSON.stringify(conversation.messageIds || []), conversation.type || "direct", conversation.projectId || null, conversation.labId || null, toMysqlDatetime(conversation.updatedAt || conversation.createdAt, new Date())],
      )
      for (const participantId of conversation.participantIds || []) {
        const cpId = `conv-part-${conversation.id}-${participantId}`
        await connection.query(`INSERT INTO conversation_participants (id, conversation_id, user_id, joined_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE joined_at = VALUES(joined_at)`, [cpId, conversation.id, participantId, toMysqlDatetime(new Date())])
      }
    }

    for (const message of seed.messages) {
      await connection.query(
        `INSERT INTO messages (id, conversation_id, sender_id, receiver_id, content, read_flag, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [message.id, message.conversationId, message.senderId, message.receiverId, message.content || "", message.read ? 1 : 0, toMysqlDatetime(message.createdAt, new Date())],
      )
    }

    for (const task of seed.tasks) {
      await connection.query(
        `INSERT INTO tasks (id, project_id, assigned_to, created_by, title, description, priority, status, due_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [task.id, task.projectId || null, task.assignedTo || null, task.createdBy || "", task.title, task.description || "", task.priority || "Medium", task.status || "Todo", task.dueDate ? toMysqlDate(task.dueDate) : null, toMysqlDatetime(task.createdAt, new Date())],
      )
    }

    for (const milestone of seed.milestones) {
      await connection.query(
        `INSERT INTO milestones (id, project_id, title, description, due_date, status, progress, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [milestone.id, milestone.projectId || null, milestone.title, milestone.description || "", milestone.dueDate ? toMysqlDate(milestone.dueDate) : null, milestone.status || "Todo", milestone.progress || 0, milestone.createdBy || "", toMysqlDatetime(milestone.createdAt, new Date())],
      )
    }

    for (const publication of seed.publications) {
      await connection.query(
        `INSERT INTO publications (id, project_id, author_ids, title, venue, year, status, link, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [publication.id, publication.projectId || null, JSON.stringify(publication.authorIds || []), publication.title, publication.venue || "", publication.year || new Date().getFullYear(), publication.status || "Draft", publication.link || "", publication.createdBy || "", toMysqlDatetime(publication.createdAt, new Date())],
      )
      for (let i = 0; i < (publication.authorIds || []).length; i++) {
        const authorId = publication.authorIds[i]
        const paId = `pub-auth-${publication.id}-${authorId}`
        await connection.query(`INSERT INTO publication_authors (id, publication_id, author_id, author_order) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE author_order = VALUES(author_order)`, [paId, publication.id, authorId, i])
      }
    }

    for (const notification of seed.notifications) {
      await connection.query(
        `INSERT INTO notifications (id, user_id, type, title, message, href, related_id, read_flag, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [notification.id, notification.userId, notification.type || "info", notification.title || "", notification.message || "", notification.href || "/", notification.relatedId || null, notification.read ? 1 : 0, toMysqlDatetime(notification.createdAt, new Date())],
      )
    }

    for (const [userId, settingsValue] of Object.entries(seed.settings || {})) {
      await connection.query(
        `INSERT INTO settings (id, user_id, notifications, appearance, privacy, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [`settings-${userId}`, userId, JSON.stringify(settingsValue.notifications || {}), JSON.stringify(settingsValue.appearance || {}), JSON.stringify(settingsValue.privacy || {}), toMysqlDatetime(new Date())],
      )
    }

    await connection.query("INSERT INTO app_state (id, payload) VALUES (?, ?) ON DUPLICATE KEY UPDATE payload = VALUES(payload)", [STATE_ROW_ID, JSON.stringify(seed)])
    await connection.commit()
    return seed
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

async function loadStateFromSql() {
  await ensureAppTables()
  const pool = getPool()
  const [users] = await pool.query("SELECT * FROM users")
  const [projects] = await pool.query("SELECT * FROM projects")
  const [projectMembers] = await pool.query("SELECT * FROM project_members")
  const [projectSkills] = await pool.query("SELECT * FROM project_skills")
  const [labMembers] = await pool.query("SELECT * FROM lab_members")
  const [conversationParticipants] = await pool.query("SELECT * FROM conversation_participants")
  const [collaborationMembers] = await pool.query("SELECT * FROM collaboration_members")
  const [publicationAuthors] = await pool.query("SELECT * FROM publication_authors")
  const [labs] = await pool.query("SELECT * FROM labs")
  const [labProjects] = await pool.query("SELECT * FROM lab_projects")
  const [requests] = await pool.query("SELECT * FROM collaboration_requests")
  const [collaborations] = await pool.query("SELECT * FROM collaborations")
  const [conversations] = await pool.query("SELECT * FROM conversations")
  const [messages] = await pool.query("SELECT * FROM messages")
  const [tasks] = await pool.query("SELECT * FROM tasks")
  const [milestones] = await pool.query("SELECT * FROM milestones")
  const [publications] = await pool.query("SELECT * FROM publications")
  const [notifications] = await pool.query("SELECT * FROM notifications")
  const [settingsRows] = await pool.query("SELECT * FROM settings")

  const projectMemberMap = new Map()
  for (const row of projectMembers) {
    if (!projectMemberMap.has(row.project_id)) projectMemberMap.set(row.project_id, [])
    projectMemberMap.get(row.project_id).push(row.user_id)
  }

  const projectSkillsMap = new Map()
  for (const row of projectSkills || []) {
    if (!projectSkillsMap.has(row.project_id)) projectSkillsMap.set(row.project_id, [])
    projectSkillsMap.get(row.project_id).push(row.skill)
  }

  const labProjectMap = new Map()
  for (const row of labProjects) {
    if (!labProjectMap.has(row.lab_id)) labProjectMap.set(row.lab_id, [])
    labProjectMap.get(row.lab_id).push(row.project_id)
  }

  const labMemberMap = new Map()
  for (const row of labMembers || []) {
    if (!labMemberMap.has(row.lab_id)) labMemberMap.set(row.lab_id, [])
    labMemberMap.get(row.lab_id).push(row.user_id)
  }

  const normalizedProjects = projects.map((project) => ({
    ...project,
    memberIds: projectMemberMap.get(project.id) || [],
    skills: projectSkillsMap.get(project.id) || jsonArray(project.skills),
    startDate: getValue(project, "start_date"),
    endDate: getValue(project, "end_date"),
    supervisorId: project.supervisor_id,
    labId: project.lab_id,
    createdAt: project.created_at,
  }))

  const normalizedLabs = labs.map((lab) => ({
    ...lab,
    supervisorId: lab.supervisor_id,
    researchAreas: jsonArray(lab.research_areas),
    memberIds: labMemberMap.get(lab.id) || jsonArray(lab.member_ids),
    projectIds: labProjectMap.get(lab.id) || [],
    createdAt: lab.created_at,
  }))

  const normalizedUsers = users.map((user) => ({
    ...user,
    researchInterests: jsonArray(user.research_interests),
    skills: jsonArray(user.skills),
    avatarSeed: user.avatar_seed,
    joinedAt: user.joined_at,
    active: toBoolean(user.active),
  }))

  const normalizedConversations = conversations.map((conversation) => ({
    ...conversation,
    type: conversation.conversation_type || "direct",
    projectId: conversation.project_id || null,
    labId: conversation.lab_id || null,
    participantIds: (conversationParticipants || []).filter(p => p.conversation_id === conversation.id).map(p => p.user_id) || jsonArray(conversation.participant_ids),
    messageIds: jsonArray(conversation.message_ids),
    updatedAt: conversation.updated_at,
    createdAt: conversation.created_at,
  }))

  const normalizedMessages = messages.map((message) => ({
    ...message,
    conversationId: message.conversation_id,
    senderId: message.sender_id,
    receiverId: message.receiver_id,
    read: toBoolean(message.read_flag),
    createdAt: message.created_at,
  }))

  const normalizedNotifications = notifications.map((notification) => ({
    ...notification,
    userId: notification.user_id,
    relatedId: notification.related_id,
    read: toBoolean(notification.read_flag),
    createdAt: notification.created_at,
  }))

  // Attach collaboration members and publication authors where available
  const collaborationsMap = new Map()
  for (const row of collaborations) {
    collaborationsMap.set(row.id, { ...row, userIds: jsonArray(row.user_ids) })
  }
  for (const row of collaborationMembers || []) {
    const coll = collaborationsMap.get(row.collaboration_id)
    if (coll) {
      coll.userIds = coll.userIds || []
      coll.userIds.push(row.user_id)
    }
  }

  const publicationsMap = new Map()
  for (const row of publications) {
    publicationsMap.set(row.id, { ...row, authorIds: jsonArray(row.author_ids) })
  }
  for (const row of publicationAuthors || []) {
    const pub = publicationsMap.get(row.publication_id)
    if (pub) {
      pub.authorIds = pub.authorIds || []
      pub.authorIds.push(row.author_id)
    }
  }

  const settings = {}
  for (const row of settingsRows) {
    settings[row.user_id] = {
      notifications: parseJsonValue(row.notifications, {}),
      appearance: parseJsonValue(row.appearance, { compactMode: false, theme: "light" }),
      privacy: parseJsonValue(row.privacy, {}),
    }
  }

  const builtState = {
    users: normalizedUsers,
    projects: normalizedProjects,
    labs: normalizedLabs,
    collaborationRequests: requests.map((request) => ({
      ...request,
      senderId: request.sender_id,
      receiverId: request.receiver_id,
      projectId: request.project_id,
      labId: request.lab_id,
      createdAt: request.created_at,
      updatedAt: request.updated_at,
    })),
    collaborations: Array.from(collaborationsMap.values()).map((collaboration) => ({
      ...collaboration,
      projectId: collaboration.project_id,
      labId: collaboration.lab_id,
      userIds: collaboration.userIds || [],
      startedAt: collaboration.started_at,
      createdAt: collaboration.created_at,
      updatedAt: collaboration.updated_at,
    })),
    conversations: normalizedConversations,
    messages: normalizedMessages,
    tasks: tasks.map((task) => ({
      ...task,
      projectId: task.project_id,
      assignedTo: task.assigned_to,
      createdBy: task.created_by,
      dueDate: task.due_date,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    })),
    milestones: milestones.map((milestone) => ({
      ...milestone,
      projectId: milestone.project_id,
      dueDate: milestone.due_date,
      createdBy: milestone.created_by,
      createdAt: milestone.created_at,
      updatedAt: milestone.updated_at,
    })),
    publications: Array.from(publicationsMap.values()).map((publication) => ({
      ...publication,
      projectId: publication.project_id,
      authorIds: publication.authorIds || [],
      createdBy: publication.created_by,
      createdAt: publication.created_at,
      updatedAt: publication.updated_at,
    })),
    notifications: normalizedNotifications,
    settings,
  }

  const [stateRows] = await pool.query("SELECT payload FROM app_state WHERE id = ?", [STATE_ROW_ID])
  const payload = parseJsonValue(stateRows[0]?.payload, {})
  builtState.updatedAt = payload.updatedAt || new Date().toISOString()
  return builtState
}

let seedStatePromise = null

async function ensureSeedState() {
  if (seedStatePromise) {
    return seedStatePromise
  }

  seedStatePromise = (async () => {
    await ensureAppTables()
    const pool = getPool()
    const [rows] = await pool.query("SELECT COUNT(*) AS total FROM users")
    if (Number(rows[0].total) > 0) {
      return loadStateFromSql()
    }

    const seed = createSeedDatabase()
    return seedStateIntoSql(seed)
  })()

  try {
    return await seedStatePromise
  } finally {
    seedStatePromise = null
  }
}

async function loadStateRow() {
  const state = await ensureSeedState()
  return state
}

export async function loadAppState() {
  return loadStateRow()
}

export async function saveAppState(nextState) {
  await ensureAppTables()
  const pool = getPool()
  const connection = await pool.getConnection()
  const stateToSave = {
    ...nextState,
    updatedAt: nextState.updatedAt || new Date().toISOString(),
  }

  try {
    await connection.beginTransaction()

    const tables = [
      "project_members",
      "lab_projects",
      "notifications",
      "messages",
      "conversations",
      "collaborations",
      "collaboration_requests",
      "publications",
      "milestones",
      "tasks",
      "settings",
      "projects",
      "labs",
      "users",
    ]

    for (const table of tables) {
      await connection.query(`DELETE FROM ${table}`)
    }

    for (const user of stateToSave.users || []) {
      await connection.query(
        `INSERT INTO users (id, name, email, password, university, department, role, bio, research_interests, skills, avatar_seed, joined_at, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.name,
          user.email,
          user.password,
          user.university || null,
          user.department || null,
          user.role,
          user.bio || "",
          JSON.stringify(user.researchInterests || []),
          JSON.stringify(user.skills || []),
          user.avatarSeed || (user.name || "CR").slice(0, 2).toUpperCase(),
          toMysqlDatetime(user.joinedAt, new Date()),
          user.active === false ? 0 : 1,
        ],
      )
    }

    for (const project of stateToSave.projects || []) {
      await connection.query(
        `INSERT INTO projects (id, supervisor_id, title, description, field, skills, status, progress, max_members, start_date, end_date, created_at, lab_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          project.id,
          project.supervisorId,
          project.title,
          project.description,
          project.field,
          JSON.stringify(project.skills || []),
          project.status,
          project.progress || 0,
          project.maxMembers || null,
          project.startDate ? toMysqlDate(project.startDate, new Date()) : null,
          project.endDate ? toMysqlDate(project.endDate, new Date()) : null,
          toMysqlDatetime(project.createdAt, new Date()),
          project.labId || null,
        ],
      )

      for (const memberId of project.memberIds || []) {
        await connection.query(
          `INSERT INTO project_members (id, project_id, user_id, joined_at) VALUES (?, ?, ?, ?)`,
          [`project-member-${project.id}-${memberId}`, project.id, memberId, toMysqlDatetime(new Date())],
        )
      }
      for (const skill of project.skills || []) {
        await connection.query(`INSERT INTO project_skills (id, project_id, skill) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE skill = VALUES(skill)`, [`project-skill-${project.id}-${skill}`, project.id, skill])
      }
    }

    for (const lab of stateToSave.labs || []) {
      await connection.query(
        `INSERT INTO labs (id, supervisor_id, name, department, description, research_areas, member_ids, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [lab.id, lab.supervisorId, lab.name, lab.department, lab.description, JSON.stringify(lab.researchAreas || []), JSON.stringify(lab.memberIds || []), toMysqlDatetime(lab.createdAt, new Date())],
      )

      for (const projectId of lab.projectIds || []) {
        await connection.query(
          `INSERT INTO lab_projects (id, lab_id, project_id, created_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE created_at = VALUES(created_at)`,
          [`lab-project-${lab.id}-${projectId}`, lab.id, projectId, toMysqlDatetime(new Date())],
        )
      }
      for (const memberId of lab.memberIds || []) {
        await connection.query(`INSERT INTO lab_members (id, lab_id, user_id, joined_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE joined_at = VALUES(joined_at)`, [`lab-member-${lab.id}-${memberId}`, lab.id, memberId, toMysqlDatetime(new Date())])
      }
    }

    for (const request of stateToSave.collaborationRequests || []) {
      await connection.query(
        `INSERT INTO collaboration_requests (id, sender_id, receiver_id, project_id, lab_id, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [request.id, request.senderId, request.receiverId, request.projectId || null, request.labId || null, request.message || "", request.status, toMysqlDatetime(request.createdAt, new Date())],
      )
    }

    for (const collaboration of stateToSave.collaborations || []) {
      await connection.query(
        `INSERT INTO collaborations (id, project_id, lab_id, user_ids, role, status, started_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [collaboration.id, collaboration.projectId || null, collaboration.labId || null, JSON.stringify(collaboration.userIds || []), collaboration.role || "Researcher", collaboration.status || "active", toMysqlDatetime(collaboration.startedAt, new Date()), toMysqlDatetime(collaboration.createdAt || collaboration.startedAt, new Date())],
      )
      for (const userId of collaboration.userIds || []) {
        await connection.query(`INSERT INTO collaboration_members (id, collaboration_id, user_id, role, joined_at) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE role = VALUES(role)`, [`collab-member-${collaboration.id}-${userId}`, collaboration.id, userId, collaboration.role || "Researcher", toMysqlDatetime(new Date())])
      }
    }

    for (const conversation of stateToSave.conversations || []) {
      await connection.query(
        `INSERT INTO conversations (id, subject, participant_ids, message_ids, conversation_type, project_id, lab_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [conversation.id, conversation.subject || "Direct message", JSON.stringify(conversation.participantIds || []), JSON.stringify(conversation.messageIds || []), conversation.type || "direct", conversation.projectId || null, conversation.labId || null, toMysqlDatetime(conversation.updatedAt || conversation.createdAt, new Date())],
      )
      for (const participantId of conversation.participantIds || []) {
        await connection.query(`INSERT INTO conversation_participants (id, conversation_id, user_id, joined_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE joined_at = VALUES(joined_at)`, [`conv-part-${conversation.id}-${participantId}`, conversation.id, participantId, toMysqlDatetime(new Date())])
      }
    }

    for (const message of stateToSave.messages || []) {
      await connection.query(
        `INSERT INTO messages (id, conversation_id, sender_id, receiver_id, content, read_flag, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [message.id, message.conversationId, message.senderId, message.receiverId, message.content || "", message.read ? 1 : 0, toMysqlDatetime(message.createdAt, new Date())],
      )
    }

    for (const task of stateToSave.tasks || []) {
      await connection.query(
        `INSERT INTO tasks (id, project_id, assigned_to, created_by, title, description, priority, status, due_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [task.id, task.projectId || null, task.assignedTo || null, task.createdBy || "", task.title, task.description || "", task.priority || "Medium", task.status || "Todo", task.dueDate ? toMysqlDate(task.dueDate) : null, toMysqlDatetime(task.createdAt, new Date())],
      )
    }

    for (const milestone of stateToSave.milestones || []) {
      await connection.query(
        `INSERT INTO milestones (id, project_id, title, description, due_date, status, progress, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [milestone.id, milestone.projectId || null, milestone.title, milestone.description || "", milestone.dueDate ? toMysqlDate(milestone.dueDate) : null, milestone.status || "Todo", milestone.progress || 0, milestone.createdBy || "", toMysqlDatetime(milestone.createdAt, new Date())],
      )
    }

    for (const publication of stateToSave.publications || []) {
      await connection.query(
        `INSERT INTO publications (id, project_id, author_ids, title, venue, year, status, link, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [publication.id, publication.projectId || null, JSON.stringify(publication.authorIds || []), publication.title, publication.venue || "", publication.year || new Date().getFullYear(), publication.status || "Draft", publication.link || "", publication.createdBy || "", toMysqlDatetime(publication.createdAt, new Date())],
      )
      for (let i = 0; i < (publication.authorIds || []).length; i++) {
        const authorId = publication.authorIds[i]
        await connection.query(`INSERT INTO publication_authors (id, publication_id, author_id, author_order) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE author_order = VALUES(author_order)`, [`pub-auth-${publication.id}-${authorId}`, publication.id, authorId, i])
      }
    }

    for (const notification of stateToSave.notifications || []) {
      await connection.query(
        `INSERT INTO notifications (id, user_id, type, title, message, href, related_id, read_flag, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [notification.id, notification.userId, notification.type || "info", notification.title || "", notification.message || "", notification.href || "/", notification.relatedId || null, notification.read ? 1 : 0, toMysqlDatetime(notification.createdAt, new Date())],
      )
    }

    for (const [userId, settingsValue] of Object.entries(stateToSave.settings || {})) {
      await connection.query(
        `INSERT INTO settings (id, user_id, notifications, appearance, privacy, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [`settings-${userId}`, userId, JSON.stringify(settingsValue.notifications || {}), JSON.stringify(settingsValue.appearance || {}), JSON.stringify(settingsValue.privacy || {}), toMysqlDatetime(new Date())],
      )
    }

    await connection.query("INSERT INTO app_state (id, payload) VALUES (?, ?) ON DUPLICATE KEY UPDATE payload = VALUES(payload)", [STATE_ROW_ID, JSON.stringify(stateToSave)])
    await connection.commit()
    return stateToSave
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function getUserFromCookie(userId) {
  if (!userId) return null
  const state = await loadStateRow()
  return state.users.find((user) => user.id === userId) || null
}
