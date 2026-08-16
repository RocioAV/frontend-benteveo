---
name: benteveo-design-guard
description: >
  Guarda las restricciones de diseño del frontend Benteveo (dirección "El Corralón", Fase 8).
  El root de CSS es la fuente de verdad; las variables ORIGINALES no se modifican (salvo el
  acento, cambiado por el dueño a #FFD166 en 2026-08-16). Fase 8 autorizó tokens nuevos
  (concrete/error/motion/fuente Archivo) bajo revisión del dueño.
  MOTION-FIRST: ninguna superficie puede quedar estática. Cualquier color/fuente NUEVO más allá
  de los tokens aprobados → consultar al dueño.
  Trigger: Antes de tocar cualquier CSS o componente visual (index.css, Header, Footer, ProductCard,
  Home, Login, Registro, PageCatalogo, botones, cards, empty states, 404).
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "2.1"
---

## When to Use

- Antes de editar CUALQUIER archivo CSS o componente visual de Benteveo
- Al crear componentes nuevos (skeleton, empty state, 404, botones, cards)
- Al reemplazar clases de Tailwind o estilos inline por variables del root
- En cualquier tarea de UI/UX delegada a subagentes

## Dirección estética (Fase 8 — 2026-08-12)

- **"El Corralón"** (`docs/DESIGN.md`): cultura de herramientas honesta, marketplace de barrio.
- Amarillo soleado `#FFD166` = **ÚNICO acento quirúrgico**; neutros de taller (hormigón / papel / tinta).
  *(Cambiado por el dueño el 2026-08-16 — antes ámbar `#F2B705`.)*
- **Tipografía**: Archivo (variable) — reemplazó a Fredoka/Montserrat.
- **MOTION-FIRST** (regla de oro del dueño): springs en entradas, hovers y micro-feedback.
  Una card o sección estática es inaceptable.

## Critical Patterns

### 1. Root de CSS (`src/index.css`)

- Variables ORIGINALES (`--color-primary`, `--color-primary-hover`, `--color-dark`, `--color-brown`,
  `--color-bg`, `--color-surface`, `--color-border`, `--color-amber-400/600`, radios, sombras)
  **NO se modifican** (ni valor, ni orden, ni renombre). Solo se leen.
  - **Excepción aprobada (2026-08-16):** `--color-primary` → `#FFD166` y
    `--color-primary-hover` → `#F5C04D`, por decisión del dueño. No volver a cambiarlos
    sin consultar.
- **Tokens Fase 8 (APROBADOS 2026-08-12, ya en el root)**: `--color-concrete`, `--color-concrete-surface`,
  `--color-error`, `--duration-fast/base/slow`, `--ease-out-quint`, y fuente **Archivo** en
  `--font-title`/`--font-body`.
- Cualquier token NUEVO más allá de estos → **consultar al dueño ANTES** de aplicarlo.

### 2. Color y fuente

- Usar SOLO tokens del root (originales + Fase 8). Cero hex literales en componentes.
- Amarillo (`--color-primary`) como acento quirúrgico; grises `--color-concrete` para texto
  secundario/metadata; `--color-concrete-surface` para paneles/superficies de taller.
- **Contraste AA (WCAG)**: texto sobre amarillo SIEMPRE oscuro (nunca blanco, falla ~2:1).
  Errores de validación → `var(--color-error)`.
- Fuente: Archivo únicamente (títulos 700–800, cuerpo 400/500).

### 3. Motion (obligatorio, motion-first)

- Toda superficie (hero, cards, forms, empty states, 404) debe tener motion:
  entrada con spring, hover con spring, CTA con **latch** (`whileTap scale 0.96`).
- Springs definidos en `DESIGN.md` §3: `spring-snappy` (400/28), `spring-base` (260/26), `spring-soft` (170/26).
- Respetar `prefers-reduced-motion` (usar `MotionConfig reducedMotion="user"`).
- **NUNCA** dejar una card o sección sin animación (preferencia explícita del dueño).

### 4. Anti-AI-tells (sin sacrificar motion)

- Sin degradados por defecto, sin círculos flotantes decorativos, sin card-in-card,
  sin sombras negras pesadas (`rgba(0,0,0,0.50)`), sin texto blanco sobre ámbar.
- **PERO el motion es prioridad**: un patrón animado que le guste al dueño (ej. "3 pasos" con
  conectores + ciclo activo) se respeta por encima de la limpieza anti-AI-tell.

### 5. Ante cualquier duda

- Cualquier duda de color, fuente o motion → **preguntar al dueño ANTES de implementar. No asumir.**

### 6. Cards y secciones de info (enmienda 2026-08-16)

- **Cards de producto**: fondo blanco (`--color-surface`), **SIN borde ni sombra**. La
  separación visual la da la imagen + el whitespace, no las cajas.
- **Secciones informativas** (info del catálogo, condiciones de alquiler, metodología del Home)
  comparten el mismo patrón: fondo blanco, **icono grande** (círculo `--color-primary` 4rem)
  arriba, **línea vertical gris corta** (2px × 2rem, `--color-border`) entre icono y título,
  título y texto centrados.

## Resources

- **Dirección de diseño**: docs/DESIGN.md (tokens, tipografía, motion, higiene)
- **Plan de mejoras**: docs/PLAN-MEJORAS-UX-UI.md (sección 0 — restricciones + enmienda Fase 8)
- **Fuente de tokens**: src/index.css (`:root`)
