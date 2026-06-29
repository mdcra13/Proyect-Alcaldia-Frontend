# Manual de usuario
## Sistema de Ayuda Social — Alcaldía Municipal

Este manual cubre los dos roles operativos del sistema: **Secretaría**
(quien registra y da seguimiento a las solicitudes) y **Departamento**
(quien revisa y decide sobre las solicitudes asignadas a su área).

---

## 1. Acceso al sistema

1. Abra la dirección del sistema en su navegador.
2. Ingrese su **usuario** y **contraseña** en el formulario de inicio de
   sesión.
3. Presione **Iniciar sesión**.

Si el usuario o la contraseña son incorrectos, el sistema muestra el
mensaje *"Credenciales incorrectas. Verifique su usuario y contraseña."*
sin indicar cuál de los dos campos falló, por seguridad.

---

## 2. Manual de Secretaría

### 2.1 Panel principal (Dashboard)

Al ingresar, la secretaría ve un resumen con:
- Total de solicitudes registradas.
- Solicitudes pendientes, aprobadas y rechazadas.
- Solicitudes urgentes y próximas a vencer.

Desde el menú lateral, la secretaría tiene acceso a tres secciones:
**Dashboard**, **Mis Notas** y **Subir Nota**, además de **Seguimiento**.

### 2.2 Registrar una nueva solicitud (Subir Nota)

1. En el menú lateral, presione **Subir Nota**.
2. Complete el formulario:
   - **Título** de la solicitud.
   - **Categoría**: Salud, Educación, Familiar o Comunidad.
   - **Departamento**: a qué departamento se enviará la solicitud.
   - **Prioridad**: Baja, Media, Alta o Urgente.
   - **Nombre del solicitante** (la persona que hizo la petición).
   - **Identificación** del solicitante.
   - **Fecha de la solicitud**: por defecto es el día de hoy, pero puede
     cambiarla si la nota física se recibió en otra fecha.
   - **Fecha límite** (opcional): fecha máxima para dar respuesta.
   - **Descripción**: detalle de la solicitud.
3. Adjunte el documento escaneado:
   - Puede arrastrar el archivo a la zona indicada o hacer clic para
     seleccionarlo desde su equipo.
   - Formatos permitidos: **PDF o imagen** (JPG/PNG).
   - Tamaño máximo: **10 MB**.
   - Si el archivo no cumple el formato o el tamaño, el sistema muestra un
     mensaje de error y no permite continuar.
4. Presione **Guardar** (o el botón de envío del formulario).
5. El sistema confirma el registro y muestra el **número de radicado**
   generado automáticamente para esa solicitud.

> Si seleccionó un departamento en el formulario, la solicitud queda en
> estado **"Asignada a departamento"** de inmediato. Si no seleccionó
> departamento, queda en estado **"Recibida"** hasta que alguien la asigne.

### 2.3 Consultar y dar seguimiento a las solicitudes (Mis Notas / Seguimiento)

1. En el menú lateral, presione **Mis Notas** o **Seguimiento**.
2. Use el panel de filtros para acotar la lista:
   - Búsqueda libre por **radicado** o **nombre del solicitante**.
   - Filtro por **estado**, **categoría**, **prioridad** y **rango de
     fechas**.
3. Los filtros que aplique quedan reflejados en la dirección (URL) de la
   página, así que puede compartir o recargar la página sin perder los
   filtros activos.
4. La lista se muestra paginada; use los controles de página al final de
   la tabla para avanzar o retroceder.
5. Para ver el detalle completo de una solicitud, presione el icono de
   **ver** (ojo) en la fila correspondiente. Ahí encontrará:
   - Los datos del ciudadano solicitante.
   - El documento adjunto.
   - El historial cronológico de cambios de estado (trazabilidad), con
     fecha, usuario responsable y observaciones de cada paso.

### 2.4 Estados que puede ver la secretaría

La secretaría puede consultar las solicitudes en cualquiera de estos
estados: Recibida, Asignada a departamento, En revisión, Aprobada por
departamento, Rechazada por departamento, Pendiente de firma, Devuelta a
departamento, Rechazada por Alcaldía, Firmada o Cerrada.

---

## 3. Manual de Departamento

### 3.1 Panel principal (Dashboard)

El panel del departamento muestra únicamente las solicitudes **asignadas a
su propio departamento** (nunca las de otros departamentos), con totales
de: solicitudes asignadas, en revisión, urgentes y próximas a vencer.

El menú lateral muestra: **Dashboard**, **Notas Pendientes** y
**Seguimiento**.

### 3.2 Revisar solicitudes pendientes (Notas Pendientes)

Esta pantalla muestra las solicitudes de su departamento que requieren
acción: las que están **asignadas**, **en revisión** o que fueron
**devueltas** para corrección.

1. En el menú lateral, presione **Notas Pendientes**.
2. Use los filtros (estado, categoría, prioridad, fechas y búsqueda por
   radicado/solicitante) igual que en la sección de Secretaría.
3. Para revisar una solicitud en detalle, presione el icono de **ver**
   (ojo). Se abre una ventana con los datos del ciudadano, el documento
   adjunto y el historial.
4. Desde la vista de detalle (o directamente desde la fila de la tabla)
   tiene dos acciones disponibles:

**Aprobar una solicitud**
1. Presione **Aprobar**.
2. Revise el radicado, título y solicitante que se muestran en la
   ventana de confirmación.
3. Presione **Confirmar aprobación**.
4. La solicitud pasa al siguiente paso del flujo (queda pendiente de
   firma del Alcalde).

**Rechazar una solicitud**
1. Presione **Rechazar**.
2. Escriba el **motivo del rechazo** en el campo de texto (mínimo 10
   caracteres; el campo tiene un contador de 500 caracteres máximo). Este
   motivo será visible para la secretaría.
3. Presione **Confirmar rechazo**.
4. Mientras no escriba un motivo de al menos 10 caracteres, el botón de
   confirmar permanece deshabilitado.

### 3.3 Consultar el historial (Seguimiento)

1. En el menú lateral, presione **Seguimiento**.
2. Aquí puede consultar **todas** las solicitudes de su departamento, sin
   importar el estado (incluyendo las ya cerradas o firmadas), con los
   mismos filtros disponibles en las demás pantallas.
3. Presione el icono de historial para ver la trazabilidad completa de
   cualquier solicitud: cada cambio de estado, quién lo realizó, cuándo, y
   las observaciones registradas (por ejemplo, el motivo de un rechazo o
   de una devolución).

### 3.4 Reglas importantes para el departamento

- Solo puede ver y actuar sobre las solicitudes de **su propio
  departamento**. No tiene acceso a las solicitudes de otros
  departamentos.
- Una solicitud rechazada o devuelta conserva todo su historial anterior;
  no se pierde información al cambiar de estado.

---

## 4. Mi perfil (disponible para todos los roles)

1. En la esquina superior derecha, abra el menú de usuario y seleccione
   **Mi perfil**.
2. Puede actualizar su **nombre** y **apellido**.
3. Su **usuario (username)**, **rol** y **departamento** se muestran de
   solo lectura; no se pueden modificar desde esta pantalla.
4. Presione **Guardar cambios** para confirmar.

## 5. Cerrar sesión

Desde el menú de usuario (esquina superior derecha) o desde la barra
lateral, seleccione **Cerrar sesión**. El sistema cierra su sesión y lo
regresa a la pantalla de inicio de sesión de inmediato.