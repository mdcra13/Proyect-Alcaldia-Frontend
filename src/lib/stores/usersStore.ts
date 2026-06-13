import { create } from 'zustand';
import type { User } from '@/lib/types';

// Datos mock de usuarios
const mockUsers: User[] = [
  {
    id: '1',
    nombre: 'Ana',
    apellido: 'González',
    username: 'ana.gonzalez',
    role: 'secretaria',
    departamentoId: '1',
    departamento: { id: '1', nombre: 'Secretaría General', descripcion: '', activo: true },
    status: 'active',
    avatar: null,
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    id: '2',
    nombre: 'Carlos',
    apellido: 'López',
    username: 'carlos.lopez',
    role: 'departamento',
    departamentoId: '2',
    departamento: { id: '2', nombre: 'Despacho Alcaldía', descripcion: '', activo: true },
    status: 'active',
    avatar: null,
    createdAt: '2025-02-10T09:30:00Z',
  },
  {
    id: '3',
    nombre: 'María',
    apellido: 'Ramírez',
    username: 'maria.ramirez',
    role: 'alcalde',
    departamentoId: undefined,
    departamento: undefined,
    status: 'active',
    avatar: null,
    createdAt: '2025-01-20T14:15:00Z',
  },
  {
    id: '4',
    nombre: 'Luis',
    apellido: 'Fernández',
    username: 'luis.fernandez',
    role: 'it',
    departamentoId: undefined,
    departamento: undefined,
    status: 'active',
    avatar: null,
    createdAt: '2025-03-01T11:45:00Z',
  },
  {
    id: '5',
    nombre: 'Elena',
    apellido: 'Martínez',
    username: 'elena.martinez',
    role: 'secretaria',
    departamentoId: '1',
    departamento: { id: '1', nombre: 'Secretaría General', descripcion: '', activo: true },
    status: 'inactive',
    avatar: null,
    createdAt: '2025-02-28T08:20:00Z',
  },
  {
    id: '6',
    nombre: 'Jorge',
    apellido: 'Díaz',
    username: 'jorge.diaz',
    role: 'departamento',
    departamentoId: '3',
    departamento: { id: '3', nombre: 'Ayuda Social', descripcion: '', activo: true },
    status: 'active',
    avatar: null,
    createdAt: '2025-03-10T16:00:00Z',
  },
];

interface UsersStore {
  users: User[];
  isLoading: boolean;
  fetchUsers: () => Promise<void>;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
}

const useUsersStore = create<UsersStore>((set) => ({
  users: mockUsers,
  isLoading: false,
  fetchUsers: async () => {
    // TODO: GET /api/v1/users
    set({ isLoading: true });
    await new Promise(resolve => setTimeout(resolve, 500));
    set({ users: mockUsers, isLoading: false });
  },
  addUser: async (userData) => {
    // TODO: POST /api/v1/users
    const newUser: User = {
      ...userData,
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ users: [...state.users, newUser] }));
  },
  updateUser: async (id, updates) => {
    // TODO: PATCH /api/v1/users/:id
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    }));
  },
}));

export default useUsersStore;