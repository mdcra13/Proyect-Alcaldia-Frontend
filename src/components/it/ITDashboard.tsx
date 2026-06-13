import { useMemo } from 'react';
import type { UserRole } from '@/lib/types';
import useAuthStore from '@/lib/stores/authStore';
import useUsersStore from '@/lib/stores/usersStore';
import useDepartamentosStore from '@/lib/stores/departamentosStore';
import { Users, Building2, UserCog, Briefcase, Shield, User } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<
  UserRole,
  { label: string; Icon: React.ElementType; color: string }
> = {
  secretaria:   { label: 'Secretaria',   Icon: User,      color: 'bg-blue-100 text-blue-700'    },
  departamento: { label: 'Departamento', Icon: Briefcase,  color: 'bg-green-100 text-green-700'  },
  alcalde:      { label: 'Alcalde',      Icon: Shield,     color: 'bg-purple-100 text-purple-700' },
  it:           { label: 'IT',           Icon: UserCog,    color: 'bg-slate-100 text-slate-700'   },
} as const;

const RECENT_USERS_LIMIT = 5;

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: UserRole }) {
  const { label, Icon, color } = ROLE_CONFIG[role];
  return (
    <span className={`role-badge ${color}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={active ? 'status-badge status-active' : 'status-badge status-inactive'}>
      <span className={`status-dot ${active ? 'bg-green-500' : 'bg-red-400'}`} aria-hidden="true" />
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  children: React.ReactNode;
}

function StatCard({ icon, iconClass, label, children }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconClass}`}>{icon}</div>
      <div className="min-w-0">
        <p className="stat-label">{label}</p>
        {children}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ITDashboard() {
  const { user } = useAuthStore();
  const { users } = useUsersStore();
  const { departamentos } = useDepartamentosStore();

  const { totalActivos, totalInactivos, usuariosPorRol, totalDepartamentosActivos, ultimosUsuarios } =
    useMemo(() => {
      const totalActivos   = users.filter((u) => u.status === 'active').length;
      const totalInactivos = users.filter((u) => u.status === 'inactive').length;

      const usuariosPorRol = users.reduce<Partial<Record<UserRole, number>>>(
        (acc, u) => ({ ...acc, [u.role]: (acc[u.role] ?? 0) + 1 }),
        {}
      );

      const totalDepartamentosActivos = departamentos.filter((d) => d.activo).length;

      const ultimosUsuarios = [...users]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, RECENT_USERS_LIMIT);

      return { totalActivos, totalInactivos, usuariosPorRol, totalDepartamentosActivos, ultimosUsuarios };
    }, [users, departamentos]);

  const displayName =
    [user?.nombre, user?.apellido].filter(Boolean).join(' ') || 'Operador';

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Panel de Administración</h1>
        <p className="greeting-text">Bienvenido, {displayName}</p>
      </div>

      {/* Stats */}
      <section aria-label="Estadísticas generales" className="stats-grid">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          iconClass="bg-green-100 text-green-700"
          label="Usuarios activos"
        >
          <p className="stat-value">{totalActivos}</p>
          <p className="stat-sub">Inactivos: {totalInactivos}</p>
        </StatCard>

        <StatCard
          icon={<UserCog className="h-5 w-5" />}
          iconClass="bg-slate-100 text-slate-700"
          label="Usuarios por rol"
        >
          <div className="flex flex-wrap gap-1 mt-1">
            {(Object.entries(ROLE_CONFIG) as [UserRole, (typeof ROLE_CONFIG)[UserRole]][]).map(
              ([role, { label, Icon, color }]) => (
                <span key={role} className={`role-badge ${color}`}>
                  <Icon className="h-3 w-3" aria-hidden="true" />
                  {label}: {usuariosPorRol[role] ?? 0}
                </span>
              )
            )}
          </div>
        </StatCard>

        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          iconClass="bg-purple-100 text-purple-700"
          label="Departamentos activos"
        >
          <p className="stat-value">{totalDepartamentosActivos}</p>
        </StatCard>
      </section>

      {/* Recent users */}
      <section aria-label="Usuarios recientes" className="recent-users-section">
        <h2>Usuarios recientes</h2>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {['Nombre completo', 'Username', 'Rol', 'Departamento', 'Estado'].map((col) => (
                  <th key={col} scope="col">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ultimosUsuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-table-cell">
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                ultimosUsuarios.map((u) => (
                  <tr key={u.id}>
                    <td className="font-medium">{u.nombre} {u.apellido}</td>
                    <td>{u.username}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td>{u.departamento?.nombre ?? '—'}</td>
                    <td><StatusBadge active={u.status === 'active'} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick access */}
      <nav aria-label="Accesos rápidos" className="quick-access">
        <a href="/it/usuarios" className="quick-link">Gestión de Usuarios</a>
        <a href="/it/departamentos" className="quick-link">Gestión de Departamentos</a>
      </nav>
    </div>
  );
}
