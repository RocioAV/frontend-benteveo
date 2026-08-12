# DESIGN — Benteveo (Dirección "El Corralón")

> **Dirección estética:** "El Corralón" — cultura de herramientas honesta.
> **Mundo visual reemplazado** (2026-08-12, decisión del dueño): se abandona el
> "beige premium + degradado ámbar + Fredoka/Montserrat" (AI-tell detectado) por una
> ferretería/taller de barrio digitalizada, con **motion mecánico-líquido**.
> **Fuente de verdad de tokens:** `src/index.css` (`:root`). Todo color/fuente/motion
> resuelve a un token. Ver restricciones en `PLAN-MEJORAS-UX-UI.md` §0.

---

## 0. Contrato de dirección (5 bloques)

- **THESIS:** Benteveo es el corralón del barrio donde tu vecino te presta la
  herramienta. La interfaz muestra la herramienta y la confianza, no una "promesa
  premium". Rechaza el arreglo por defecto: hero con degradado + texto blanco + 3 cards.
- **OWN-WORLD:** ámbar benteveo `#F2B705` como ÚNICO acento quirúrgico sobre
  hormigón/papel; Archivo bold (señalética de taller) para display, Archivo regular
  para cuerpo; componentes "de taller" (etiquetas colgadas, tablero, remaches).
- **STORY:** el visitante entiende en segundos que alquila herramientas entre vecinos,
  confía en el estado y en el dueño, y reserva sin fricción.
- **FIRST VIEWPORT:** titular tipográfico grande (Archivo 800, mayúsculas, tracking
  ajustado), el CTA es el único elemento ámbar, y las categorías se presentan como
  etiquetas colgadas de un tablero de herramientas.
- **FORM:** "El Corralón" (cultura de herramientas) — posición #1 de la lista evaluada
  por el dueño. Motion: botones que "hacen latch" (presión + snap-back), cards que se
  cuelgan del tablero con spring suave.

---

## 1. Paleta (tokens de color)

Estrategia: **Restrained** — neutros de taller + un solo acento. El ámbar `#F2B705`
es el amarillo del benteveo y el único color saturado; todo lo demás es hormigón,
papel y tinta.

| Variable | Valor | Uso canónico |
|---|---|---|
| `--color-primary` | `#F2B705` | Ámbar benteveo — CTA, links, activo (ÚNICO acento) |
| `--color-primary-hover` | `#D9A004` | Hover del acento |
| `--color-dark` | `#1A1A1A` | Tinta — texto principal, títulos |
| `--color-brown` | `#423224` | Pluma/madera — detalles cálidos secundarios |
| `--color-concrete` | `#6F6E69` | Hormigón — texto secundario, metadata, etiquetas de taller |
| `--color-concrete-surface` | `#EDECE8` | Superficie de taller — paneles, cards, tablero |
| `--color-bg` | `#FAF8F5` | Papel crudo — fondo general |
| `--color-surface` | `#FFFFFF` | Blanco — cards, modales, inputs |
| `--color-border` | `#E5E5E5` | Borde sutil |
| `--color-amber-400` | `#fbbf24` | Utilidad puntual (estrellas) |
| `--color-amber-600` | `#d97706` | Utilidad puntual (hovers, gradient stop) |

### Reglas de color

1. **Un acento, un foco.** `--color-primary` se reserva para el CTA y el estado
   activo. Si una pantalla tiene más de 2-3 elementos ámbar, perdió el foco.
2. **Contraste AA (WCAG):** texto sobre `--color-primary` siempre oscuro (nunca
   blanco — falla ~2:1). Texto secundario usa `--color-concrete` sobre `--color-bg`
   o `--color-surface` (verificar ≥ 4.5:1).
3. **Prohibido:** degradados por defecto, tonos "premium genéricos" (beiges, terracota),
   glows oscuros, y cualquier hex literal fuera de los tokens del root.

---

## 2. Tipografía

**Una sola familia variable: Archivo.** El eje de peso construye la jerarquía
(800 display → 400/500 cuerpo). Reemplaza a Fredoka (redondeada "2022") y Montserrat
(genérica/sobreusada).

| Variable | Valor | Uso canónico |
|---|---|---|
| `--font-title` | `'Archivo', system-ui, sans-serif` | Encabezados (h1–h6), peso 700-800 |
| `--font-body` | `'Archivo', system-ui, sans-serif` | Cuerpo, inputs, botones, peso 400/500 |

### Reglas de tipografía

1. **Display de taller:** titulares grandes en Archivo 800, mayúsculas, `letter-spacing: -0.01em`
   a `-0.02em` (señalética). Nada de pesos intermedios decorativos.
2. **Jerarquía por peso y tamaño, no por familia:** una idea = un peso/tamaño.
3. El slogan **"Te hace la gauchada"** (`.text-slogan`) mantiene su tratamiento:
   mayúsculas, tracking amplio — ahora en Archivo 700.
4. **Sin fuentes nuevas por componente.** (Posterior: posible acento mono para
   etiquetas de precio — se decide aparte, no en esta fase.)

---

## 3. Motion (gramática mecánico-líquida)

El motion es **material, no decoración**. Las herramientas se cuelgan, se traban y
caen en su lugar — la interfaz hereda esa física.

### Tokens de duración y easing (CSS)

| Variable | Valor | Uso |
|---|---|---|
| `--duration-fast` | `150ms` | Hover, focus, toggles |
| `--duration-base` | `240ms` | Reveals, cards |
| `--duration-slow` | `400ms` | Hero, page reveals |
| `--ease-out-quint` | `cubic-bezier(0.22, 1, 0.36, 1)` | Curva "líquida" estándar |

### Springs (framer-motion — `motion` v13)

| Nombre | Config | Uso |
|---|---|---|
| `spring-snappy` | `{ stiffness: 400, damping: 28 }` | Botones, CTA, toggles (latch) |
| `spring-base` | `{ stiffness: 260, damping: 26 }` | Cards, reveals |
| `spring-soft` | `{ stiffness: 170, damping: 26 }` | Hero, page transitions |

### Reglas de motion

1. **Firma: "latch".** El CTA se presiona (`scale: 0.97`) y vuelve con `spring-snappy`
   — como trabar una herramienta en el tablero.
2. **Reveal "colgar":** las cards entran con leve desplazamiento vertical + settle
   (`spring-base`), escalonadas 30ms (stagger).
3. **Cero** bounce/elastic exagerados, cero float decorativo infinito, cero parallax
   innecesario. El motion siempre tiene una causa (aparición, hover, cambio de estado).
4. **`prefers-reduced-motion`:** todo motion se desactiva; el contenido queda visible
   por defecto (nunca `opacity: 0` permanente sin fallback).

---

## 4. Radios y sombras

Se conserva la escala actual (no se tocan valores — §0). Uso por material:

| Token | Uso canónico (Corralón) |
|---|---|
| `--radius-sm` 8px | Etiquetas de taller, badges, checkboxes |
| `--radius-md` 12px | Botones, inputs |
| `--radius-lg` 16px | Cards de herramienta |
| `--radius-xl` 24px | Modales |
| `--radius-top-sheet` 32px | Bottom sheets móviles |
| `--radius-full` 9999px | Avatares, FAB |

### Reglas

1. **Sombras físicas, no glow:** `--shadow-sm/md/lg` (ya definidas) dan profundidad
   "de objeto". Prohibido `rgba(0,0,0,0.50)` y glows de color.
2. Las etiquetas/tags de taller pueden usar `--radius-sm` y borde `--color-concrete`
   para el look "rotulado", sin inventar radios.

---

## 5. Higiene anti-AI-tells (checklist obligatorio)

Antes de tocar UI:

1. Todo color/fuente resuelve a un token del root. Cero hex literales.
2. Sin degradados por defecto (lineal ámbar + texto blanco).
3. Sin círculos flotantes decorativos.
4. Sin card-in-card: tarjetas de 1 nivel.
5. Sin "3 pasos" genéricos con conectores idénticos.
6. Sin sombras negras pesadas ni glows.
7. Sin tipografía sobreusada (una idea = un peso/tamaño).
8. Sin paleta "premium genérica" (beige + terracota + serif) — el mundo es taller,
   no e-commerce corporativo.
9. Motion con causa y curva correcta; `prefers-reduced-motion` respetado.

---

## 6. Arquitectura de estilos

- **CSS Modules por componente** (Header, Footer, ProductCard, Layout, NotFound,
  EmptyState). CSS global solo para secciones de página (Home, PageCatalogo,
  Reservation, Registro).
- **Tailwind v4** para layout; colores arbitrarios como `var(--color-*)`.
- **`motion` v13** (`motion/react`) para springs/stagger/reveals — no animar con
  CSS puro cuando el efecto es un spring.
- **`src/index.css`:** el root conserva sus variables existentes (§0); se AGREGARON
  `--color-concrete`, `--color-concrete-surface` y los tokens de motion, y se
  reemplazó la fuente (Fredoka/Montserrat → Archivo) — cambio aprobado en Fase 8.
- **Font Awesome CDN** sigue siendo el sistema de íconos (sin lucide por ahora).

---

*Referencias: `docs/PRODUCT.md` (dirección de producto), `docs/PLAN-MEJORAS-UX-UI.md` §0
(restricciones + enmienda Fase 8), skill `benteveo-design-guard`.*
