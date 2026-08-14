# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| CSS/UI edits in Benteveo, before touching any component style | benteveo-design-guard | C:\Users\esteb\Desktop\Programación\App Benteveo\frontend-benteveo\.claude\skills\benteveo-design-guard\SKILL.md |
| "sdd init", "iniciar sdd", "openspec init" | sdd-init | C:\Users\esteb\.claude\skills\sdd-init\SKILL.md |
| Changing/creating design | sdd-design | C:\Users\esteb\.claude\skills\sdd-design\SKILL.md |
| Creating a new skill | skill-creator | C:\Users\esteb\.config\opencode\skills\skill-creator\SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### benteveo-design-guard
- NO MODIFICAR `src/index.css` root (`:root`) ni sus variables — es la fuente de verdad del estilo; prohibido agregar/quitar/renombrar/cambiar valores o "consolidar" (SALVO excepción #2 abajo).
- CERO cambios de color o fuente en CUALQUIER archivo — SALVO excepciones aprobadas (2026-08-11):
  - #1: `#f59e0b`/`amber-500`/`var(--color-amber-500)` → `var(--color-primary)` (único cambio de color permitido).
  - #2: AGREGAR al root `--color-amber-400: #fbbf24;` y `--color-amber-600: #d97706;` (valores nuevos, sin modificar existentes) y usarlas vía var() en estrellas/hovers de DetalleProducto + gradient stop de ProductCard.css:6.
  - #3: card inline de Home.jsx:202 pierde `.product-card` global al migrar a CSS Modules (look change ACEPTADO).
- Reemplazos var() visual-idénticos permitidos (#FAF8F5→--color-bg, #423224→--color-brown, #1a1a1a→--color-dark, #ffffff→--color-surface).
- Cualquier OTRO cambio de color/fuente → frenar y consultar al dueño (anula progreso).
- Referencia: docs/PLAN-MEJORAS-UX-UI.md sección 0 (Restricciones inmutables + excepciones).

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| Plan de mejoras | docs/PLAN-MEJORAS-UX-UI.md | Guía de ejecución — sección 0 = restricciones inmutables |
| Root CSS (fuente de tokens, NO tocar) | src/index.css | `:root` define paleta, tipografías, radios, sombras |