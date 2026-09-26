import { create } from 'zustand'
import type { Notification as AppNotification, NotificationType } from '@/lib/types'

interface NotificationState {
  notificaciones: AppNotification[]
  notifications: AppNotification[]
  addNotification: (notification: { message: string; type: NotificationType }) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  unreadCount: () => number
}

const useNotificationStore = create<NotificationState>((set, get) => ({
  notificaciones: [],
  notifications: [],

  addNotification: notification => {
    const newNotification: AppNotification = {
      ...notification,
      id: crypto.randomUUID(),
      read: false,
      createdAt: new Date().toISOString(),
    }
    set(state => {
      const notifications = [newNotification, ...state.notificaciones]
      return { notificaciones: notifications, notifications }
    })
  },

  markAsRead: id => set(state => {
    const notifications = state.notificaciones.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    )
    return { notificaciones: notifications, notifications }
  }),

  markAllAsRead: () => set(state => {
    const notifications = state.notificaciones.map(notification => ({
      ...notification,
      read: true,
    }))
    return { notificaciones: notifications, notifications }
  }),

  unreadCount: () => get().notificaciones.filter(notification => !notification.read).length,
}))

export default useNotificationStore
