const nowIso = () => new Date().toISOString()

function markNotificationReadOnState(state, notificationId, userId) {
  const notification = state.notifications.find((item) => item.id === notificationId)
  if (!notification) return false
  if (userId && notification.userId !== userId) {
    throw new Error("Not authorized")
  }
  notification.read = true
  state.updatedAt = nowIso()
  return true
}

function markAllNotificationsReadOnState(state, userId) {
  state.notifications.forEach((notification) => {
    if (notification.userId === userId) {
      notification.read = true
    }
  })
  state.updatedAt = nowIso()
}

function markRequestNotificationsReadOnState(state, requestId, userId) {
  state.notifications.forEach((notification) => {
    if (
      notification.userId === userId &&
      notification.relatedId === requestId &&
      (notification.type === "request_received" || notification.type === "request_accepted" || notification.type === "request_rejected")
    ) {
      notification.read = true
    }
  })
}

export {
  markAllNotificationsReadOnState,
  markNotificationReadOnState,
  markRequestNotificationsReadOnState,
}
