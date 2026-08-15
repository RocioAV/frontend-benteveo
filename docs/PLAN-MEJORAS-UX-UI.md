# Plan de Mejoras — Benteveo (Frontend)

> **Rama analizada:** `test` (local) · **Base de trabajo:** rebase con `dev`
> **Fecha:** 2026-08-11 · **Autor:** Auditoría técnica de punta a punta
> **Prioridad #1:** Funcionalidad rota · **Sistema de estilos:** CSS Modules + variables CSS
> **Norte de diseño:** Anti-diseño genérico de IA — dirección estética **"Feria de barrio"**

---

## Índice

0. Restricciones inmutables (LEER PRIMERO)
1. Resumen ejecutivo
2. Hallazgos — Funcionalidad y bugs
3. Hallazgos — UX/UI
4. Hallazgos — Accesibilidad
5. Hallazgos — Seguridad
6. Hallazgos — Colaboración y calidad de código
7. Pilar 0 — Anti-diseño genérico de IA
8. Skills del proyecto
9. Fases de implementación
10. Tabla de prioridad (impacto × esfuerzo)

---

## 1. Resumen ejecutivo

`test` está **desactualizada**: le faltan 14 pull requests que ya existen en `dev`
(auth con API real, Registro, DetalleProducto, ProductCard corregida, reserva parcialmente
arreglada, catálogo mejorado). Cualquier trabajo sobre `test` sin sincronizar implica
**doble trabajo**. Muchos "bugs" visibles en `test` ya están resueltos en `dev`.

Después del rebase persisten problemas reales: buscador muerto, rutas inexistentes,
reserva sin confirmación, login con clases inválidas, AuthContext que no persiste el
usuario, ausencia de página 404 / empty states / error boundary, doble sistema de estilos,
dos amarillos de marca en conflicto, iconografía en CDN externo, hotlinks de imágenes,
y problemas de contraste y semántica HTML.

**Decisión estratégica:** el trabajo arranca con el rebase y luego prioriza **funcionalidad
rota → auth → cimientos de diseño → accesibilidad → seguridad → rendimiento → QA**.

---

## 2. Hallazgos — Funcionalidad y bugs

| # | Problema | Ubicación | Estado tras rebase |
|---|----------|-----------|--------------------|
| 1 | `product.name` no existe (el JSON usa `title`) → h1 "Reservar undefined en ..." | `src/pages/Reservation.jsx:32` | ✅ Arreglado en dev (`product.title`) |
| 2 | Links a rutas inexistentes y "Iniciar sesión" navega Y loguea a la vez (mock) | `src/components/Header.jsx:58,64,70,76` | ⚠️ Parcial (dev usa AuthContext pero rutas siguen sin existir) |
| 3 | Footer apunta a `/catalogo` y `/reservar` (no existen; reales: `/explorar`, `/reservation/:id`) | `src/components/Footer.jsx:38-39` | ❌ Persiste |
| 4 | Botón "Ver detalle" sin acción | `src/components/ProductCard/ProductCard.jsx:25` | ✅ Arreglado en dev (Link) |
| 5 | Buscador decorativo: `onSearch` nunca se pasa desde Layout | `src/components/Header.jsx:8,36-42` + `src/layouts/Layout.jsx` | ❌ Persiste |
| 6 | Login sin lógica completa (inputs sin estado, Google/crear cuenta muertos) | `src/pages/Login.jsx` | ⚠️ Dev lo conecta a API pero faltan validaciones UX |
| 7 | Auth falso: `setUser(mockUser)` con `mockUser.json` hardcodeado | `src/components/Header.jsx:11,20-23` | ✅ Arreglado en dev |
| 8 | Reserva: botón `type="button"` sin handler → no confirma nada | `src/pages/Reservation.jsx:57-60` | ❌ Persiste |
| 9 | Sin validación de fechas en el pasado (sin `min`) | `src/pages/Reservation.jsx` | ❌ Persiste |
| 10 | Sin página 404, sin empty states en filtros, sin skeletons, sin error boundary | global | ❌ Persiste |
| 11 | Hero usa `<a href="/explorar">` → recarga completa de la SPA | `src/pages/Home.jsx:72-77` | ❌ Persiste |
| 12 | Clases inválidas de Tailwind: `text.lg` y `bg-v` | `src/pages/Login.jsx:10,28` | ❌ Persiste |

---

## 3. Hallazgos — UX/UI

- **Triple sistema de estilos**: Tailwind utility (Home/Login) + CSS custom por componente
  (Header/Footer/Catálogo) + `App.css` que es el **boilerplate muerto de Vite** (`.counter`,
  `.hero`, `.framework`, `.vite`, `#center`, `#next-steps`).
- **`ProductCard.css` y `Login.css` están vacíos**.
- **Dos amarillos en conflicto**: brand `#F2B705` (index.css) vs `#f59e0b` hardcodeado
  (header.css, Home.css, reservation.css) vs Tailwind `amber-500`. La marca se ve distinta
  según la página.
- El README exige **Lucide icons**, el código usa **Font Awesome por CDN**.
- **Cards duplicadas**: Home tiene card inline (seña, overlay hover) y Catálogo usa
  `ProductCard` con otro diseño. Mismo producto, dos looks.
- **Login desktop**: panel derecho vacío (círculo ámbar placeholder).
- **Hero con doble bienvenida**: "Bienvenido a Benteveo" + "Gente Común / Alquilando cosas
  comunes", sin usar el slogan del README ("Te hace la gauchada").
- Sin skeletons, empty states ni microinteracciones de feedback (toast).

---

## 4. Hallazgos — Accesibilidad

- `index.html`: `lang="en"` en sitio en español; `<title>frontend-benteveo</title>`
  no descriptivo; sin meta description.
- **Contraste que falla WCAG AA**: texto blanco sobre ámbar `#F2B705` (~2:1).
- Hamburger sin `aria-expanded` / `aria-controls`; íconos FontAwesome sin `aria-hidden`.
- Login: `htmlFor=""` y `id=""` vacíos → labels no asociados; sin `required`,
  sin `autocomplete`, sin `aria-invalid`.
- Footer con enlaces `href="#"`; sin skip-link; `prefers-reduced-motion` solo en un archivo.
- Jerarquía de encabezados: `ProductCard` usa `<h2>` en cada tarjeta del grid (debería ser `<h3>`).

---

## 5. Hallazgos — Seguridad

- Token JWT en **`localStorage`** (`src/services/api.js` en dev) → vulnerable a XSS;
  ideal httpOnly cookie.
- `AuthContext` guarda solo `{email}` → **al refrescar se pierde el usuario** aunque el
  token exista.
- Sin **protección de rutas**: se puede reservar sin login.
- `mockUser.json` con "PII" de ejemplo en el bundle.
- **Hotlinking de imágenes externas** en `products.json` (wikimedia, fravega, icbc, gstatic,
  patagoniabiketrips) → broken images, tracking, sin `lazy`.
- Font Awesome y Google Fonts desde CDN sin SRI → supply chain + render-blocking. Sin CSP.

---

## 6. Hallazgos — Colaboración y calidad de código

- `test` desincronizada vs `dev` (14 PRs de diferencia).
- **Dos lockfiles** (`package-lock.json` y `pnpm-lock.yaml`) → el equipo mezcla npm y pnpm.
- Sin tests, sin CI, sin PropTypes/TypeScript, sin hooks de pre-commit.
- Comentarios redundantes en `ProductCard.jsx` ("Funcion de una tajeta" — con typo).

---

## 7. Pilar 0 — Anti-diseño genérico de IA

**Norte rector de todo el trabajo.** No alcanza con "modernizar": hay que definir una
identidad propia y **gatear cada cambio de UI** contra los patrones genéricos de IA.

### Dirección estética fijada: "Feria de barrio"

Marketplace comunitario cálido:

- **Espacio amplio**: nada de rellenar con cajas anidadas; **tarjetas de 1 nivel,
  nunca card-in-card**.
- **Paleta**: blanco crudo `#FAF8F5`; **ámbar `#F2B705` como acento quirúrgico** +
  **verde oliva** para secundarios; texto siempre con contraste AA.
- **Ilustraciones propias** (empty states, hero) — no íconos genéricos de SVGRepo.
- **Tipografías con personalidad** definidas en `DESIGN.md` (revisar Montserrat/Fredoka).
- **Nada de degradados por defecto, cero bounce/elastic easing.**

### Visión UX/UI v2 — Moderna, líquida, intuitiva (clarificación del dueño 2026-08-12)

El resultado hasta la Fase 4 (accesibilidad + contraste) no alcanza: se siente "2022" y
"hecho por IA". Norte corregido para todo el trabajo de UI de aquí en adelante:

- **Moderno y distinto, no genérico**: jerarquía intencional, espaciado generoso, micro-motion
  con propósito. Cero slop IA (degradado lineal, círculos flotantes, cards anidadas, "3 pasos"
  idénticos, sombras negras pesadas).
- **Animaciones líquidas**: transiciones suaves con curvas spring/ease-out (NO bounce/elastic
  que parecen cartoon), entrada escalonada de cards (stagger), hover con escala sutil,
  page transitions. Todo con `prefers-reduced-motion`.
- **Super intuitiva**: feedback inmediato (toast, skeletons, empty states ilustrados),
  navegación predecible, cero fricción en reserva/login/búsqueda.
- **No parece IA**: tipografías con personalidad (Fredoka/Montserrat según DESIGN.md),
  ilustraciones propias, voz de marca ("Te hace la gauchada"), detalles artesanales.

⛔ **Requiere decisión del dueño**: la dirección v2 exige tokens de diseño nuevos (paleta
ampliada, motion tokens, tipografías) que hoy chocan con la Restricción #2 ("CERO cambios de
color o fuente"). Ver **Fase 8** — pendiente de aprobación.

### AI tells ya presentes en el código (detectados)

| AI tell (patrón genérico) | Ubicación hoy | Skill que lo corrige |
|---|---|---|
| Degradado ámbar lineal + texto blanco en bienvenida | `Home.jsx:43` | impeccable audit |
| Decoración abstracta de círculos flotantes | `Home.jsx:104-123` | impeccable audit / distill |
| Tarjeta que contiene tarjetas + overlay `from-black/40` | `Home.jsx:204-219` | impeccable audit |
| Tres bloques idénticos con conectores ("3 steps") | `Home.jsx:132-184` | taste-skill (three-equal-cards) |
| SVG de Google copiado de SVGRepo | `Login.jsx:29` | revisión manual + lucide-react |
| Sombra negra pesada `rgba(0,0,0,0.50)` | `PageCatalogo.css:126` | impeccable audit (dark glows) |
| Tipografías sobreusadas sin jerarquía intencional | `index.css:1` | impeccable typeset / taste-skill |
| Paleta beige+ámbar tipo "premium genérico" | Todo el tema | taste-skill anti-palette → definir dirección |

### Gate obligatorio pre-ship (cada cambio de UI)

1. **`impeccable audit`** — 59 reglas determinísticas (composición, a11y, perf).
2. **`taste-skill` pre-flight checklist** — contraste, hero fit, button wrapping, motion
   justification, 50+ gates.
3. **`emilkowalski review-animations`** — animar solo con propósito, curvas correctas,
   reduced-motion.

### Regla de superficie

- `impeccable` → UI de producto (catálogo, reserva, login, dashboard, forms).
- `taste-skill` → superficies de marca/landing (hero del Home, sección de pasos, imagen de
  marca).
- `emilkowalski` → solo animaciones justificadas.
- Ambos `impeccable` y `taste-skill` **NO** deben usarse a la vez sobre la misma superficie
  (vocabularios de diseño que colisionan).

---

## 8. Skills del proyecto

> ⚠️ **Estado real (verificado 2026-08-12):** NINGUNA de las skills de diseño/animación/ahorro
> de tokens listadas abajo está instalada todavía. **Instaladas hoy:** `benteveo-design-guard`,
> SDD (`init/explore/propose/spec/design/tasks/apply/verify/archive/onboard`),
> `skill-registry`, `skill-creator`, `find-skills`, `branch-pr`, `issue-creation`,
> `judgment-day`, `go-testing`. **Pendientes de instalar:** `emilkowalski/skills` (animaciones),
> `anthropics/skills` (frontend-design), `delphine-l/claude_global` (token-efficiency),
> `pbakaus/impeccable`, `Leonxlnx/taste-skill`. Los comandos de abajo son el plan de
> instalación, no un registro de lo ya instalado.

```bash
# Animaciones (Emil Kowalski) — repo plural "skills"
npx skills add emilkowalski/skills

# Diseño / auditoría (pbakaus)
npx skills add pbakaus/impeccable

# Anti-slop frontend (Leonxlnx) — requiere flag
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"

# Ahorro de tokens
npx skills add delphine-l/claude_global --skill token-efficiency
```

**Notas:**
- `emilkowalski/skill` (singular) no existe; el repo real es `emilkowalski/skills`
  (incluye `emil-design-eng`, `animate`, `find-animation-opportunities`,
  `improve-animations`, `review-animations`, `animation-vocabulary`).
- `claude-token-eficiente` no existe con ese nombre; el sustituto verificado es
  `token-efficiency` de `delphine-l/claude_global`.
- **Remotion queda fuera** (no se necesita video en un marketplace; librería pesada).
- "UI/UX Pro max" y "Context Engineering" no son skills instalables verificadas; en la
  práctica los cubren `impeccable init` (PRODUCT.md + DESIGN.md) y la brief-inference de
  taste-skill.

---

## 9. Fases de implementación

### Fase 0 — Sincronizar y sanear el repo (colaborativo)
1. **Rebase manual `test` ← `dev`** (traer los 14 PRs) resolviendo conflictos en
   `Home.jsx`, `Header.jsx`, `products.json`.
2. Unificar gestor de paquetes: eliminar uno de los dos lockfiles y documentar en
   `CONTRIBUTING.md`.
3. Crear `CONTRIBUTING.md`: flujo de ramas (main → dev → features), convenciones,
   pre-commit.
- **Skill**: `token-efficiency`.

### Fase 1 — Funcionalidad rota (prioridad #1)
| Bug | Fix |
|-----|-----|
| Buscador muerto (`onSearch` nunca llega) | Conectar `onSearch` en `Layout`; filtrar por título, categoría y ciudad |
| Rutas `/publish`, `/profile`, `/my-rentals`, `/catalogo`, `/reservar` inexistentes | Página 404 + catch-all; resolver o quitar links; Footer → `/explorar`, `/reservation/:id` |
| "Confirmar reserva" `type="button"` sin handler | Estado de éxito/error + persistencia; `min` = hoy en fechas |
| Login: clases inválidas `text.lg`/`bg-v`, sin validación | Atributos `required`/`type="email"`, estados en línea |
| Cards clicables de Home → `/detalle/:id` | Ya en dev; verificar navegación completa |
- Componentes nuevos (Skeleton, EmptyState, 404) nacen con **CSS Modules**.
- **Skill**: `token-efficiency`.

### Fase 2 — Auth robusto
1. `AuthContext`: persistir user (fetch `/auth/me` con token), logout seguro.
2. Rutas protegidas (reserva, publish) redirigiendo a `/login`.
3. Login/Registro UX: mostrar/ocultar contraseña, errores en línea, **quitar el SVG
   genérico de Google** y el checkbox/recuerda fake (no existen en backend).
- **Skills**: `impeccable harden` + `clarify` (estados de error, edge cases) +
  `token-efficiency`.

### Fase 3 — Cimientos de diseño (CSS Modules + variables CSS + Feria de barrio)
1. **`impeccable init`** → `PRODUCT.md` + `DESIGN.md` con la dirección Feria de barrio
   (paleta ámbar+oliva, tipografías, motion, anti-referencias).
2. `index.css`: consolidar variables (`#F2B705`, radius, shadows, fonts) como única fuente
   de verdad; eliminar `#f59e0b` hardcodeados.
   - ⛔ **COLISIONA con Sección 0** — el root NO se toca. Reemplazos de `#f59e0b` solo si el
     resultado visual es idéntico a `var(--color-primary)`; caso contrario, consultar al dueño.
3. Migración a **CSS Modules** por componente: Header, Footer, ProductCard primero; borrar
   `App.css` muerto de Vite, `Login.css` y `ProductCard.css` vacíos.
4. Modernizar UI sobre la dirección nueva: hero (sin degradado genérico), login (panel
   derecho real), cards unificadas (1 nivel), ilustración empty states.
5. Instalar `lucide-react`; **eliminar Font Awesome CDN**.
6. ErrorBoundary global + página 404 + skeletons + empty states con ilustración propia.
- **Skills**: `impeccable` (`init`, `document`, `extract`, `critique`, `typeset`,
  `colorize`, `layout`, `polish`); `taste-skill` (`redesign-existing-projects` o
  `high-end-visual-design`) para superficies de marca; `emilkowalski
  find-animation-opportunities`; `token-efficiency`.

### Fase 4 — Accesibilidad (WCAG AA)
1. `lang="es"`, `<title>` y meta description.
2. Contraste: blanco sobre ámbar → texto oscuro o ámbar oscuro en botones.
   - ⛔ **COLISIONA con Sección 0** — es un cambio de color. Requiere consulta previa al dueño;
     no ejecutar sin aprobación.
3. Labels con `htmlFor` reales, `aria-live` en errores, `aria-expanded` hamburger,
   `aria-hidden` iconos, skip-link, `prefers-reduced-motion` global.
4. Jerarquía de headings (ProductCard `<h2>` → `<h3>`).
- **Skills**: `impeccable audit` + `harden`; `emilkowalski review-animations`;
  `taste-skill` pre-flight.

### Fase 5 — Seguridad
1. Token: evaluar httpOnly cookie vs localStorage; documentar riesgo XSS y mitigación.
2. Quitar hotlinks de `products.json` (6+ URLs externas) → subir assets al repo.
3. `lazy` + `decoding=async` en imágenes; SRI o self-host fuentes; CSP en `vite.config.js`.
- **Skill**: `token-efficiency`.

### Fase 6 — Rendimiento
1. Corregir el `setInterval` del hero (2s) con pausa en hover / reduced-motion;
   `content-visibility` en grids.
2. `preconnect` a fuentes; revisión Lighthouse.
- **Skills**: `impeccable optimize`; `emilkowalski improve-animations`.

### Fase 7 — QA colaborativo
1. Vitest + Testing Library: login, registro, reserva, búsqueda, filtros.
2. GitHub Actions: lint + build + test por PR. Husky pre-commit.
- **Skill**: `token-efficiency`.

### Fase 8 — Modernización visual + Motion líquido (⛔ requiere aprobación del dueño)
1. Instalar skills: `anthropics/skills` (frontend-design), `emilkowalski/skills`
   (find-animation-opportunities / improve-animations / review-animations),
   `delphine-l/claude_global` (token-efficiency), `pbakaus/impeccable`, `Leonxlnx/taste-skill`.
2. Instalar librería de motion (`motion` = framer-motion v11) para springs/stagger.
3. **Enmendar la Restricción #2** de la Sección 0: habilitar tokens nuevos (paleta ampliada,
   motion tokens, tipografías) definidos en `DESIGN.md`. SIN esta enmienda, Fase 8 queda bloqueada.
4. Rediseño por superficie (gate: impeccable audit + taste-skill pre-flight + review-animations):
   - Hero Home: sin degradado genérico, ilustración propia, motion de entrada.
   - Cards: unificadas 1 nivel, hover líquido.
   - Login/Registro: panel real, micro-feedback.
   - Empty states / 404: ilustración propia + entrada animada.
5. Sistema de motion: duraciones/curvas como tokens, `prefers-reduced-motion` global.
- **Skills**: frontend-design + emilkowalski + impeccable + taste-skill + token-efficiency.
- **Modelos (sub-agentes)**: ver Sección 11.

---

## 10. Tabla de prioridad (impacto × esfuerzo)

| Prioridad | Tarea | Impacto | Esfuerzo |
|-----------|-------|---------|----------|
| 🔴 Alta | Rebase `test` ← `dev` | Crítico | Medio |
| 🔴 Alta | Buscador conectar | Alto | Bajo |
| 🔴 Alta | Rutas + 404 | Alto | Bajo |
| 🔴 Alta | Reserva confirmación + fechas | Alto | Medio |
| 🔴 Alta | `lang`/`title`/meta | Medio | Bajo |
| 🔴 Alta | Contraste AA | Alto | Bajo |
| 🔴 Alta | Unificar estilos (2 amarillos, CSS muerto) | Alto | Medio |
| 🔴 Alta | Quitar hotlinks de imágenes | Alto | Bajo |
| 🟠 Media | Auth persistente + rutas protegidas | Alto | Medio |
| 🟠 Media | Illustration system (empty states) | Medio | Medio |
| 🟠 Media | CSP | Medio | Bajo |
| 🟡 Baja | Tests + CI | Medio | Alto |
| 🟡 Baja | Husky pre-commit | Medio | Bajo |
| 🟡 Baja | Rendimiento fino (hero interval) | Bajo | Bajo |

---

## 11. Asignación de modelos por tarea (sub-agentes)

Regla del dueño (2026-08-12). Al delegar, elegir el modelo según la tarea:

| Tarea | Modelo |
|-------|--------|
| Implementación rápida de frontend, estilos, elementos visuales de UI (sin lógica de backend compleja) | **DeepSeek V4 Pro / Flash** |
| Planificación de estructura de componentes grandes, organización de sistemas de diseño, visión global pre-código | **Qwen 3.7 Max** |
| Creatividad y resolución de aspectos visuales de interfaz cuando los modelos tradicionales se quedan cortos | **Gemini 3 / Flash 3** (si está integrado externamente) |

Ante duda de cuál corresponde, consultar al dueño. Persistido en engram como
`config/model-assignment`.

---

*Documento de auditoría y plan. Ramas involucradas: `test` (base), `dev` (fuente de 14 PRs),
`main` (estable). Sin cambios de código todavía — este plan es la guía de ejecución.*

---

## 0. Restricciones inmutables (LEER PRIMERO)

> Definidas por el dueño del proyecto el **2026-08-11**. Son NO NEGOCIABLES y prevalecen sobre
> cualquier otra sección de este plan. Persistidas en engram y en la skill
> `benteveo-design-guard`.

1. **NO MODIFICAR el root de CSS** — `src/index.css` (`:root` y sus variables) es la fuente de
   verdad del estilo y el proyecto lo va a seguir usando tal cual está. Prohibido agregar,
   quitar, renombrar o cambiar el valor de variables; prohibido "consolidar" o reorganizar el
   root; prohibido alterar los estilos base del mismo archivo.
2. **CERO cambios de color o fuente** — si un cambio introduce un color distinto o una fuente
   distinta (incluido peso/tamaño/familia) en CUALQUIER archivo, **el progreso se anula**. Los
   componentes deben reutilizar las variables existentes del root (`--color-*`, `--font-*`,
   `--radius-*`, `--shadow-*`) sin alterar su valor visual resultante.
   - ⏳ **ENMIENDA EN REVISIÓN (dueño, 2026-08-12):** la "Visión UX/UI v2" (Sección 7) y la
     Fase 8 autorizan tokens de diseño NUEVOS (paleta ampliada, tipografías, motion tokens),
     con estas salvaguardas: (a) se definen SOLO en `DESIGN.md` + `index.css`; (b) se gatean con
     `impeccable` + `taste-skill` + `review-animations`; (c) cada cambio de color/fuente/motion
     se muestra al dueño ANTES de aplicarse (revisión explícita, no a ciegas). Hasta que el
     dueño confirme esta enmienda, la restricción original sigue vigente.
3. **Reemplazar hardcoded (ej. `#f59e0b`) por variables** solo si el color resultante es
   IDÉNTICO al de la variable. Si no lo es → no se toca y se consulta al dueño.
4. **Ante cualquier duda de camino** → preguntar al dueño antes de implementar. No asumir.

### Tareas del plan que colisionan (requieren consulta previa)

| Tarea original | Conflicto |
|---|---|
| Fase 3 #2: "consolidar variables en `index.css`" | Modifica el root → **PROHIBIDA tal cual**; re-evaluar alcance |
| Fase 3 #2: "eliminar `#f59e0b` hardcodeados" | ✅ **APROBADO 2026-08-11 (excepción única)**: dueño eligió **Opción B** — migrar `#f59e0b` → `var(--color-primary)` unificando al root. ÚNICO cambio de color permitido; cualquier otro color/fuente sigue prohibido. Los `#f59e0b` en `header.css`, `Home.css`, `reservation.css`, Tailwind `amber-*` y `var(--color-amber-500)` (ProductCard.css, PageCatalogo.css) se reemplazan por `var(--color-primary)`. |
| Fase 4 #2: "Contraste: blanco sobre ámbar → texto oscuro" | Cambio de color en botones → **requiere consulta** antes de tocar |

### Excepciones aprobadas por el dueño (2026-08-11)

1. **Unificar amarillos** (`#f59e0b` → `var(--color-primary)`): único cambio de color permitido. Cobertura: header.css, Home.css, reservation.css, Tailwind `amber-500`/*, `var(--color-amber-500)` (ProductCard.css, PageCatalogo.css).
2. **Agregar al root 2 variables NUEVAS** para los colores de degradado actuales (mismos valores, cero cambio visual): `--color-amber-400: #fbbf24` y `--color-amber-600: #d97706` — para reemplazar los hardcoded de estrellas (DetalleProducto), hovers (DetalleProducto) y gradient stop (ProductCard.css:6). Prohibido modificar variables existentes.
3. **Home.jsx:202 acepta cambio de look**: al migrar ProductCard a CSS Modules, la card inline del Home pierde los estilos globales accidentales de `.product-card` (colisión de CSS global). Cambio aceptado por el dueño.
4. Íconos: se mantiene Font Awesome CDN (sin lucide en Fase 3). Modernizar UI (hero, login panel, cards unificadas): FUERA de Fase 3.
5. **Fase 8 (Modernización visual + Motion líquido)** — en revisión del dueño (2026-08-12):
   dependencia `motion` v13 YA INSTALADA; tokens de diseño nuevos (paleta, tipografías,
   motion tokens) permitidos SOLO con las salvaguardas de la enmienda a la Restricción #2.
   Skills instaladas para esta fase: `frontend-design`, `emilkowalski/skills` (animate,
   review-animations, find-animation-opportunities, emil-design-eng, …), `impeccable`,
   `design-taste-frontend`, `token-efficiency`.

*Regla práctica: cualquier mejora UI debe ejecutarse SIN variar el aspecto dictado por el root.
Si no se puede cumplir sin tocar color/fuente, se consulta y se decide por separado.*

---

## 12. Actualización — Dirección "El Corralón v2" (2026-08-14)

Aplicando las skills globales de diseño (frontend-design, impeccable,
design-taste-frontend, review-animations) en las superficies principales, quedaron fijados
estos patrones que constituyen el estilo a mantener de aquí en adelante:

- **Card unificada** (`ProductCard`): foto + corazón de favorito (toggle) + título +
  proximidad ("A 4 cuadras de tu casa" / "A X km") + precio/día + puntaje (★ 0–5).
  SIN tag de categoría, SIN descripción, SIN "Seña".
- **Categorías circulares** con íconos Font Awesome (Jardinería → brote, Herramientas →
  caja, etc.) + contador contextual de resultados.
- **Buscador con lupa** en fila propia (header de dos filas); búsqueda insensible a acentos
  (título + categoría + ciudad).
- **Filtro de distancia**: los productos a más de 10 km no se muestran (a futuro saldrá de
  la geolocalización / dirección de registro).
- **Detalle de producto**: breadcrumb (INICIO > categoría > título), título bajo la foto,
  precio/día en el lateral derecho, calendario de reserva con fechas bloqueadas (mín. 1 día),
  método de entrega (domicilio con costo / retiro gratis), resumen (días + entrega + total),
  botón "Alquilar ahora" + nota "Pago seguro", y **condiciones de alquiler** (Depósito de
  Garantía) siempre visibles al pie.

### Regla de trabajo (dueño, 2026-08-14)
Usar SIEMPRE las skills globales de diseño para el mejor resultado — no limitarse al guard
`benteveo-design-guard` (que son restricciones, no calidad). La mejora debe ser de
jerarquía/layout/UX, no un "re-estilo" de tokens + motion.

### Pendiente crítico — bug de datos
`src/data/products.json`: 12 productos (ids 5-10 duplicados) sin `distance` ni `rating`, y 6
productos duplicados. Requiere decisión del dueño: deduplicar y completar distance/rating.