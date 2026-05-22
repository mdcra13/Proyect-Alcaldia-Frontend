import { Navigate } from 'react-router-dom'
import useAuthStore from '@/lib/stores/authStore'
import type { UserRole } from '@/lib/types'
import LoginPage from './LoginPage';

type ProtectedRouteProps = {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === 'alcalde') {
      return <Navigate to="/alcalde" replace />
    }

    return <Navigate to="/secretaria" replace />
  }

  return <>{children}</>
}

export function AuthRedirect() {
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated && user) {
    if (user.role === 'alcalde') {
      return <Navigate to="/alcalde" replace />
    }

    return <Navigate to="/secretaria" replace />
  }

  return <LoginPage />
}