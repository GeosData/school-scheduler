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

## Estado
Spike validado. Siguiente: preferencias/pesos por restricción, más soft (docente sin huecos, materias pesadas temprano), UI de configuración, empaquetado offline, landing SEO.
