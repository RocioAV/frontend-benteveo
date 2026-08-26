# Contributing — Benteveo Frontend

Guía de colaboración para el repositorio `frontend-benteveo`. Leela antes de tocar código.

---

## Gestor de paquetes: pnpm (obligatorio)

El proyecto usa **pnpm** como único gestor de paquetes.

- **Instalar pnpm:** `corepack enable` (viene con Node) o `npm install -g pnpm`
- **Instalar dependencias:** `pnpm install`
- **Agregar una dependencia:** `pnpm add <paquete>` / `pnpm add -D <paquete>`
- **NO mezclar gestores:** está prohibido generar `package-lock.json` (npm) o `yarn.lock`.
  Si aparece, borralo y volvé a correr `pnpm install`.
- La versión está fijada en el campo `packageManager` de `package.json`.

---

## Flujo de ramas

```
main (estable)
 └── dev (integración)
      └── feature/<nombre> (trabajo por tarea)
```

1. Las ramas de trabajo salen de `dev`, nunca de `main`.
2. Antes de arrancar una tarea: `git checkout dev && git pull && git checkout -b feature/<nombre>`.
3. Los PRs apuntan a `dev`. `main` solo recibe merges desde `dev` (releases).
4. Mantené la rama sincronizada con `dev` (rebase, no merge, para historial limpio).

---

## Convenciones de código

- **Stack:** React 19 + Vite + React Router. JavaScript (JSX), sin TypeScript por ahora.
- **Estilos:** CSS Modules por componente + variables CSS del root (`src/index.css`).
- **Sistema de diseño:** respetar los design tokens del README (paleta, tipografías, radios).
  Los colores/fuentes se definen ÚNICAMENTE en el root de CSS.
- **Componentes:** un archivo por componente (`Componente.jsx` + `Componente.css` en carpeta propia
  cuando tiene estilos específicos).
- **Rutas:** declaradas en `src/App.jsx` con React Router.
- **Commits:** conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).
  Sin atribuciones de IA tipo "Co-Authored-By".

---

## Desk-check antes de subir un PR

- [ ] `pnpm lint` pasa sin errores
- [ ] `pnpm build` compila
- [ ] No se modificó el root de CSS (`src/index.css`, `:root`) sin aprobación
- [ ] No hay cambios de color o fuente fuera de las variables del root
- [ ] No se introdujo un nuevo lockfile (npm/yarn)
- [ ] La rama está rebaseada sobre `dev`