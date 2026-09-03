# Manual técnico del frontend
## Sistema de Ayuda Social — Alcaldía Municipal

Este manual está dirigido a desarrolladores que necesiten instalar, mantener
o ampliar el código del frontend.

---

## 1. Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Librería de UI | React | 19.2.5 |
| Lenguaje | TypeScript | 6.0.2 |
| Build tool / dev server | Vite | 8.0.10 |
| Estilos | Tailwind CSS | 4.3.0 |
| Enrutamiento | React Router DOM | 6.30.3 |
| Estado global | Zustand | 5.0.13 |
| Manejo de peticiones al servidor | TanStack React Query | 5.100.11 |
| Formularios | React Hook Form | 7.76.0 |
| Notificaciones (toasts) | Sonner | 2.0.7 |
| Iconografía | Lucide React | 1.17.0 |
| Utilidades de clases CSS | clsx + tailwind-merge | — |
| Pruebas | Vitest + Testing Library + vitest-axe | 4.1.8 / 16.3.2 / 1.0.0-pre.5 |
| Linter | ESLint + typescript-eslint | 10.2.1 / 8.58.2 |

---

## 2. Estructura de carpetas

```
src/
├── App.tsx                 # Router principal, QueryClientProvider, rutas protegidas por rol
├── main.tsx                # Punto de entrada de Vite
├── index.css                # Imports de Tailwind y de los archivos de utilities
├── App.css                  # Estilos puntuales fuera del sistema de utilities
├── styles/                   # Utilities de Tailwind v4 (@utility) organizadas por módulo
│   ├── theme.css                  # Variables del theme (colores, tipografía)
│   ├── utilities-shared.css       # Modales, botones, badges genéricos
│   ├── utilities-dashboard.css    # Stat cards, nav cards de los dashboards
│   ├── utilities-pendientes.css   # Badges de estado/categoría, filtros, tablas
│   ├── utilities-layout.css       # Sidebar, header
│   ├── utilities-login.css        # Pantalla de login
│   ├── utilities-seguimiento.css  # Tabs de seguimiento
│   └── utilities-subirDoc.css     # Formulario de subir documento
├── components/
│   ├── auth/            # LoginPage
│   ├── alcalde/          # AlcaldeDashboard, AlcaldeNotas
│   ├── secretaria/       # SecretariaDashboard, SecretariaNotas, SubirDocumento, SeguimientoSolicitudes
│   ├── departamento/     # DepartamentoDashboard, NotasPendientes, SeguimientoNotas
│   ├── it/                # ITDashboard, ITGestionUsuarios, ITGestionDepartamentos, UserFormModal
│   ├── layout/            # AppLayout, Header, Sidebar, MobileNav
│   └── shared/             # Componentes reutilizables por todos los roles (ver sección 5)
├── lib/
│   ├── stores/             # Zustand: authStore, solicitudesStore, departamentosStore, notificationStore
│   ├── hooks/               # Custom hooks (lógica de negocio reutilizable)
│   ├── types/                # Tipos TypeScript + constantes (ESTADO_CONFIG, ROLE_LABELS, etc.)
│   └── utils.ts               # Utilidad cn() para combinar clases (clsx + tailwind-merge)
└── test/                   # Suites de prueba (Vitest + vitest-axe), una por módulo principal
```

La organización es **por rol/feature**, no por tipo de archivo: cada
carpeta de `components/` agrupa todo lo que necesita un rol, y `shared/`
concentra lo reutilizable entre roles. Esto permite agregar un módulo o un
rol nuevo sin reestructurar el resto de la aplicación.

---

## 3. Modelo de datos (TypeScript)

Definido en `src/lib/types/index.ts`.

### 3.1 Roles (`UserRole`)

```ts
type UserRole = 'secretaria' | 'departamento' | 'alcalde' | 'it'
```

### 3.2 Estados de una solicitud (`SolicitudEstado`)

```ts
type SolicitudEstado =
  | 'received'                    // Recibida
  | 'assigned_to_department'      // Asignada a departamento
  | 'in_review'                   // En revisión
  | 'approved_by_department'      // Aprobada por departamento
  | 'rejected_by_department'      // Rechazada por departamento
  | 'awaiting_mayor_signature'    // Pendiente de firma
  | 'returned_to_department'      // Devuelta a departamento
  | 'rejected_by_mayor_office'    // Rechazada por Alcaldía
  | 'signed'                      // Firmada
  | 'closed'                      // Cerrada
```

Las transiciones válidas entre estados están centralizadas en
`ESTADO_TRANSITIONS_DEPARTAMENTO` y `ESTADO_TRANSITIONS_ALCALDE`, en el
mismo archivo — no están repartidas por los componentes. Cada estado tiene
su etiqueta (`ESTADO_CONFIG[...].label`) y la clase CSS de su badge
(`ESTADO_CONFIG[...].color`), ambas usadas por el componente `EstadoBadge`.

### 3.3 Entidad `Solicitud`

Campos principales: `id`, `radicado`, `titulo`, `descripcion`, `categoria`
(`salud` | `educacion` | `familiar` | `comunidad`), `prioridad` (`LOW` |
`MEDIUM` | `HIGH` | `URGENT`), `estado`, `departamentoId`/`departamento`,
`solicitante`, `identificacion`, `fechaSolicitud`, `fechaLimite`,
`subidoPor`/`subidoPorId`, `documentoUrl`/`documentoNombre`, e `historial:
HistorialEntry[]`.

### 3.4 Entidad `HistorialEntry` (trazabilidad)

Cada cambio de estado de una solicitud agrega una entrada con: `id`,
`fecha` (timestamp ISO completo), `accion` (el estado al que se transicionó),
`descripcion`, `usuario`, `usuarioId`. Esta estructura ya es compatible con
la tabla de trazabilidad que normalmente exige el backend (fecha, usuario,
acción, estado anterior/nuevo, observación).

---

## 4. Estado global (Zustand)

| Store | Responsabilidad |
|---|---|
| `authStore.ts` | Usuario autenticado, lista de usuarios (CRUD), login/logout, cambio de contraseña, `allowedRoles` para las rutas protegidas |
| `solicitudesStore.ts` | CRUD de solicitudes, transiciones de estado, asignación/reasignación de departamento, cálculo de urgencia |
| `departamentosStore.ts` | CRUD de departamentos |
| `notificationStore.ts` | Notificaciones internas generadas por cambios de estado |

Cada store expone sus datos y acciones mediante un hook (`useAuthStore()`,
`useSolicitudesStore()`, etc.) que cualquier componente puede consumir
directamente, sin necesidad de pasar props a través de varios niveles
("prop drilling").

---

## 5. Componentes compartidos clave (`src/components/shared/`)

- **`AccessibleDialog.tsx`**: modal base reutilizado por todos los demás
  modales del sistema. Maneja el foco (lo mueve al modal al abrir y lo
  devuelve al elemento que lo abrió al cerrar), cierre con `Escape`, y los
  atributos ARIA (`role="dialog"`, `aria-modal`).
- **`EstadoBadge.tsx`**: badge de estado de una solicitud; lee
  `ESTADO_CONFIG` para mostrar la etiqueta y el color correctos.
- **`FechaLimiteBadge.tsx`**: indicador visual de cuán cerca está la fecha
  límite de una solicitud (urgencia calculada).
- **`SolicitudFiltersPanel.tsx`**: panel de filtros reutilizado en todas
  las pantallas de listado de solicitudes.
- **`SolicitudesTableHeader.tsx` / `SolicitudTableRow.tsx`**: cabecera y
  fila de la tabla de solicitudes, también reutilizadas entre módulos.
- **`TablePagination.tsx`**: controles de paginación reutilizables.
- **`HistorialTimeline.tsx`**: línea de tiempo de trazabilidad de una
  solicitud.
- **`DocumentPreviewModal.tsx`**: vista de detalle/visor del documento
  adjunto.
- **`CambiarDepartamentoModal.tsx` / `CambiarEstadoModal.tsx`**: modales de
  reasignación de departamento y cambio de estado.
- **`PerfilUsuario.tsx`**: pantalla de perfil disponible para todos los
  roles.

---

## 6. Custom hooks (`src/lib/hooks/`)

| Hook | Qué hace |
|---|---|
| `useSolicitudFilters.ts` | Lee y escribe los filtros activos en los parámetros de la URL (`useSearchParams`) |
| `useFilteredSolicitudes.ts` | Aplica los filtros (texto, estado, categoría, prioridad, rango de fechas) sobre un arreglo de solicitudes |
| `usePaginatedList.ts` | Pagina cualquier lista genérica dado el número de página y el tamaño de página |
| `useModalAccessibility.ts` | Lógica de foco/teclado reutilizada por `AccessibleDialog` |
| `useIsMobile.ts` | Detecta si el viewport actual es de tamaño móvil, para adaptar la UI |

Esta separación es la que sostiene el criterio de mantenibilidad: la
lógica de negocio (qué filtrar, cómo paginar, cómo mover el foco) vive en
hooks independientes y testeables, separada de los componentes de
presentación que solo la consumen.

---

## 7. Enrutamiento y control de acceso (`src/App.tsx`)

- Cada módulo se carga con `React.lazy()` (code-splitting): el código de
  un módulo solo se descarga cuando el usuario navega a él, no todo de
  una vez al cargar la aplicación.
- `ProtectedRoute` envuelve cada ruta privada: si no hay sesión, redirige
  a `/`; si hay sesión pero el rol no está en `allowedRoles`, también
  redirige a `/` (pendiente: mostrar una pantalla 403 en este segundo caso
  en vez de reusar el login).
- `AuthRedirect` decide, en la ruta raíz `/`, si mostrar el login o
  redirigir automáticamente al dashboard del rol correspondiente, según si
  ya existe una sesión activa.
- Cualquier ruta no reconocida (`*`) redirige también a `/` — no existe
  todavía una pantalla 404 dedicada.
- `QueryClientProvider` (React Query) está configurado a nivel global con
  `staleTime` de 5 minutos, sin recarga automática al recuperar el foco de
  la ventana, y un reintento por consulta fallida. Hoy no hay ningún
  `useQuery`/`useMutation` real en el proyecto — la configuración queda
  lista para cuando se conecte la API.

### 7.1 Mapa de rutas

| Ruta | Rol(es) permitido(s) | Componente |
|---|---|---|
| `/` | Público | `AuthRedirect` (login o redirección automática) |
| `/alcalde` | alcalde | `AlcaldeDashboard` |
| `/alcalde/notas` | alcalde | `AlcaldeNotas` |
| `/secretaria` | secretaria | `SecretariaDashboard` |
| `/secretaria/notas` | secretaria | `SecretariaNotas` |
| `/secretaria/subir` | secretaria | `SubirDocumento` |
| `/secretaria/seguimiento` | secretaria | `SeguimientoSolicitudes` |
| `/departamento` | departamento | `DepartamentoDashboard` |
| `/departamento/pendientes` | departamento | `NotasPendientes` |
| `/departamento/seguimiento` | departamento | `SeguimientoNotas` |
| `/it` | it | `ITDashboard` |
| `/it/usuarios` | it | `ITGestionUsuarios` |
| `/it/departamentos` | it | `ITGestionDepartamentos` |
| `/perfil` | cualquier rol autenticado | `PerfilUsuario` |
| `*` | — | redirige a `/` |

---

## 8. Estilos: Tailwind CSS v4 con utilities personalizadas

El proyecto no escribe clases de Tailwind sueltas para los patrones que se
repiten (tarjetas, botones de modal, badges de estado): los define como
utilities personalizadas con la sintaxis `@utility` de Tailwind v4 en
`src/styles/*.css`, agrupadas por módulo. Esto evita duplicar el mismo
bloque de clases en distintos componentes y centraliza cualquier cambio de
diseño en un solo lugar.

Variables de color, tipografía y demás tokens del theme viven en
`theme.css` y se referencian desde las utilities con `var(--nombre)`
(ej. `var(--primary)`, `var(--destructive)`, `var(--warning)`).

---

## 9. Pruebas

Las 14 suites de pruebas en `src/test/` usan **Vitest** junto con
**Testing Library** y **vitest-axe**. Cada suite, además de verificar el
comportamiento funcional del componente (renderizado, interacciones,
validaciones), corre una verificación automática de accesibilidad
(`expect(await axe(container)).toHaveNoViolations()`), de forma que un
cambio que rompa la accesibilidad de una pantalla se detecta en las
pruebas, no solo en una revisión manual.

Comandos relevantes (ver `package.json`):

```bash
pnpm test         # corre la suite de pruebas
pnpm run lint      # corre ESLint
pnpm run build     # tsc -b && vite build (build de producción)
pnpm run dev        # servidor de desarrollo de Vite
```

---

## 10. Instalación y ejecución local

> El proyecto usa **pnpm** como gestor de paquetes (ver `pnpm-lock.yaml` en
> la raíz del repositorio); no usar `npm install` directamente.

```bash
# 1. Clonar el repositorio
git clone https://github.com/mdcra13/Proyect-Alcaldia-Frontend.git
cd Proyect-Alcaldia-Frontend

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar VITE_API_URL con la URL del backend

# 4. Levantar el servidor de desarrollo
pnpm dev
```

La aplicación queda disponible en `http://localhost:5173`.