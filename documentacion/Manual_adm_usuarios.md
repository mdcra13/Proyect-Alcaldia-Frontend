# Manual de administración de usuarios
## Sistema de Ayuda Social — Alcaldía Municipal

Este manual está dirigido al rol **Operador IT**, encargado exclusivamente
de administrar usuarios y departamentos del sistema.

> **Restricción importante del rol IT:** este usuario **no tiene acceso al
> contenido de las solicitudes**. No puede verlas, descargarlas, aprobarlas,
> rechazarlas ni consultar su trazabilidad. El menú lateral de este rol solo
> muestra **Dashboard**, **Usuarios** y **Departamentos** — ninguna pantalla
> de notas/solicitudes aparece para este usuario.

---

## 1. Acceso al sistema

Inicie sesión con su usuario y contraseña en la pantalla de login (ver
sección 1 del manual de Secretaría/Departamento para el procedimiento
general).

Usuario de prueba disponible mientras el sistema usa datos de
demostración:

| Usuario | Contraseña | Rol |
|---|---|---|
| `it` | `admin123` | Operador IT |

---

## 2. Panel principal (Dashboard)

El panel del administrador muestra únicamente métricas de usuarios:
- Total de usuarios registrados.
- Usuarios activos e inactivos.
- Usuarios agrupados por rol.
- Usuarios agrupados por departamento.

Ninguna cifra ni gráfico de este panel hace referencia a solicitudes,
notas, ni a su contenido — solo a cuentas de usuario.

---

## 3. Gestión de usuarios

Accesible desde el menú lateral, opción **Usuarios**.

### 3.1 Buscar y filtrar usuarios

- Use el campo de búsqueda para encontrar un usuario por **nombre,
  apellido o nombre de usuario**.
- Use el selector de **rol** para filtrar la lista (Secretaria, Jefe de
  Departamento, Alcalde, Operador IT, o "Todos los roles").
- El listado se muestra paginado (10 usuarios por página).

Cada fila de la tabla muestra: nombre completo, nombre de usuario, rol
(con una etiqueta de color), departamento asignado (si aplica) y estado
(Activo/Inactivo).

### 3.2 Crear un nuevo usuario

1. Presione el botón **Nuevo Usuario**.
2. Complete el formulario:
   - **Nombre**
   - **Apellido**
   - **Username**: nombre de usuario para iniciar sesión.
   - **Rol**: Secretaria, Jefe de Departamento, Alcalde u Operador IT.
   - **Departamento**: este campo solo aparece y es obligatorio cuando el
     rol seleccionado es "Jefe de Departamento" — debe indicar a qué
     departamento pertenece.
3. Presione **Guardar**.

Si falta algún campo obligatorio, o si eligió el rol de departamento sin
seleccionar uno, el sistema muestra un mensaje de error y no guarda el
usuario hasta que se corrija.

El usuario se crea con estado **Activo** de forma predeterminada.

### 3.3 Editar un usuario existente

1. En la fila del usuario, presione el icono de **editar** (lápiz).
2. El formulario se abre con los datos actuales precargados.
3. Modifique los campos necesarios y presione **Guardar**.

### 3.4 Activar o desactivar un usuario

1. En la fila del usuario, presione el icono de **estado**:
   - Si el usuario está activo, el icono permite **desactivarlo**.
   - Si el usuario está inactivo, el icono permite **activarlo**.
2. El cambio se aplica de inmediato, sin ventana de confirmación
   adicional.

> Un usuario desactivado no puede iniciar sesión en el sistema, pero su
> información y su historial de acciones anteriores no se eliminan.

### 3.5 Reinicio de contraseñas

> **Pendiente de implementación en la interfaz.** El reinicio de
> contraseña de un usuario es una función que la lógica del sistema ya
> contempla a nivel interno, pero todavía no tiene un botón ni un flujo
> disponible en esta pantalla. Hasta que se incorpore, el reinicio de
> contraseñas no puede realizarse desde la interfaz de administración.

---

## 4. Gestión de departamentos

Accesible desde el menú lateral, opción **Departamentos**.

### 4.1 Buscar departamentos

Use el campo de búsqueda para filtrar la lista por **nombre del
departamento**.

### 4.2 Crear un nuevo departamento

1. Presione el botón para agregar un nuevo departamento.
2. Complete:
   - **Nombre** del departamento.
   - **Descripción** (campo de texto opcional).
3. Guarde los cambios.

### 4.3 Editar un departamento

1. En la fila correspondiente, presione el icono de **editar**.
2. Modifique nombre y/o descripción.
3. Guarde los cambios.

### 4.4 Activar o desactivar un departamento

Cada departamento puede marcarse como activo o inactivo desde el icono
correspondiente en su fila, de forma similar al manejo de estado de los
usuarios.

> Los departamentos son la base para la asignación de solicitudes: la
> categoría de una solicitud sugiere a qué departamento debe asignarse, y
> los usuarios con rol "Jefe de Departamento" deben tener un departamento
> asignado para poder operar correctamente en el sistema.

---

## 5. Mi perfil

El operador IT también puede actualizar su nombre y apellido desde **Mi
perfil**, en el menú de usuario de la esquina superior derecha, igual que
cualquier otro rol del sistema (ver manual de Secretaría/Departamento,
sección 4).

## 6. Cerrar sesión

Desde el menú de usuario o la barra lateral, seleccione **Cerrar sesión**.