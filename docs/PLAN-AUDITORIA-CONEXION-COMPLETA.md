# Plan de Auditoría y Conexión Completa — Benteveo

> **Estado:** PLAN DE ACCIÓN. No ejecutar cambios de implementación hasta abrir una sesión de trabajo para cada fase.
> **Fecha:** 2026-08-25
> **Alcance:** `frontend-benteveo` + `backend-Benteveo` + esquema Prisma/PostgreSQL + servicios externos.
> **Fuentes:** `conection-plan.md`, `backend-Benteveo/docs/analisis-backend.md`, `backend-Benteveo/docs/plan-accion-mejoras.md` y auditoría estática del código actual.

---

## 1. Objetivo y criterio rector

Completar la integración funcional entre frontend y backend sin trasladar al navegador responsabilidades que pertenecen al servidor, especialmente acceso a base de datos, autorización, cálculo de dinero, disponibilidad, transiciones de reservas, pagos y verificación de identidad.

La regla central será:

> El frontend es un cliente no confiable. El backend es la única frontera de confianza y la única capa que puede decidir o persistir reglas de negocio.

El frontend podrá validar formato y mejorar la experiencia, pero ninguna validación del navegador será considerada una medida de seguridad.

### 1.1 Resultado esperado

Al terminar el plan:

- El frontend consumirá únicamente una API documentada y un canal WebSocket autorizado.
- Ningún secreto, credencial de base de datos o lógica de autorización estará en el bundle del frontend.
- El backend validará identidad, permisos, propiedad, estados, fechas, importes y límites.
- Los pagos no capturarán PAN/CVV en React ni se aprobarán mediante `setTimeout`.
- Las reservas serán consistentes aun ante solicitudes concurrentes o reintentos.
- Los contratos, errores, estados y modelos serán explícitos y compartidos por documentación o código generado.
- Las funcionalidades visibles tendrán implementación real o quedarán ocultas detrás de un estado claramente no disponible.

---

## 2. Estado actual verificado

### 2.1 Ya existe, pero requiere validación o endurecimiento

- Auth básica con `POST /api/v1/auth/login` y `POST /api/v1/auth/register`.
- Perfil autenticado y perfiles públicos.
- Productos: listado, detalle, creación, actualización, borrado lógico y fotos.
- Reservas: creación, listados, confirmación, cancelación, entrega y devolución.
- Guards de autenticación y roles, filtros globales y pruebas unitarias básicas.
- Cliente HTTP frontend con `Authorization: Bearer`.
- Chat frontend con REST + WebSocket preparado, pero sin gateway backend.

### 2.2 Bloqueantes confirmados

| Prioridad | Hallazgo | Evidencia principal | Riesgo |
|---|---|---|---|
| P0 | El registro acepta `role` y el servicio puede persistir `ADMIN` | `backend-Benteveo/src/modules/users/dto/create-user.dto.ts`, `user.service.ts` | Escalada de privilegios inmediata |
| P0 | Las reservas comprueban solapamiento y luego insertan en operaciones separadas | `backend-Benteveo/src/modules/reservations/reservations.service.ts` | Doble reserva bajo concurrencia |
| P0 | Las migraciones iniciales se duplican y no coinciden con el schema actual (`roles` vs `role`) | `backend-Benteveo/prisma/migrations/`, `schema.prisma` | Instalaciones inconsistentes y drift |
| P0 | Publicar y reservar no exigen `isIdentityVerified` | servicios de products/reservations | Se puede evadir una regla de negocio declarada |
| P0 | Pago es mock y captura número de tarjeta, vencimiento y CVV en React | `frontend-benteveo/src/pages/Pago.jsx` | Falsa aprobación y riesgo PCI/filtración de datos |
| P1 | JWT en `localStorage`, sin expiración validada ni cierre central ante `401` | `frontend-benteveo/src/services/api.js`, `RequireAuth.jsx`, `AuthContext.jsx` | Robo de sesión y UI autenticada falsamente |
| P1 | `Content-Security-Policy` solo contempla localhost y no contempla correctamente API/WSS/Cloudinary | `frontend-benteveo/index.html` | La aplicación puede romperse en producción |
| P1 | Errores HTTP, WebSocket e historial de chat se ocultan o no se normalizan | `api.js`, `chat.service.js`, `ChatWindow.jsx` | Diagnóstico incorrecto y estados engañosos |
| P1 | Precio, envío, depósito y fechas mostradas no forman un contrato único | `Reservation.jsx`, `Pago.jsx` | Cobros y reservas con importes/horarios inconsistentes |
| P1 | Cancelación de 48 horas es contradictoria y no está implementada en backend | `Dashboard.jsx`, `DetalleProducto.jsx`, reservations service | Regla comercial incumplida |
| P1 | Uploads confían en MIME del cliente y no limitan bytes | controllers/validators de backend y `VerificationModal.jsx` | DoS, archivos falsificados y costes de almacenamiento |
| P1 | Listados sin paginación; dinero como `Float`; faltan índices | `schema.prisma`, services | Degradación y pérdida de precisión |
| P2 | Home/Benti usan catálogo mock y existen adapters/modelos falsos | `Home.jsx`, `Benti.jsx`, `models/product.model.js` | Experiencia incoherente y regresiones |
| P2 | Perfil/avatar, Google, reseñas, favoritos, publicaciones y “Contactar” están incompletos | páginas/componentes/services frontend | Funcionalidades declaradas pero no operativas |

### 2.3 Documentación que debe corregirse

`backend-Benteveo/docs/analisis-backend.md` describe un estado anterior y afirma que Products, Reservations, filtros, CORS endurecido, filtros globales y tests no existen. Antes de usarlo como fuente operativa se debe actualizar o marcarlo como histórico.

`frontend-benteveo/conection-plan.md` es más cercano al estado actual, pero debe incorporar la escalada por `role`, las migraciones incompatibles, la condición de carrera, el uso de `localStorage`, la CSP, los contratos reales (`POST /reservations`) y los fallos del chat/pago.

---

## 3. Principios de arquitectura y seguridad

### 3.1 Frontera de confianza

- El frontend nunca se conecta a PostgreSQL, Prisma, Cloudinary con secretos, Mercado Pago con credenciales privadas ni servicios internos.
- El frontend nunca decide si un usuario puede administrar, publicar, reservar, cancelar, aprobar KYC o cambiar el estado de una reserva.
- El frontend nunca envía un importe como autoridad. Puede enviar intención y parámetros permitidos; el servidor calcula el total.
- El backend nunca acepta `ownerId`, `userId`, `role`, `status`, `paymentStatus` ni campos equivalentes desde el cliente cuando deben derivarse del token o del estado actual.
- Toda protección visual del frontend debe tener una protección equivalente en backend.

### 3.2 Contratos explícitos

- DTO de entrada por caso de uso, sin reutilizar entidades Prisma como request/response.
- DTO de salida con allowlist; nunca serializar objetos completos de Prisma.
- Shape único de éxito y error, documentado en Swagger.
- Fechas en ISO 8601 con zona horaria definida; no usar medianoche local para representar entregas a las 12:00.
- Dinero en unidades menores o `Decimal`; no `Float`.
- IDs opacos, validación de formato y límites de longitud.
- `409 Conflict` para conflictos de disponibilidad o idempotencia; `401` para autenticación; `403` para autorización; `422` solo si se decide usarlo de forma consistente.

### 3.3 Denegación por defecto

- Endpoint nuevo: autenticado salvo que se marque explícitamente público.
- Acción nueva: permiso específico y ownership comprobado en servidor.
- Reserva/chat/pago/KYC: acceso solo a participantes o administradores autorizados.
- Datos públicos: solo nombre, avatar, verificación y reputación que el negocio autorice; nunca contraseña, hash, DNI, email o dirección exacta sin necesidad.

---

## 4. Contrato objetivo de integración

### 4.1 Transporte y configuración

- API versionada: `/api/v1`.
- Frontend: `VITE_API_URL` solo contiene una URL pública, nunca secretos.
- Producción: HTTPS y WebSocket seguro (`wss://`).
- CORS: allowlist explícita por entorno; no `origin: true` con credenciales.
- Si se usa cookie `HttpOnly`, agregar protección CSRF. Si se mantiene Bearer, resolver el riesgo de `localStorage` mediante cookie segura o una estrategia de sesión en memoria + refresh controlado.
- Configuración de entorno validada al arrancar; la aplicación debe fallar temprano si faltan `DATABASE_URL`, `JWT_SECRET`, orígenes, credenciales externas o configuración requerida.

### 4.2 Respuesta estándar propuesta

Definir y aplicar una sola forma:

```json
{
  "success": true,
  "data": {},
  "message": "",
  "meta": {},
  "requestId": "..."
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "RESERVATION_CONFLICT",
    "message": "El producto no está disponible para esas fechas.",
    "fields": {}
  },
  "requestId": "..."
}
```

El `requestId` no debe contener PII y debe aparecer también en logs. El frontend debe consumir este contrato sin depender de mensajes internos de Prisma.

### 4.3 Endpoints reales a conservar o documentar

| Área | Endpoints actuales |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/register` |
| Usuario | `GET /user/data-user`, `GET /user/profile`, `GET /user/:id`, `PATCH /user/delete` |
| Productos | `POST /products`, `GET /products`, `GET /products/:id`, `PATCH /products/:id`, `DELETE /products/:id`, fotos |
| Reservas | `POST /reservations`, `GET /reservations`, `GET /reservations/as-owner`, `GET /reservations/all`, `GET /reservations/:id`, confirm/cancel/handoff/return |

La documentación debe dejar claro que el endpoint actual de creación es `POST /reservations`, no `POST /products/:id/reservations`, salvo que se decida migrar el contrato deliberadamente.

### 4.4 Endpoints faltantes necesarios para la experiencia actual

- `PATCH /user` y `POST /user/avatar`.
- `POST /verification`, `GET /verification`, aprobación/rechazo administrativo.
- `GET /reservations/:id/messages` y gateway `/chat`.
- Resolución de cancelación y registro de pago si esa regla permanece.
- `POST /payments`, consulta de estado y webhook del proveedor.
- `POST /auth/google`, solo si Google OAuth es requisito del MVP.
- Favoritos, reseñas, notificaciones y publicación de productos en frontend, según alcance aprobado.

---

## 5. Plan de ejecución por fases

Cada fase debe implementarse en cambios pequeños, con pruebas y revisión antes de continuar. Los cambios de schema deben incluir migración reproducible y no deben editar migraciones ya aplicadas.

### Fase 0 — Línea base, decisiones y contrato

**Objetivo:** evitar implementar sobre documentación o contratos contradictorios.

1. Congelar inventario de endpoints, DTOs, responses y eventos WS reales.
2. Actualizar `conection-plan.md` y marcar `analisis-backend.md` como histórico o corregirlo.
3. Confirmar entorno de desarrollo, base de datos, ramas y migraciones aplicadas.
4. Decidir transporte de sesión: cookie `HttpOnly` o Bearer con estrategia de refresh y mitigaciones XSS.
5. Decidir regla de KYC: qué acciones requieren verificación y cómo se revalida.
6. Decidir cancelación: ventana, porcentajes, depósito, pagos y reembolsos.
7. Decidir si el MVP incluye Mercado Pago, Google, chat en tiempo real, reviews, favoritos y notificaciones.
8. Publicar el contrato OpenAPI objetivo antes de integrar nuevas pantallas.

**Salida:** matriz de endpoints, decisiones de negocio firmes, contrato versionado y lista de migraciones válidas.

### Fase 1 — Cierre de vulnerabilidades críticas del backend

**Objetivo:** impedir toma de cuentas, exposición de información y autorización falsa.

1. Eliminar `role` del DTO público de registro y asignar `USER` exclusivamente en servidor.
2. Crear el primer administrador solo mediante seed protegido, comando interno o promoción manual controlada.
3. Revalidar usuario, `isDeleted`, estado de cuenta y permisos para acciones sensibles.
4. No confiar en roles antiguos del JWT para autorización sensible; consultar roles actuales o versionar/revocar sesiones cuando cambien.
5. Confirmar que ningún endpoint devuelve `password`, hash, DNI u otra PII innecesaria.
6. Endurecer CORS y eliminar `credentials: true` si no se usan cookies.
7. Activar `Helmet`, rate limiting específico para login/registro/refresh/reset y protección contra enumeración de cuentas.
8. Usar `ValidationPipe` nativo con `whitelist`, `forbidNonWhitelisted` y `transform`.
9. Validar variables de entorno al boot y eliminar logs de payload JWT, email, DNI y objetos de usuario.
10. Definir `issuer`, `audience`, expiración única y algoritmo permitido para JWT.

**Aceptación:** un registro no puede elegir rol; usuario eliminado no puede autenticarse; ninguna respuesta contiene secretos; ataques básicos de rate limit devuelven `429`; configuración inválida impide arrancar.

### Fase 2 — Base de datos, migraciones e integridad del dominio

**Objetivo:** que una base nueva y una base existente lleguen al mismo modelo sin pérdida ni drift.

1. Auditar las seis migraciones existentes contra `schema.prisma` y el estado real de PostgreSQL.
2. Resolver las dos migraciones iniciales duplicadas y documentar la estrategia para bases ya instaladas.
3. Respaldar datos antes de cualquier migración destructiva; probar restore en entorno aislado.
4. Convertir dinero a `Decimal(10,2)` o unidades menores, incluyendo totales, depósitos, penalizaciones y pagos.
5. Convertir estados libres de reserva a enum y definir una máquina de transiciones explícita.
6. Agregar índices para ownership, filtros, disponibilidad, producto, usuario y rangos de fecha.
7. Agregar restricciones de integridad: relaciones, unicidad, checks de valores, soft delete y timestamps.
8. Diseñar la prevención de solapamiento: transacción serializable/bloqueo o constraint de exclusión PostgreSQL con rango de fechas.
9. Implementar idempotencia para creación de reserva y operaciones de pago.
10. Centralizar la creación de auditoría para cambios de estado, cancelaciones, KYC, borrados y pagos.

**Aceptación:** `migrate deploy` funciona desde una base limpia; los datos existentes sobreviven; dos reservas concurrentes no pueden ocupar el mismo intervalo; reintentar la misma petición no duplica reserva ni cargo.

### Fase 3 — Auth, sesión, perfil y KYC

**Objetivo:** completar la identidad sin exponer datos ni permitir acciones no verificadas.

1. Unificar `RegisterDto` y eliminar DTOs duplicados o sin uso.
2. Implementar expiración, refresh rotatorio, revocación y logout server-side si el modelo elegido lo requiere.
3. Hacer que el cliente HTTP cierre sesión ante `401` y no use un usuario cacheado como prueba de autenticación.
4. Implementar `PATCH /user` para actualizar únicamente el usuario autenticado.
5. Implementar avatar con límites de tamaño, extensión permitida, validación de contenido, transformación y limpieza de assets reemplazados.
6. Implementar `VerificationRequest` con un único pedido pendiente por usuario, estado, reviewer y auditoría.
7. Guardar documentos únicamente en storage privado o URLs no públicas con acceso temporal; nunca en la base ni en el bundle.
8. Separar endpoint de consulta del usuario y endpoints administrativos de aprobar/rechazar.
9. Aplicar KYC server-side en publicar y reservar; el frontend solo refleja el estado.
10. Evitar devolver DNI, email, teléfono o URLs sensibles en perfiles públicos.

**Aceptación:** perfil y avatar persisten; un usuario no verificado recibe `403` al publicar/reservar; una solicitud KYC duplicada se rechaza; solo un admin puede aprobar; el frontend actualiza el estado después del envío.

### Fase 4 — Products y Reservations como casos de uso seguros

**Objetivo:** cerrar el ciclo principal con consistencia y ownership.

1. Definir DTOs de producto con límites de texto, precios, categoría, ubicación y fotos.
2. Aplicar paginación, filtros, búsqueda y ordenamiento en backend.
3. Exponer un DTO público que no revele dirección exacta, `ownerId` ni campos internos innecesarios.
4. Implementar ownership en cada `PATCH`, `DELETE`, upload y lectura privada.
5. Implementar reservas con fechas normalizadas, zona horaria, horario de entrega y reglas de mínimo/máximo.
6. Calcular servidoramente días, tarifa aplicable, envío, depósito, penalización y total.
7. Verificar disponibilidad dentro de una operación atómica; no depender de `isAvailable` como única fuente para rangos.
8. Definir permisos por transición: inquilino, dueño, admin y sistema.
9. Incluir el owner público mínimo en reservas del inquilino.
10. Completar cancelación de 48 horas y resolución de cancelación solo después de fijar política comercial.
11. Agregar expiración automática, estado de pago y fechas reales de entrega/devolución.

**Aceptación:** el mismo cálculo de total aparece en reserva, checkout y webhook; una petición alterada no cambia precio ni propietario; todos los estados inválidos devuelven `409`; el historial distingue dueño e inquilino correctamente.

### Fase 5 — Pago real y conciliación

**Objetivo:** eliminar el manejo inseguro de tarjetas y hacer que el dinero dependa de eventos verificables.

1. Retirar del frontend todo campo PAN, vencimiento y CVV propio.
2. Crear preferencia/checkout con Mercado Pago desde backend usando credenciales privadas solo en servidor.
3. Asociar `reservationId`, importe calculado, usuario y una clave de idempotencia.
4. Redirigir o montar el checkout oficial del proveedor sin que React procese datos de tarjeta.
5. Implementar webhook autenticado/verificado, idempotente y tolerante a reintentos.
6. No marcar una reserva como pagada por el redirect del navegador; hacerlo solo por confirmación server-to-server.
7. Modelar `Payment` con estados, proveedor, referencia externa, importe, moneda, timestamps y errores sin datos sensibles.
8. Definir expiración de preferencias, reembolsos, cancelaciones, depósito y conciliación manual.
9. Aplicar firma/verificación, rate limit y protección contra replay al webhook.
10. Eliminar cualquier log de tarjeta, token privado o respuesta confidencial del proveedor.

**Aceptación:** no se almacenan ni pasan PAN/CVV por React o API propia; manipular query params no altera el total; un webhook repetido no duplica el pago; una reserva no pasa a pagada por una respuesta falsa del cliente.

### Fase 6 — Chat y mensajería

**Objetivo:** ofrecer comunicación autorizada, durable y coherente entre REST y WebSocket.

1. Elegir modelo: conversación por reserva o conversación producto-inquilino; no mezclar ambos contratos.
2. Persistir `Message` con `senderId`, `reservationId/conversationId`, `clientMessageId`, `createdAt`, `readAt` y estado.
3. Autenticar el handshake WS y autorizar `join` por participación real en la reserva.
4. Validar longitud, contenido, frecuencia y tamaño de cada mensaje.
5. Persistir antes de emitir; responder con ID server-side y `clientMessageId` para reconciliación.
6. Implementar historial REST paginado y evitar que REST/WS sobrescriban mensajes pendientes.
7. El servidor debe rechazar mensajes en reservas `CANCELLED` o `COMPLETED`, aunque el frontend falle.
8. Manejar desconexión, reconexión, rejoin, duplicados, orden y mensajes no entregados.
9. Consumir eventos `error` en frontend y diferenciar `401`, `403`, `404`, red caída y servidor no disponible.
10. Añadir moderación, reporte o bloqueo si el producto lo requiere.

**Aceptación:** solo participantes acceden; cada mensaje visible fue aceptado por backend; no se pierden mensajes durante reconexión; una reserva cerrada es de solo lectura desde cualquier cliente.

### Fase 7 — Integración frontend sin lógica sensible

**Objetivo:** conectar todas las pantallas al contrato real y retirar mocks, cálculos peligrosos y estados engañosos.

1. Centralizar API client con timeout, `AbortController`, `Content-Type`, respuestas vacías, `401/403/409/5xx`, request ID y cancelación por navegación.
2. Crear adapters únicos para `User`, `Product`, `Reservation`, `Payment`, `Verification` y `Message`.
3. No confiar en query params de precio, días, nombre o disponibilidad; usar el resumen devuelto por backend.
4. Reemplazar datos mock de Home y Benti por catálogo real con cache y paginación.
5. Implementar estados de carga, error, vacío, reintento y bloqueo de doble envío en todas las mutaciones.
6. Conectar perfil/avatar y refrescar `me` después de cambios.
7. Conectar KYC y consultar estado actual; revocar previews con `URL.revokeObjectURL`.
8. Corregir cancelación para mostrar exactamente la política backend y permitir el flujo con cargo si corresponde.
9. Pasar `readOnly` a todos los accesos al chat y mantener la validación server-side.
10. Resolver CSP por entorno con API, WSS, Cloudinary y proveedores estrictamente allowlisted; retirar `unsafe-eval` y reducir `unsafe-inline` cuando sea viable.
11. Eliminar `product.model.js` con `Math.random()`, servicios duplicados y funciones mock no utilizadas.
12. Mantener favoritos, reviews, OAuth y contacto ocultos o marcados como no disponibles hasta tener API real.

**Aceptación:** ninguna pantalla afirma éxito antes de la respuesta server-side; no se realizan cálculos financieros autoritativos en el cliente; Home, catálogo, detalle y dashboard muestran la misma fuente de datos.

### Fase 8 — Features complementarias y operación

Implementar cada módulo como cambio independiente, solo después del core:

- Google OAuth con `state`, `nonce`, redirect allowlist y vinculación segura de cuentas.
- Reviews solo después de una reserva completada, con unicidad y moderación.
- Favoritos persistentes con `@@unique([userId, productId])`.
- Notificaciones in-app primero; email/push como fase posterior.
- Categorías y ubicaciones controladas, no strings libres si afectan filtros.
- Galería de fotos con orden, límites, limpieza y soft delete.
- Geolocalización solo con consentimiento y minimización de precisión.
- Cache Redis para catálogo cuando las métricas justifiquen la complejidad.
- Auditoría y métricas sin PII innecesaria.

---

## 6. Responsabilidad por capa

| Regla o función | Frontend | Backend |
|---|---|---|
| Validar formato visual | Sí, para UX | Sí, autoridad |
| Validar permisos/roles/ownership | Ocultar acciones | Decidir y rechazar |
| Acceso a PostgreSQL/Prisma | Nunca | Único lugar |
| Calcular precio, depósito, envío y penalización | Mostrar resultado | Calcular y persistir |
| Disponibilidad y solapamiento | Mostrar calendario | Resolver atómicamente |
| Estado de reserva/pago/KYC | Representar | Transicionar y auditar |
| JWT/session | Enviar de forma segura | Firmar, validar, revocar/revalidar |
| Archivos | Preview y UX | Límites, contenido, storage y acceso |
| Tarjetas | Checkout oficial, sin PAN/CVV propio | Preferencia, webhook y conciliación |
| Chat | Renderizar/reconectar | Autorizar, persistir y emitir |
| Errores | Traducir por código | Generar contrato estable |

---

## 7. Pruebas obligatorias

### 7.1 Backend unitarias

- Registro ignora o rechaza `role: ADMIN`.
- Login no revela si existe un email y rechaza usuarios eliminados.
- Guards rechazan token inválido, expirado, audiencia incorrecta y usuario sin permiso.
- DTOs rechazan campos desconocidos, strings excesivos, precios inválidos y fechas imposibles.
- Products aplica ownership, soft delete y allowlist de respuesta.
- Reserva calcula total exacto, respeta zona horaria y bloquea solapamiento.
- Máquina de estados rechaza transiciones imposibles.
- Cancelación calcula política de 48 horas en los límites exactos.
- KYC bloquea duplicados y acciones no verificadas.
- Upload rechaza bytes, MIME, contenido, dimensiones y cantidad fuera de límites.
- Webhook de pago valida firma y es idempotente.
- Mensajes rechazan no participantes y reservas cerradas.

### 7.2 E2E y contrato

- Registro → login → `me` → perfil.
- Usuario no verificado intentando publicar y reservar.
- Dueño creando producto, cargando foto y editándolo; otro usuario no puede modificarlo.
- Dos clientes intentando reservar el mismo intervalo concurrentemente.
- Reserva → pago pendiente → webhook aprobado → estado final.
- Cancelación antes, exactamente en y después de 48 horas.
- Chat REST/WS con reconexión, duplicado y cierre de reserva.
- Respuestas de error y paginación conformes a OpenAPI.
- CORS permitido y rechazado según entorno.

### 7.3 Frontend

- Cliente HTTP con `204`, HTML, timeout, desconexión, `401`, `403`, `409` y `5xx`.
- Sesión inválida no deja la aplicación aparentando estar autenticada.
- No se muestra pago exitoso por query params manipulados.
- Fechas, importes y estados proceden del backend.
- Mutaciones con doble click no duplican requests ni estados.
- Chat no muestra mensajes que el servidor no aceptó.
- No se permite escribir desde ningún acceso a una reserva cerrada.
- Previews de archivos se limpian correctamente.
- Home, catálogo, detalle y dashboard no mezclan mocks con datos reales.

### 7.4 Seguridad y operación

- SAST/dependencias, secret scanning y revisión de lockfiles.
- DAST básico sobre API autenticada y pública.
- Pruebas de rate limit, payloads grandes, MIME falsificado, IDs ajenos e inyección.
- Revisión de logs para confirmar ausencia de token, password, PAN, CVV, DNI y PII innecesaria.
- Backup/restore de PostgreSQL y prueba de migración desde cero.
- Prueba de carga de catálogo, reservas concurrentes, uploads y WebSocket.

---

## 8. Rendimiento y resiliencia

1. Paginación obligatoria en catálogo, reservas, usuarios, mensajes, reviews y notificaciones.
2. `select` explícito y DTOs pequeños; evitar `include` de relaciones no necesarias.
3. Índices comprobados con `EXPLAIN ANALYZE` sobre filtros y colisiones de fechas.
4. Cache solo para lecturas públicas y con invalidación definida; no cachear permisos, pagos ni disponibilidad sin estrategia fuerte.
5. Pool PostgreSQL con `max`, timeouts, idle timeout y manejo de errores.
6. Timeouts y reintentos con backoff solo para operaciones seguras o idempotentes.
7. Idempotency keys en reservas, pagos, uploads y acciones de transición si pueden reintentarse.
8. Límites de body, multipart, WebSocket, mensajes, paginación y filtros.
9. Jobs para expiración de reservas, limpieza de assets y notificaciones, con lock para no duplicar trabajo.
10. Métricas de latencia, errores por endpoint, conflictos de reserva, webhooks, conexiones WS y tamaño de pool.

---

## 9. Checklist de salida a producción

### Seguridad

- [ ] No existe una ruta para autoasignarse `ADMIN`.
- [ ] No se exponen passwords, hashes, tokens, PAN, CVV ni PII innecesaria.
- [ ] CORS, CSP, HTTPS/WSS, cookies o Bearer están configurados por entorno.
- [ ] Rate limit, Helmet, validación de entorno y límites de upload están activos.
- [ ] JWT tiene expiración, issuer, audience y estrategia de revocación/revalidación definida.
- [ ] KYC, ownership y transiciones se validan en backend.

### Integridad

- [ ] Migraciones reproducibles desde una base limpia.
- [ ] Backup y restore probados.
- [ ] Dinero no usa `Float`.
- [ ] Reservas concurrentes no se solapan.
- [ ] Pagos y mutaciones son idempotentes.
- [ ] Auditoría disponible para acciones sensibles.

### Integración

- [ ] OpenAPI coincide con requests/responses reales.
- [ ] Frontend no usa mocks en flujos productivos.
- [ ] Cliente HTTP maneja estados y errores consistentemente.
- [ ] `GET /me` o equivalente es la fuente de sesión, no `localStorage` sin validar.
- [ ] Chat y pagos tienen backend real o están ocultos del usuario.
- [ ] Todas las pantallas tienen estados loading/error/empty/retry.

### Calidad

- [ ] Unit, E2E, contrato, seguridad y carga pasan en CI.
- [ ] Lint y tests pasan en frontend y backend.
- [ ] Logs no contienen secretos ni PII prohibida.
- [ ] Hay health checks, request IDs, métricas y alertas mínimas.
- [ ] Se documentan rollback, migraciones, variables y dependencias externas.

---

## 10. Orden recomendado resumido

```text
F0 Contrato y decisiones
  -> F1 Vulnerabilidades críticas
  -> F2 Migraciones e integridad
  -> F3 Auth, perfil y KYC
  -> F4 Products y Reservations
  -> F5 Pago real
  -> F6 Chat
  -> F7 Integración frontend y retiro de mocks
  -> F8 Features complementarias y operación
  -> Pruebas de salida y auditoría final
```

No se debe avanzar a pagos, chat o features complementarias mientras continúen abiertos P0 de autorización, migraciones o concurrencia. Tampoco se debe considerar “conectado” un módulo solo porque la pantalla realiza una llamada: debe existir validación server-side, persistencia consistente, errores manejables, pruebas y observabilidad.
