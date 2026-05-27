import { create } from 'zustand'
import type { AppNotification, NotificationType } from '@/lib/types'

const mockNotifications: AppNotification[] = [
  {
    id: '1',
    message: 'La solicitud #1042 fue aprobada',
    type: 'success',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: '2',
    message: 'Nueva solicitud registrada: #1043',
    type: 'info',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '3',
    message: 'La solicitud #1039 fue declinada',
    type: 'warning',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '4',
    message: 'Se ha agregado un nuevo usuario al sistema',
    type: 'info',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
]

interface NotificationState {
  notifications: AppNotification[]
  unreadCount: () => number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  addNotification: (notification: { message: string; type: NotificationType }) => void
}

const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: mockNotifications,

  unreadCount: (): number => {
    return get().notifications.filter((n) => !n.read).length
  },

  markAsRead: (id: string) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    }))
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }))
  },

  addNotification: (notification: { message: string; type: NotificationType }) => {
    const newNotification: AppNotification = {
      ...notification,
      id: String(Date.now()),
      read: false,
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
    }))
  },
}))

export default useNotificationStore