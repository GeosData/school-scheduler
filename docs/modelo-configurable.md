# Generador de horarios escolares — modelo configurable

> Producto para coordinadores académicos: arma el horario del colegio sin choques, respetando docentes, cargas, grupos, salones y restricciones. **Principio rector: todo es configurable por institución; el motor no trae ninguna regla quemada.** Nombre de repo provisional: `school-scheduler`.

## Necesidad

El coordinador académico arma los horarios a mano o en Excel, o pelea con software de pago (aSc, Untis) o difícil (FET). Necesita generar un horario válido y balanceado a partir de sus recursos y reglas, gratis, fácil y offline.

**HU:** Como coordinador académico, cargo mis docentes, materias, grupos, salones y cargas, defino mis reglas, y el sistema me genera un horario sin choques que puedo revisar, ajustar y exportar.

## Dos capas

1. **Configuración** — la institución define su rejilla, catálogos, recursos y qué reglas aplican con qué parámetros/pesos.
2. **Motor** — lee la configuración y genera el horario (OR-Tools CP-SAT propuesto).

Nada está hardcodeado. Los valores por defecto son a lo sumo una plantilla sugerida editable.

## Configuración (todo por colegio)

### Rejilla / jornada
- `periodMinutes` — duración de la hora de clase (varía por colegio: 45 / 50 / 55 / 60…).
- `startTime`, `periodsPerDay`, días de la semana activos.
- `jornada` — mañana / tarde / única (puede haber varias).
- `breaks[]` — descansos: posición y duración. No son horas de clase; parten la jornada en **segmentos**.

De aquí se derivan las **franjas** (time slots) sobre las que trabaja el motor.

### Catálogo de materias (`subjects`)
- Nombre.
- `allowedRoomTypes[]` — en qué tipos de salón puede dictarse (varios). Ej: Química → {aula, laboratorio}; Tecnología → {aula, sistemas}; Ed. Física → {cancha}. Si el colegio no tiene ese tipo de salón, no entra al conjunto.
- `blockDefault` — sugerencia de si va por bloque y tamaño (editable; plantilla, no regla).

### Salones (`rooms`)
- Nombre, `type` (aula / laboratorio / sistemas / cancha…), capacidad. El colegio registra solo los que tiene.

### Grados y grupos (`groups`)
- Grado + grupo (11-1, 11-2…).

### Docentes (`teachers`)
- `availability` — franjas en que puede dictar; incluye **tope de horario** ("no después de tal hora").
- `maxHoursPerDay` — opcional, tope de horas diarias.

### Cargas académicas / tareas (`tasks`)
Una tarea = asignación **docente × materia × grupo**.
- `weeklyPeriods` — intensidad horaria (en franjas por semana).
- `requiresBlock` + `blockSize` — flag por **tarea** (hereda de la materia por defecto, editable). La misma materia puede ir en bloque en un grupo y no en otro.

## Restricciones (todas configurables: activar/desactivar + parámetros + peso)

### Duras (obligatorias)
- Un docente no está en dos lugares a la vez.
- Un grupo no tiene dos clases a la vez.
- Un salón no se duplica.
- El salón asignado está en `allowedRoomTypes` de la materia.
- Se respeta `availability` y topes del docente.
- Se cumple `weeklyPeriods` de cada tarea.
- Los **bloques** se mantienen en franjas consecutivas y **no se parten por un descanso** (caen dentro del mismo segmento).

### Blandas (se optimizan; el colegio elige cuáles y su peso)
- Minimizar huecos (horas libres) de docentes y grupos.
- No repetir la misma materia dos veces el mismo día.
- Materias pesadas en primeras horas (opcional).
- Preferencias de docente (mañana/tarde).

## Motor
OR-Tools **CP-SAT** (gratis, maneja duras + blandas). Implica stack **Python** (encaja con la meta de carrera), no Go puro como Votación Escolar. Empaquetable a `.exe` offline (PyInstaller) para mantener el ángulo "sin instalar líos, gratis, offline".

## Foso / diferenciador
Gratis + fácil para no técnicos + offline + para Colombia (carga académica, intensidad horaria MEN, jornada). Contra aSc/Untis (de pago, marca de agua) y FET (gratis pero difícil).

## Riesgo
El valor está en el **motor**, no en la UI. Antes de montar interfaz: **spike** que pruebe que CP-SAT genera un horario sin choques y con pocos huecos sobre un colegio de ejemplo (config real: hora de 55 min, descansos, materias por bloque, topes de docente).

## Estado
- [x] Modelo configurable consolidado (este doc).
- [ ] Spike del motor (Python + OR-Tools) sobre config de ejemplo.
- [ ] Validar demanda (autocomplete coordinadores) — pendiente, como en Votación.
- [ ] UI de configuración + revisión/ajuste + export.
- [ ] Empaquetado offline + landing SEO.
