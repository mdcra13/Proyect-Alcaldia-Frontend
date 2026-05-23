interface Notification {
  id: string
  message: string
  read: boolean
  createdAt: string
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: () => number
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
}

const useNotificationStore = (): NotificationState => ({
  notifications: [],
  unreadCount: () => 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
})

export default useNotificationStore