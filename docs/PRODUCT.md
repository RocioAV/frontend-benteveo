# PRODUCT — Benteveo

> Dirección de producto · **"Feria de barrio"** · 2026-08-11
> Documento de referencia para toda decisión de UX/UI y de producto en el frontend.

---

## 1. Qué es Benteveo

Benteveo es un **marketplace comunitario de alquiler entre vecinos**: una feria de
barrio digital donde la gente común alquila y comparte herramientas, equipos y cosas
del día a día — taladros, motosierras, bicicletas, máquinas de coser, todo lo que se
usa un rato y después estorba.

El nombre viene del **benteveo**, el pájaro urbano de Buenos Aires: presente en cada
esquina, con carácter, y — clave para la marca — **presta atención a todo**. La
plataforma hace eso mismo: mira lo que necesitás, te lo acerca y lo devuelve a tiempo.

## 2. Problema

- Comprar una herramienta para usarla una vez es caro y acumula cosas.
- Pedir prestado a un conocido es incómodo y asimétrico ("¿cuándo se la devuelvo?
  ¿se la tengo que agradecer con algo?").
- Los alquileres comerciales formales (ferreterías, casas de alquiler) están lejos,
  tienen horarios rígidos y precios pensados para profesionales.

## 3. Solución

Un sistema de alquiler **peer-to-peer con confianza de barrio**:

- **Publicar** un producto es un proceso de 3 pasos simple (subí tu producto, seteá
  el precio, ¡listo!). La gente no es "vendedora profesional": no se le puede pedir
  un flujo de e-commerce complejo.
- **Explorar** un catálogo cercano con búsqueda y filtros por categoría.
- **Reservar** por día, con seña, entre vecinos verificados.
- **Contactar** directo al dueño: la relación es humana, no transaccional anónima.

## 4. Usuarios

### 4.1 El dueño de la cosa (quien publica)
- Vecino común, no comerciante. Tiene la maquinaria ahí guardada y quiere
  amortizarla + ayudar al barrio.
- **Necesita**: publicar rápido, que le paguen la seña, saber quién le alquila.

### 4.2 El inquilino (quien alquila)
- Persona que necesita la herramienta para un proyecto puntual: arreglar una
  canilla, pintar, una fiesta.
- **Necesita**: encontrar en segundos, confiar en el estado del producto y del
  dueño, reservar sin fricción.

## 5. Propuesta de valor

| Para el inquilino | Para el dueño |
|---|---|
| Ahorrás: pagás por día, no por compra | Tus cosas se pagan solas |
| Cerca: alquiler de barrio, sin ir al centro | Conocés quién las usa (identidad verificada) |
| Simple: 3 pasos, sin contratos | Seña asegurada antes de entregar |
| Humano: hablás directo con el vecino | Colaborás con tu comunidad |

## 6. Principios de producto

1. **Feria de barrio, no marketplace corporativo.** Calidez, cercanía y trato
   personal. Nada de estética "premium genérica" de SaaS.
2. **La simplicidad es un feature.** Publicar/reservar deben tardar minutos. Si un
   flujo necesita más de 3 pasos o un formulario largo, está mal diseñado.
3. **Confianza por diseño.** Identidad verificada, reseñas, política clara,
   seña. El vecino alquila tranquilo o no alquila.
4. **Anti-AI-slop.** Cero patrones genéricos de IA: degradados lineales ámbar con
   texto blanco, círculos flotantes decorativos, cards-que-contienen-cards,
   "3 pasos" con conectores idénticos. Ver checklist en `DESIGN.md`.
5. **Cada color y fuente tiene origen en el root** (`src/index.css`). No se
   inventa paleta nueva por página.

## 7. Dirección estética

- **Espacio amplio**: tarjetas de 1 nivel, nunca card-in-card.
- **Paleta**: blanco crudo `#FAF8F5` como base, **ámbar `#F2B705` como acento
  quirúrgico** (botones, links, llamados a la acción), verde oliva en secundarios
  (a definir en fases posteriores), texto siempre con contraste AA.
- **Tipografías con personalidad**: Fredoka para títulos, Montserrat para cuerpo
  (ver `DESIGN.md`).
- **Ilustraciones propias** en empty states y hero — sin íconos genéricos.
- **Movimiento con propósito**: cero bounce/elastic, `prefers-reduced-motion`
  respetado.

## 8. Métricas de éxito (orientativas)

- Tiempo medio para publicar un producto < 3 minutos.
- % de visitas que completan una reserva.
- % de alquileres repetidos (recompra del mismo dueño).
- NPS del trato (confianza entre vecinos).

## 9. No-goals (por ahora)

- No hay envíos: el alquiler es presencial/barrial.
- No hay suscripciones ni membresías.
- No hay categorías B2B ni alquiler profesional.
- No se moderniza la UI con estilos nuevos fuera del root de variables.

---

*Referencias: `docs/PLAN-MEJORAS-UX-UI.md` (auditoría y plan), `docs/DESIGN.md` (tokens y
reglas de diseño), skill `benteveo-design-guard` (restricciones inmutables).*