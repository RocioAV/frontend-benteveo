# Connection Plan — Frontend ↔ Backend (Benteveo)

> Documento de conexión entre `frontend-benteveo` (React + Vite) y `backend-Benteveo` (NestJS + Prisma + Cloudinary).
> Registra: **lo ya implementado**, **lo que falta agregar al backend** y **lo que hay que revisar/conectar**.
> Fecha: 2026-08-25 · Rama frontend: `test` · Rama backend: `test`.

---

## 1. Estado actual del frontend (ya implementado)

### 1.1 Autenticación
- `AuthContext` + `useAuth` → expone `token`, `user`, `userId`, `login`, `register`, `logout`, `forgotPassword`.
- Token JWT en `localStorage` (`token`), `userId` decodificado del claim `sub`.
- `user` proviene de `GET /user/data-user` (shape: `{ id, name, email, dni, role, isIdentityVerified, profile: { description, avatar, phone } }`).
- `RequireAuth` protege rutas (redirige a `/login` con `state.from`).
- Login redirige a `/dashboard` tras autenticarse.
- ⚠️ **Google OAuth**: solo botón visual (placeholder). Sin backend ni Client ID.

### 1.2 Dashboard (`/dashboard`)
Nav a la derecha (full-height, sticky) con secciones:
- **Mi perfil**: avatar + info (nombre, email, teléfono, DNI, bio) + edición (visual, backend pendiente) + badge verificación + estadísticas (4 cards) + historial de reservas.
- **Mis reservas**: tabs "Como inquilino" / "Como dueño" + cancelar + botones del dueño + chatear.
- **Agenda**: cronograma de reservas recibidas, ordenado por fecha, con **hora de entrega/devolución (12:00 mediodía)**.
- **Mis publicaciones**: productos del dueño (filtrados por `ownerId`) + borrar.
- **Conversaciones**: hilos por reserva.

### 1.3 Chat / mensajería
- `ChatWindow` (burbujas estilo Messenger) + `chat.service.js` (WebSocket nativo, subprotocolo `['benteveo', token]`, reconexión exponencial, re-join).
- Página dedicada **`/chat/:reservationId`** con contexto de la reserva (producto, la otra parte, fechas, estado).
- **Solo lectura** cuando la reserva está `CANCELLED` o `COMPLETED`.

### 1.4 Verificación de identidad (KYC)
- Pin **"verificado" / "sin verificar"** en el perfil y en la tarjeta del dueño del DetalleProducto.
- **Modal multi-paso** (`VerificationModal`): frente del DNI → dorso → selfie → enviar → "esperando aprobación del administrador".
- Botón **"Verificar identidad"** en el perfil.
- **Bloqueo de reserva** si el usuario no está verificado (deshabilita "Continuar al pago" + botón de verificación).

### 1.5 Productos / Reservas
- Catálogo (`fetchProducts` + `mapProduct`), DetalleProducto (producto + perfil público del dueño + reseñas **mock**).
- `Reservation` (calendario + `createReservation`).
- `MisReservas` / secciones del dashboard (`fetchMyReservations` / `fetchReservationsAsOwner`).

---

## 2. Backend pendiente (a implementar)

> El backend actual expone: `auth` (login/register), `products` (CRUD + fotos), `reservations` (CRUD + confirm/cancel/handoff/return), `user` (data-user, perfil, público, soft-delete), `profile` (GET).
> **NO existen aún**: pago, chat/mensajes, verificación, favoritos, reseñas, notificaciones.

### 2.1 Editar perfil + subir foto
- **Frontend**: listo (form de edición + cambio de foto con preview).
- **Falta en backend**:
  - `PATCH /user` — actualiza `name` (User) y `description`/`phone` (Profile). Body: `{ name?, phone?, description? }`.
  - `POST /user/avatar` (multipart) — sube el avatar a Cloudinary y guarda `profile.avatar`. Reutilizar `CloudinaryService` + `ImageFileValidator`.
  - Nota: `UpdateUserDto` ya existe (`PartialType(CreateUserDto)`) pero está **desconectado** (el import está comentado en `user.service.ts`).

### 2.2 Chat / mensajes en tiempo real
- **Frontend**: listo (`ChatWindow` + `chat.service.js`).
- **Falta en backend**:
  - Modelo `Message`: `id, reservationId, senderId, content, readAt?, createdAt`.
  - **Gateway WebSocket** en `/chat` que:
    - Valide el JWT del subprotocolo (`new WebSocket(url, ['benteveo', token])`).
    - Eventos cliente→servidor: `join` (sala = `reservationId`), `message:send`, `leave`.
    - Eventos servidor→cliente: `message:history`, `message:new`, `error`.
  - `GET /reservations/:id/messages` — historial REST (fallback de carga).

### 2.3 Verificación de identidad (KYC) — flujo completo
- **Frontend**: listo (`VerificationModal` + `verification.service.js`).
- **Falta en backend**:
  - Modelo `VerificationRequest`: `id, userId, status (PENDING|APPROVED|REJECTED), frontImage, backImage, selfieImage, createdAt, reviewedAt`.
  - `POST /verification` (multipart `front`, `back`, `selfie`) → sube a Cloudinary y crea el pedido en `PENDING`.
  - `GET /verification` → estado actual del pedido (o `null`).
  - `PATCH /verification/:id/approve` (admin) → `APPROVED` + setea `user.isIdentityVerified = true`.
  - `PATCH /verification/:id/reject` (admin) → `REJECTED`.
  - **Enforcement**:
    - `POST /reservations` → rechaza (403) si el usuario no está verificado.
    - `POST /products` → rechaza (403) si el usuario no está verificado.

### 2.4 Cancelación con regla de 48hs
- **Frontend**: listo (nota "Cancelación con cargo" + aviso en el modal).
- **Falta en backend** (`reservations.service.cancel`):
  - Si faltan **>48hs** para `dateInit` → cancelación gratis.
  - Si faltan **≤48hs** → cancelación **con cargo** (penalización). **Monto a definir** (¿total? ¿%? ¿depósito?).

### 2.5 Resolución de cancelación (dueño)
- **Frontend**: botón "Resolver cancelación" (con toast "pendiente backend").
- **Falta en backend**:
  - Campos en `Reservation`: `cancellationConfirmedAt` (DateTime?) y `paymentReceivedAt` (DateTime?).
  - `PATCH /reservations/:id/confirm-cancellation` (dueño) → setea `cancellationConfirmedAt`.
  - `PATCH /reservations/:id/mark-payment` (dueño) → setea `paymentReceivedAt`.
  - Regla: cuando una reserva `CANCELLED` se resuelve (confirmada + pago), la conversación queda bloqueada (solo lectura).

### 2.6 `findMyReservations` (GET /reservations)
- Incluir el **nombre del dueño** (`owner`) en la respuesta. Hoy solo trae `product.ownerId`, por lo que "Como inquilino" muestra "Propietario" como fallback.

---

## 3. Funcionalidades de la web a revisar / conectar

| # | Funcionalidad | Estado actual | Qué falta |
|---|---------------|---------------|-----------|
| 3.1 | **Pago (MercadoPago)** | `Pago.jsx` es **MOCK** (formulario de tarjeta + `setTimeout`). No hay backend de pago. | Integrar SDK de MercadoPago: preferencia de pago (`POST /payments`), webhook de confirmación, marcar reserva como pagada. |
| 3.2 | **Google OAuth** | Solo botón visual (placeholder). | `POST /auth/google` en backend + Client ID de Google Cloud. |
| 3.3 | **Publicar producto** | La rama `feature/publicar-producto` existe pero **no está integrada** al frontend actual. Backend ya tiene `POST /products` + `POST /products/:id/photos`. | Crear página/formulario de publicación + enforcement de verificación. |
| 3.4 | **Favoritos** | Lógica en `localStorage` (commit `91957b4`). Sin backend. | Decidir si persistir en backend (modelo + endpoints). |
| 3.5 | **Reseñas / ratings** | En DetalleProducto las reseñas son **mock** (hardcodeadas). No hay endpoints. | Modelo `Review` + endpoints (`GET/POST /products/:id/reviews`). |
| 3.6 | **Búsqueda** | Header buscador → `PageCatalogo` filtra en frontend (`matchesQuery`). | Revisar si `GET /products` soporta query params de búsqueda/filtro en backend. |
| 3.7 | **Notificaciones** | Sin implementar (el dashboard viejo tenía "Configuración" mock, ya eliminada). | Sistema de notificaciones (email / push / in-app). |
| 3.8 | **Contactar dueño** | Botón "Contactar" en DetalleProducto **sin funcionalidad**. | Debería abrir el chat con el dueño (`/chat/:reservationId` o iniciar conversación). |
| 3.9 | **Reputación del dueño** | DetalleProducto muestra rating del producto, no del dueño. | Revisar si se expone rating/reputación del usuario (dueño). |
| 3.10 | **Editar perfil (teléfono/descripción)** | Form listo, sin backend. | `PATCH /user` (ver 2.1). **Causa del "no se muestra el teléfono"**: usuarios registrados con `RegisterDto` viejo (sin `phone`), o phone null en la DB. |
| 3.11 | **Avatar del usuario** | Cambio de foto con preview, sin backend. | `POST /user/avatar` (ver 2.1). |

---

## 4. Contrato resumido de endpoints nuevos (checklist para el backend)

- [ ] `PATCH /user` — editar nombre/teléfono/bio.
- [ ] `POST /user/avatar` — subir avatar (Cloudinary).
- [ ] Modelo `Message` + gateway WS `/chat` + `GET /reservations/:id/messages`.
- [ ] Modelo `VerificationRequest` + `POST/GET /verification` + `PATCH approve/reject` (admin).
- [ ] Enforcement: reservar y publicar requieren verificación.
- [ ] Regla 48hs en `cancel` + penalización (monto a definir).
- [ ] Campos `cancellationConfirmedAt` / `paymentReceivedAt` + endpoints (dueño).
- [ ] `findMyReservations` incluir `owner` (nombre del dueño).
- [ ] Pago real (MercadoPago).
- [ ] Google OAuth.
- [ ] Publicar producto (frontend + verificación).
- [ ] Favoritos, reseñas, notificaciones (decidir alcance).

---

## 5. Decisiones de negocio pendientes (las define el dueño)

1. **¿Cómo se aprueba la verificación de DNI?** → manual por administrador (asumido), ¿o automático?
2. **Cancelación <48hs**: ¿cuánto abona? (total / % / primer día / depósito de garantía).
3. **Favoritos y reseñas**: ¿persistir en backend o dejar en frontend?
4. **Notificaciones**: ¿email, push, o in-app?
