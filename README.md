# 🐦 Benteveo — Te hace la gauchada

Bienvenido al repositorio oficial de **Benteveo**. Una plataforma hiperlocal de alquiler P2P donde "entre vecinos nos entendemos".

---

## 🚀 Acerca del Proyecto

**Benteveo** es un marketplace P2P hiperlocal donde los vecinos alquilan entre sí objetos del hogar que casi no usan. La app gestiona publicaciones, reservas por día, pagos con depósito en garantía y reputación entre usuarios cercanos, resolviendo el problema clave de la confianza.

Combina la lógica de confianza de Airbnb con el formato marketplace de MercadoLibre, aplicado a la vida de barrio: ganar plata con lo que tenés y conseguir lo que necesitás a pocas cuadras, sin comprarlo.

### Problema que resolvemos
Muchas personas compran objetos que usan muy pocas veces y luego quedan guardados sin utilidad, mientras otras necesitan esos mismos artículos por un tiempo corto y no quieren gastar dinero comprándolos. No existe un sistema que gestione garantías, pagos, reputación y reglas claras para hacerlo entre particulares de manera segura.

### Nuestra Solución
Benteveo conecta vecinos para alquilar y compartir objetos de manera simple, económica y cercana. El foco inicial es hiperlocal (barrios o zonas específicas como Almagro, Palermo, Caballito, Quilmes centro, Varela centro).

### Valor Diferencial
Nuestro enfoque hiperlocal y comunitario. Más que una plataforma de alquiler, proponemos una nueva forma de consumo basada en la confianza, la reutilización y la conexión cara a cara entre personas, respaldada por un sistema de garantías y reputación.

---

## 👥 Público Objetivo

El proyecto está diseñado para dos perfiles clave:

| Perfil | Características y Necesidades |
| :--- | :--- |
| **Lado A (Oferta)** | Personas comunes en zonas urbanas que tienen herramientas o artículos infrautilizados y quieren generar ingresos extra o realizar donaciones. |
| **Lado B (Demanda)** | Jóvenes, estudiantes o familias que necesitan algo puntual por horas/días y prefieren alquilar cerca antes que comprar nuevo. |

---

## ⚙️ Funcionalidades Principales

| Funcionalidad | Descripción |
| :--- | :--- |
| **Sistema de Login** | Perfiles de usuario validados para operar en la plataforma. |
| **Publicación de Objetos** | Formulario integral con fotos, precio por día y ubicación (geolocalización). |
| **Sistema de Reservas** | Calendario interactivo para elegir fechas y confirmar disponibilidad. |
| **Chat Interno** | Comunicación directa para que dueño y alquilador coordinen la entrega. |
| **Pagos Seguros** | Pasarela de pago integrada con MercadoPago (Split / Checkout Pro). |
| **Soporte IA** | Chatbot inteligente para resolver dudas, monitorear, dar soporte y explicar políticas. |
| **Dashboard Admin** | Panel de control para validar usuarios y resolver conflictos. |
| **Confianza** | Sistema robusto de reputación y garantías. |

---

## 🎨 Sistema de Diseño (Design Tokens)

Para mantener la identidad visual, todos los desarrolladores deben respetar los siguientes parámetros. 

* **Logo:** `src/assets/logo-con-titulo.webp`
* **Iconografía:** [Lucide Icons (React)](https://lucide.dev/guide/react/)

### 1. Paleta de Colores

| Elemento | Código Hex | Uso Sugerido |
| :--- | :--- | :--- |
| **Amarillo Benteveo** | `#F2B705` | Botones, enlaces, isotipos y acentos. |
| **Negro Antracita** | `#1A1A1A` | Texto principal, fondos oscuros, isotipo de la casa. |
| **Marrón Pluma** | `#423224` | Detalles secundarios, sombras o textos sutiles. |
| **Blanco Crudo** | `#FAF8F5` | Fondo general de la web (evita el blanco puro chillón). |
| **Blanco Puro** | `#FFFFFF` | Fondos de tarjetas (cards) o detalles limpios. |

### 2. Tipografía (Google Fonts)

* **Principal (Logo / Títulos):** `Fredoka` (500 o 600 - Medium/SemiBold). Aporta una vibra geométrica, cercana y amigable.
* **Secundaria (Cuerpo de texto):** `Montserrat` (Regular/Medium). Limpia y legible.
* **Eslogan ("TE HACE LA GAUCHADA"):** `Montserrat` (700 - Bold), en mayúsculas (`uppercase`), con tracking amplio (`letter-spacing: 0.15em`).
* **Ultimor recurso :** `Roboto` (400 - Medium).


### 3. Redondeado de Bordes (Border Radius)

La app utiliza una estética *Soft UI*. Quedan prohibidas las esquinas completamente rectas.

| Token | Valor | Uso / Efecto Visual |
| :--- | :--- | :--- |
| `--radius-sm` | **8px** | Sutil. Para checkboxes, inputs pequeños y badges. |
| `--radius-md` | **12px** | Estándar moderno. Para botones, inputs de formularios y dropdowns. |
| `--radius-lg` | **16px - 20px** | Separación visual suave. Para cards y contenedores medianos. |
| `--radius-xl` | **24px** | Esquinas pronunciadas para modales, alertas principales y pop-ups. |
| `--radius-top`| **32px** | Exclusivo para parte superior de Bottom Sheets (modales de celular). |
| `--radius-full`| **9999px** | Formato píldora o círculo perfecto para Avatares y botones flotantes (FAB). |

---

## 👨‍💻 Equipo de Desarrollo

| Integrante | Integrante |
| :--- | :--- |
| Abraham Ferreira | Pedro Lezcano |
| Velazquez Rocio Alejandra | Lucia Iglesias |
| Edson Chura Salazar | Esteban Karaputny |
| Kevin Davalos | Rocio Choque |
| Camila Pillco Galdo | Maria Eugenia Pimienta |

---
*“Benteveo: Alquileres claros entre vecinos”.*