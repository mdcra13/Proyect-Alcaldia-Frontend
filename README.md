D
# Sistema de Ayuda Social — Alcaldía Municipal
 
Frontend del sistema de gestión digital de solicitudes ciudadanas para la Alcaldía Municipal. Reemplaza el proceso físico de recepción de notas por un flujo digital trazable: desde que la Secretaría registra la solicitud hasta que el Alcalde la firma o cierra el expediente.
 
---
 
## 1. Descripción del proyecto y roles
 
La alcaldía recibía las solicitudes de ayuda social en papel. Este sistema lo digitaliza por completo, permitiendo que cada solicitud pase por un flujo de **10 estados** con trazabilidad total (quién hizo cada cambio, cuándo y por qué).
 
El sistema tiene **4 roles**, cada uno con su propio conjunto de pantallas:
 
| Rol | Qué hace | Pantallas principales |
|---|---|---|
| **Secretaria** | Registra las notas/solicitudes, las asigna a un departamento, hace seguimiento de su estado | Dashboard, Mis Notas, Subir Nota, Seguimiento |
| **Departamento** | Recibe las notas asignadas a su área, las revisa y aprueba o rechaza | Dashboard, Notas Pendientes, Seguimiento de Notas |
| **Alcalde** | Tiene visión global de todas las notas del sistema, firma o rechaza las que llegan a su despacho, puede reasignar departamentos | Dashboard, Listado de Notas |
| **Operador IT** | Administra los usuarios internos y los departamentos del sistema | Dashboard, Gestión de Usuarios, Gestión de Departamentos |
 
Todos los roles tienen acceso a su **Perfil** desde el dropdown del avatar en el header (nunca desde el menú lateral).
 
### Flujo de estados de una solicitud
 
```
received
  └─> assigned_to_department
        └─> in_review
              ├─> approved_by_department
              │     └─> awaiting_mayor_signature
              │           ├─> signed ──> closed
              │           ├─> returned_to_department ──> in_review
              │           └─> rejected_by_mayor_office
              └─> rejected_by_department
```
 
| Estado | Significado |
|---|---|
| `received` | Registrada por Secretaría, sin departamento asignado |
| `assigned_to_department` | Asignada a un departamento responsable |
| `in_review` | El departamento inició la revisión |
| `approved_by_department` | Aprobada por el departamento |
| `rejected_by_department` | Rechazada por el departamento |
| `awaiting_mayor_signature` | Enviada a Alcaldía para firma |
| `returned_to_department` | Devuelta al departamento para corrección |
| `rejected_by_mayor_office` | Rechazada por el despacho de Alcaldía |
| `signed` | Firmada lógicamente por el Alcalde |
| `closed` | Trámite finalizado |
 
---
 
## 2. Inicio rápido
 
Requisitos previos: **Node.js 20+** y **pnpm** (el proyecto usa `pnpm` como package manager).
 
```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-org/proyect-alcaldia-frontend.git
cd proyect-alcaldia-frontend
 
# 2. Instalar dependencias
pnpm install
 
# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar VITE_API_URL con la URL del backend
 
# 4. Levantar el servidor de desarrollo
pnpm dev
```
 
La app queda disponible en `http://localhost:5173`.
 
## 3. Credenciales de demo
 
Todos los usuarios de prueba usan la misma contraseña: **`admin123`**
 
| Usuario | Contraseña | Rol | Nombre |
|---|---|---|---|
| `alcalde` | `admin123` | Alcalde | Carlos |
| `secretaria` | `admin123` | Secretaria | María |
| `departamento` | `admin123` | Departamento | Juan |
| `departamento2` | `admin123` | Departamento | Laura |
| `it` | `admin123` | Operador IT | Pedro |
 
> Estas credenciales están hardcodeadas en `authStore.ts` mientras el sistema funciona con datos mock. Al conectar el backend real, el login pasa a validarse contra la API.
 
---
 
## 4. Estructura de carpetas
 
```
src/
├── App.tsx                          # Router principal, QueryClient, rutas protegidas por rol
├── main.tsx                         # Entry point de Vite
├── index.css                        # Variables CSS del tema institucional + @utility reutilizables
│
├── components/
│   ├── auth/
│   │   └── LoginPage.tsx
│   │
│   ├── alcalde/
│   │   ├── AlcaldeDashboard.tsx     # Métricas globales, resumen por depto., notas urgentes
│   │   └── AlcaldeNotas.tsx         # Listado completo: firmar, devolver, rechazar, reasignar
│   │
│   ├── secretaria/
│   │   ├── SecretariaDashboard.tsx
│   │   ├── SecretariaNotas.tsx      # Mis notas, asignación de departamento
│   │   ├── SubirDocumento.tsx       # Registro de nueva solicitud
│   │   └── SeguimientoSolicitudes.tsx
│   │
│   ├── departamento/
│   │   ├── DepartamentoDashboard.tsx
│   │   ├── NotasPendientes.tsx      # Solo notas accionables del departamento (aprobar/rechazar)
│   │   └── SeguimientoNotas.tsx     # Historial completo de gestión del departamento
│   │
│   ├── it/
│   │   ├── ITDashboard.tsx
│   │   ├── ITGestionUsuarios.tsx
│   │   ├── ITGestionDepartamentos.tsx
│   │   └── UserFormModal.tsx
│   │
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── Sidebar.tsx              # Navegación por rol — sin link al perfil
│   │   ├── Header.tsx               # Notificaciones + dropdown de avatar con perfil
│   │   └── MobileNav.tsx            # Bottom nav en mobile (excluyente con Sidebar)
│   │
│   ├── shared/                      # Componentes reutilizados entre roles
│   │   ├── FechaLimiteBadge.tsx     # Indicador de urgencia por fecha límite
│   │   ├── EstadoBadge.tsx          # Badge de color por estado
│   │   ├── HistorialTimeline.tsx    # Auditoría de cambios de una solicitud
│   │   ├── DocumentPreviewModal.tsx # Vista previa con acciones de aprobar/rechazar
│   │   ├── SolicitudFiltersPanel.tsx
│   │   ├── SolicitudesTableHeader.tsx
│   │   ├── SolicitudTableRow.tsx
│   │   ├── TablePagination.tsx
│   │   ├── CambiarDepartamentoModal.tsx
│   │   ├── CambiarEstadoModal.tsx
│   │   ├── ConfirmActionModal.tsx
│   │   ├── DeclineModal.tsx
│   │   └── PerfilUsuario.tsx
│   │
│   └── ui/                          # Componentes base (shadcn/ui style)
│
├── lib/
│   ├── types/index.ts               # Tipos globales + ESTADO_CONFIG + transiciones por rol
│   ├── stores/                      # Estado global con Zustand
│   │   ├── authStore.ts
│   │   ├── solicitudesStore.ts
│   │   ├── departamentosStore.ts
│   │   ├── usersStore.ts
│   │   └── notificationStore.ts
│   ├── hooks/
│   │   ├── useIsMobile.ts
│   │   ├── usePagination.ts
│   │   ├── useSolicitudFilters.ts   # Filtros persistidos en la URL
│   │   └── useFilteredSolicitudes.ts
│   └── utils.ts                     # cn(), formatDate(), etc.
│
└── test/                            # Tests con Vitest + Testing Library
```
 
---
 
## 5. Comandos disponibles
 
```bash
pnpm dev              # Servidor de desarrollo en localhost:5173
pnpm build            # Type-check + build de producción
pnpm preview          # Sirve el build de producción localmente
pnpm lint             # ESLint sobre todo el proyecto
pnpm test             # Tests (un solo run)
pnpm test:watch       # Tests en modo watch interactivo
pnpm test:coverage    # Tests con reporte de cobertura
```
 
 
## Convención de estilos
 
El proyecto usa **Tailwind CSS v4**. Regla del equipo: si una combinación de clases se repite en 2 o más lugares o supera las 5 clases, se extrae como `@utility` en `src/index.css` en lugar de repetirla inline.
 
```css
/* src/index.css */
@utility page-wrapper {
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
```
 
Siempre usar las variables CSS del tema institucional (`var(--primary)`, `var(--accent)`, `var(--success)`, etc.) en lugar de colores hardcodeados.
 
---
 
## Flujo de trabajo
 
- Nunca hacer push directo a `main` ni `develop`. Todo cambio entra por Pull Request.
- Nomenclatura de ramas: `feat/`, `fix/`, `test/`.
- Cada PR requiere al menos una aprobación y debe pasar el pipeline de CI (lint, build, tests) antes de poder mergearse.
- Mantener el coverage de tests por encima del umbral acordado por el equipo.