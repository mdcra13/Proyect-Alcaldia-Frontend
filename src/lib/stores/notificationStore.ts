import { create } from 'zustand'
import type { Notification as AppNotification, NotificationType } from '@/lib/types'

const mockNotifications: AppNotification[] = [
  {
    id: '1',
    message: 'La solicitud #1042 fue aprobada por el departamento',
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
    message: 'La solicitud #1039 fue devuelta al departamento',
    type: 'warning',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '4',
    message: 'La solicitud #1038 fue rechazada por Alcaldía',
    type: 'error',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
]

interface NotificationState {
  notificaciones: AppNotification[]
  notifications: AppNotification[]
  addNotification: (notification: { message: string; type: NotificationType }) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  unreadCount: () => number
}

const useNotificationStore = create<NotificationState>((set, get) => ({
  notificaciones: mockNotifications,
  notifications: mockNotifications,

  addNotification: (notification) => {
    const newNotification: AppNotification = {
      ...notification,
      id: crypto.randomUUID(),
      read: false,
      createdAt: new Date().toISOString(),
    }

    set((state) => {
      const nextNotifications = [newNotification, ...state.notificaciones]

      return {
        notificaciones: nextNotifications,
        notifications: nextNotifications,
      }
    })
  },

  markAsRead: (id: string) => {
    set((state) => {
      const nextNotifications = state.notificaciones.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )

      return {
        notificaciones: nextNotifications,
        notifications: nextNotifications,
      }
    })
  },

  markAllAsRead: () => {
    set((state) => {
      const nextNotifications = state.notificaciones.map((notification) => ({
        ...notification,
        read: true,
      }))

      return {
        notificaciones: nextNotifications,
        notifications: nextNotifications,
      }
    })
  },

  unreadCount: (): number => {
    return get().notificaciones.filter((notification) => !notification.read).length
  },
}))

export default useNotificationStore