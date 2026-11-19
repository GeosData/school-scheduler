---
name: "Horarios (school-scheduler)"
shared:
  colors:
    ink: "#16233d"
    muted: "#51607a"
    line: "#dde5f0"
    primary: "#1e40af"
    primary-dark: "#1a3691"
    accent: "#16a34a"
    accent-soft: "#e7f6ee"
    accent-hover: "color-mix(in srgb, var(--accent-dark) 85%, black)"
    primary-soft: "#e9eefb"
    danger: "#dc2626"
    danger-soft-bg: "#fff4f4"
    danger-soft-border: "#f3c9c9"
    danger-text: "#b23b3b"
  rounded:
    sm: "12px"
    DEFAULT: "16px"
    lg: "24px"
    full: "9999px"
app:
  colors:
    bg: "#f3f6fb"
    accent-dark: "#15803d"
  typography:
    sans:
      fontFamily: "'Lexend', system-ui, -apple-system, 'Segoe UI', sans-serif"
      usage: "toda la app, único registro tipográfico"
landing:
  colors:
    bg: "#ffffff"
    bg-soft: "#f5f8fd"
    band: "#16233d"
  typography:
    sans:
      fontFamily: "'Lexend Variable', system-ui, 'Segoe UI', sans-serif"
      usage: "toda la landing"
---

## Reglas transversales (leer ANTES de tocar este archivo o la UI)

- **Técnicas (WCAG, tap targets, escala tipográfica, motion):** `memory/jotive/Frontend-Design-Standards.md`
- **Gusto/rechazos de Josse (set-IA-default, botones pill-flat, iconos, clichés de dashboard):** `memory/jotive/Estilo-Gustos-Josse.md`

## Brand & Style

Herramienta escolar para generar horarios — dos superficies con marca compartida pero implementación separada: **`web/`** = la app (React+Vite+Tailwind, donde el usuario arma/edita el horario) y **`landing/`** = marketing (Astro, vende el producto antes del login). Tono: confiable, ordenado, "software escolar serio" — azul institucional (`primary`) como color de marca/estructura, verde (`accent`) reservado para confirmación/éxito/CTA principal. Nada de esquinas rectas ni monospace-identidad (a diferencia de geosdata-com "taller") — este producto usa el registro **corporativo-amigable estándar**: radios generosos, sombras suaves, gradientes sutiles en hero/CTA final.

## Colors

**Unificado 2026-09-05:** `ink`, `muted`, `line`, `primary`, `primary-dark`, `accent`, `accent-soft` ya son el MISMO valor hex en `web/tailwind.config.js` y `landing/src/styles/global.css` — dejaron de divergir. Criterio usado: valor de `web/` como canónico (es el producto persistente que el usuario usa día a día), salvo verificación de contraste — se comprobó que ninguno de los cuatro tokones de texto (`ink`/`muted`) cae por debajo de 4.5:1 sobre el `bg` blanco de landing, así que no hizo falta ninguna excepción de legibilidad.

- **`primary`** (azul): color de marca — brand mark, títulos destacados (`h1 .hl`), iconos de feature, números de step, botón ghost de texto. No usar como fondo grande de página (sí como banda/CTA final con gradiente).
- **`accent`** (verde): única señal de "acción positiva/confirmación" — botón primario CTA, tags de estado ok, checks de trust/beneficios. Reservar para UN uso por vista; no mezclar con `primary` como interactivo genérico. `accent-hover` (`#128a3e`) y `accent-soft` (`#e7f6ee`) son sus derivados nombrados — ya no hex crudo repetido.
- **`ink`**: texto principal, alto contraste sobre `bg` (verificado >15:1 en ambas superficies).
- **`muted`**: texto secundario, labels, leyendas de tabla (verificado >5:1 en ambas superficies).
- **`line`**: bordes/dividers exclusivamente.
- **`primary-soft`** (`#e9eefb`, nuevo token): fondo sutil de eyebrow, icono de feature card, focus ring de inputs — antes hex crudo repetido 3 veces.
- **`danger`** (`#dc2626`) ahora existe como token compartido en ambas superficies. `landing/` además tiene `danger-soft-bg`/`danger-soft-border`/`danger-text` para el banner de error suave (paleta derivada, no literalmente el mismo rojo saturado que `web/` — landing usa un tratamiento pastel intencional para no alarmar en un formulario público).
- **`bg` (excepción documentada, NO unificada):** `web/` usa `#f3f6fb` (tintado, pensado para uso prolongado en la app) y `landing/` usa `#ffffff` (blanco puro, base del sistema de tarjetas blancas de una página de venta). Son roles con la misma etiqueta pero intención de producto distinta — forzar un solo valor rompería el sistema de dos capas (`bg`/`bg-soft`) que la landing ya usa para separar franjas. Se deja como excepción a propósito, no como drift pendiente.

## Typography

Una sola familia en ambas superficies: **Lexend** (`web/` estático, `landing/` variable vía Fontsource). Uso uniforme para todo — no hay mono ni fuente secundaria. Jerarquía por tamaño/peso, no por familia: `h1` clamp 34–56px weight 800 tracking -0.03em; `h2` de sección clamp 26–38px; cuerpo/lead 15–19px.

## Spacing & Shapes

**Unificado 2026-09-05:** escala de radios única en ambas superficies, alineada a Tailwind (la escala que `web/` ya usaba): `sm=12px` (inputs, iconos pequeños), `DEFAULT=16px` (cards, `rounded-2xl` — coincide exacto con `.card` de `web/`), `lg=24px` (callout, final CTA, report-card), `full=9999px` (pills, botones). `landing/` pasó de valores manuales dispersos (9–22px) a consumir `--radius-sm`/`--radius`/`--radius-lg`/`--radius-full` desde `:root`.

- **`web/` (app):** radios Tailwind estándar — `rounded-2xl` en cards, `rounded-full` en botones, `rounded-lg` en inputs. Sombra `shadow-sm` sutil.
- **`landing/`:** ahora usa la misma escala vía CSS vars (ver arriba). Sombras propias de landing sin cambios (`--shadow: 0 24px 60px -30px rgba(15,27,51,.4)` — decorativo, no es un rol compartido con `web/`).
- Contenedor landing: `.wrap` max-width 1120px, padding 24px fijo (no fluido con clamp, a diferencia de geosdata-com).

## Components

### Buttons

- **`web/` `.btn-primary`:** fill `primary`, texto blanco, hover `primary-dark`, pill (`rounded-full`), disabled → opacity 50 + cursor not-allowed (`.btn:disabled`).
- **`web/` `.btn-accent`:** fill `accent`, mismo patrón hover/disabled.
- **`web/` `.btn-ghost`:** fondo `slate-100`, texto `primary-dark`, hover `slate-200`.
- **`web/` `.input`:** borde `line`, focus → `ring-2 ring-primary` (focus-visible cubierto).
- **`landing/` `.btn-primary`:** fill `accent-dark` (fix WCAG AA 2026-09-05: `accent` plano fallaba 3.30:1 con texto blanco, `accent-dark` da 5.02:1), sombra verde, hover vía `accent-hover` (derivado con `color-mix`, siempre más oscuro que `accent-dark`) + `translateY(-1px)`. `.report-card button` (formulario de reporte) recibió el mismo fix. No tiene estado disabled documentado.
- **`landing/` `.btn-ghost`:** fondo blanco, borde `line`, hover borde `primary`.
- **Falta en ambos:** estado `loading` explícito — no se encontró spinner/skeleton en el CSS auditado.

### Cards / Tabla de horario

- **`web/` `.card`:** borde `line`, fondo blanco, `rounded-2xl`, `shadow-sm`, padding 5 (Tailwind spacing).
- **`landing/` `.tt-card`** (mockup de horario en el hero): borde `line`, `border-radius:18px`, `box-shadow:var(--shadow)`, header con fondo `bg-soft` y tag `accent`/`accent-soft`. Celdas de materia usan 7 colores decorativos sin nombre de rol (`.c1`–`.c7`, pasteles) — son datos (asignaturas), no tokens de marca.

### Formulario de reporte (`landing/report`)

- Input/textarea: borde `line`, focus → borde `primary` + `box-shadow: 0 0 0 3px #e9eefb` (hex suelto, no token — candidato a `primary-soft`).
- Banner de error: fondo `#fff4f4`, borde `#f3c9c9`, texto `#b23b3b` — sin equivalente de `danger` del `web/`, tokens completamente distintos entre superficies para el mismo rol.
- Estado éxito (`.ok .check`): fondo `#e7f6ee` = mismo valor que `accent-soft`, pero repetido como hex crudo en vez de var.

---

## Drift conocido

**Resuelto 2026-09-05** (ver commits/edits del mismo día): `primary`, `primary-dark`, `ink`, `muted`, `line`, `accent`, `accent-soft` ya son idénticos en valor entre `web/tailwind.config.js` y `landing/src/styles/global.css`. Todo hex crudo repetido en `landing/global.css` (`#128a3e`, `#e9eefb`, `#e7f6ee`, `#fff4f4`/`#f3c9c9`/`#b23b3b`) se promovió a tokens nombrados (`accent-hover`, `primary-soft`, `danger-soft-*`). Escala de radios unificada (`sm/DEFAULT/lg/full` = 12/16/24/9999px) en ambas superficies. Build verificado sin errores en `web/` (vite) y `landing/` (astro).

**Excepción intencional, NO es drift:** `bg` sigue siendo distinto por diseño — `#f3f6fb` (tintado) en `web/`, `#ffffff` (blanco puro) en `landing/`. Mismo rol, intención de producto distinta (app de uso prolongado vs página de venta con sistema de tarjetas blancas). No forzar en el futuro sin que sea una decisión explícita de Josse.

**Pendiente real (no resuelto, menor):** `web/` y `landing/` siguen siendo dos archivos de configuración físicamente separados (`tailwind.config.js` vs `:root` en CSS) — coinciden en valor pero no en una única fuente física. Si en el futuro se agrega un tercer token compartido, hay que actualizar ambos archivos a mano; no hay build step que los sincronice automáticamente. Aceptable dado que son dos apps con builds independientes (Vite vs Astro) — automatizarlo sería sobre-ingeniería para 2 superficies de un solo producto.

## Auditoría skills de diseño (2026-09-05)

Contra `emil-design-eng`/`impeccable`/`design-taste-frontend`:

- **Motion: disperso.** Hay `transition` en varios componentes de `web/` (App, sections, Timetable, Toaster) pero sin patrón único de duración/easing documentado — cada uno lo declaró por separado. `landing/` tiene menos.
- **Anti-slop: parcial.** Los 7 colores decorativos sin nombre de rol (`.c1`–`.c7` para materias) están bien justificados (son datos, no marca) — pero el resto del sistema no tiene una firma visual tan fuerte como geosdata-com (sombra dura) o atlas (terminal oscuro). Es más "app funcional" que "producto con personalidad".
- **UX: sin loading state** en ningún botón de ninguna superficie (confirmado en la auditoría de drift original) — es la brecha más concreta.
- **Veredicto: parcial.** Candidato #1: unificar duración/easing de transitions en `web/` + agregar loading state al botón de generar horario (la acción más lenta/crítica del producto).
