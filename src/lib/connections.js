function getDatabaseRef(getDatabase) {
  return typeof getDatabase === "function" ? getDatabase() : getDatabase
}

function getConnectedUserIds(getDatabase, userId) {
  const db = getDatabaseRef(getDatabase)
  const connected = new Set()

  db.collaborations.forEach((collaboration) => {
    if (!collaboration.userIds?.includes(userId)) return
    collaboration.userIds.forEach((memberId) => {
      if (memberId !== userId) connected.add(memberId)
    })
  })

  db.projects.forEach((project) => {
    const isMember = project.memberIds?.includes(userId) || project.supervisorId === userId
    if (!isMember) return
    connected.add(project.supervisorId)
    project.memberIds?.forEach((memberId) => {
      if (memberId !== userId) connected.add(memberId)
    })
  })

  db.labs.forEach((lab) => {
    const members = lab.memberIds || []
    const isMember = members.includes(userId) || lab.supervisorId === userId
    if (!isMember) return
    connected.add(lab.supervisorId)
    members.forEach((memberId) => {
      if (memberId !== userId) connected.add(memberId)
    })
  })

  db.collaborationRequests.forEach((request) => {
    if (request.status !== "accepted") return
    if (request.senderId === userId) connected.add(request.receiverId)
    if (request.receiverId === userId) connected.add(request.senderId)
  })

  connected.delete(userId)
  return Array.from(connected)
}

function isConnected(getDatabase, viewerId, targetId) {
  if (!viewerId || !targetId || viewerId === targetId) return false
  return getConnectedUserIds(getDatabase, viewerId).includes(targetId)
}

export { getConnectedUserIds, isConnected }
