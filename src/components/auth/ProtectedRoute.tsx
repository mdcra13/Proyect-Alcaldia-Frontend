import { Navigate } from 'react-router-dom'
import useAuthStore from '@/lib/stores/authStore'

type ProtectedRouteProps = {
  children: React.ReactNode
}

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}