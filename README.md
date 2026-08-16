# school-scheduler — generador de horarios escolares

Motor config-driven para armar horarios de colegio sin choques. Todo se define en un JSON de configuración (ver `config.example.json`); el motor no trae ninguna regla quemada. Modelo completo en `docs/modelo-configurable.md`.

## Spike del motor (OR-Tools CP-SAT)

```bash
pip install -r requirements.txt
python solve.py config.example.json
```

Restricciones duras: choques docente/grupo/salón, disponibilidad y tope de horario del docente, intensidad horaria, salón dentro de los tipos permitidos por materia (química = aula o laboratorio), bloques en franjas consecutivas que no cruzan un descanso.
Restricciones blandas (optimizadas): no repetir materia el mismo día, minimizar huecos (horas libres) de cada grupo.

Resultado sobre el ejemplo (hora 55 min, 2 descansos, bloques, topes): **ÓPTIMO, 0 huecos, 0 repeticiones**.

## Escala
`python gen_school.py config.big.json` genera un colegio realista (18 grupos, 25 docentes, 180 tareas). Resultado: **ÓPTIMO en ~11s, 0 huecos** a 8 periodos/día. A 7 periodos (rejilla muy chica para 29h/semana) detecta **infactibilidad en ~5s** — señal útil de que falta capacidad.

## Estado
Motor validado (genera bien + escala). Siguiente: preferencias/pesos por restricción, más soft (docente sin huecos, materias pesadas temprano), UI de configuración, empaquetado offline, landing SEO.
