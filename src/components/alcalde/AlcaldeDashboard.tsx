import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Check,
  CheckCircle,
  FileText,
  Inbox,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import useSolicitudesStore from '@/lib/stores/solicitudesStore'
import useAuthStore from '@/lib/stores/authStore'

type ColorType = 'default' | 'amber' | 'green' | 'red'

interface StatCardProps {
  title: string
  value: number
  icon: LucideIcon
  color?: ColorType
  trend?: string
}

function StatCard({ title, value, icon: Icon, color = 'default', trend }: StatCardProps) {
  const cardColorClass: Record<ColorType, string> = {
    default: '',
    amber: 'stat-card-amber',
    green: 'stat-card-green',
    red: 'stat-card-red',
  }

  const iconColorClass: Record<ColorType, string> = {
    default: '',
    amber: 'stat-icon-amber',
    green: 'stat-icon-green',
    red: 'stat-icon-red',
  }

  return (
    <div className={`stat-card ${cardColorClass[color]}`}>
      <div className="stat-card-inner">
        <div>
          <p className="stat-label">{title}</p>
          <p className="stat-value">{value}</p>

          {trend && (
            <p className="stat-trend">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </p>
          )}
        </div>

        <div className={`stat-icon ${iconColorClass[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

type NavColorType = 'amber' | 'green'

interface NavigationCardProps {
  title: string
  description: string
  icon: LucideIcon
  color: NavColorType
  count?: number
  onClick: () => void
}

function NavigationCard({
  title,
  description,
  icon: Icon,
  color,
  count,
  onClick,
}: NavigationCardProps) {
  const iconColorClass: Record<NavColorType, string> = {
    amber: 'dashboard-nav-icon-amber group-hover:bg-warning group-hover:text-warning-foreground',
    green: 'dashboard-nav-icon-green group-hover:bg-success group-hover:text-success-foreground',
  }

  const hoverColorClass: Record<NavColorType, string> = {
    amber: 'hover:border-warning/50',
    green: 'hover:border-success/50',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`dashboard-nav-card group hover:shadow-lg ${hoverColorClass[color]}`}
    >
      <div className="dashboard-nav-card-content">
        <div className={`dashboard-nav-icon ${iconColorClass[color]}`}>
          <Icon className="h-8 w-8" />
        </div>

        <div className="flex-1">
          <h3 className="mb-1 font-serif text-xl font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-muted-foreground">{description}</p>

          {count !== undefined && (
            <p className="mt-2 text-2xl font-bold text-foreground">{count}</p>
          )}
        </div>
      </div>
    </button>
  )
}

function DashboardSkeleton() {
  return (
    <>
      <div className="dashboard-section">
        <div className="skeleton-card h-20" />
      </div>

      <div className="dashboard-stats-grid lg:grid-cols-4">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>

      <div className="dashboard-nav-grid md:grid-cols-2">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
    </>
  )
}

export default function AlcaldeDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const getStats = useSolicitudesStore(state => state.getStats)
  const stats = getStats()

  // TODO: Replace with API loading state when GET /api/v1/requests is connected.
  const isLoading = false

  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  if (isLoading) {
    return (
      <AppLayout title="Dashboard">
        <DashboardSkeleton />
      </AppLayout>
    )
  }

  if (stats.total === 0) {
    return (
      <AppLayout title="Dashboard">
        <section className="dashboard-section">
          <h1 className="dashboard-title">No hay datos</h1>
          <p className="dashboard-subtitle">No hay datos</p>
        </section>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Dashboard">
      <div className="dashboard-section">
        <h2 className="dashboard-title">
          Bienvenido, {user?.nombre?.split(' ')[0] || 'Alcalde'}
        </h2>
        <p className="dashboard-subtitle capitalize">{currentDate}</p>
      </div>

      <div className="dashboard-stats-grid lg:grid-cols-4">
        <StatCard title="Total Solicitudes" value={stats.total} icon={FileText} />
        <StatCard
          title="Pendientes"
          value={stats.pendientes}
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Aprobadas"
          value={stats.aprobadas}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Declinadas"
          value={stats.declinadas}
          icon={FileText}
          color="red"
        />
      </div>

      <div className="dashboard-nav-grid md:grid-cols-2">
        <NavigationCard
          title="Asuntos Pendientes"
          description="Solicitudes que requieren su revisión y aprobación"
          icon={Inbox}
          color="amber"
          count={stats.pendientes}
          onClick={() => navigate('/alcalde/pendientes')}
        />

        <NavigationCard
          title="Asuntos Aprobados"
          description="Historial de solicitudes aprobadas"
          icon={Check}
          color="green"
          count={stats.aprobadas}
          onClick={() => navigate('/alcalde/pendientes?status=aprobado')}
        />
      </div>
    </AppLayout>
  )
}