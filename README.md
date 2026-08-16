# school-scheduler — generador de horarios escolares

App config-driven para armar horarios de colegio sin choques. Todo (rejilla, materias, salones, docentes, grupos, cargas, restricciones) se configura por institución; el motor no trae reglas quemadas. Modelo en `docs/modelo-configurable.md`, decisiones en `docs/adr-001-stack.md`.

## Correr

```bash
pip install -r api/requirements.txt
cd web && npm install && npm run build && cd ..
python -m uvicorn api.main:app --host 127.0.0.1 --port 8000
# abrir http://127.0.0.1:8000
```

Dev con recarga: `cd web && npm run dev` (proxy a FastAPI en 8000).

## Piezas
- `engine.py` — motor OR-Tools CP-SAT (config → horario). Restricciones duras: choques docente/grupo/salón, disponibilidad y tope de horario, intensidad, salón por tipo permitido, bloques que no cruzan descanso. Blandas: no repetir materia el mismo día, minimizar huecos.
- `api/main.py` — FastAPI: `/api/example`, `/api/solve`, sirve el frontend.
- `web/` — React + Vite + Zustand + Tailwind (paleta cívica). Configuración editable + generar + horario por grupo/docente + export CSV.
- `solve.py` / `gen_school.py` — CLI del motor y generador de colegio grande para pruebas de escala.

Motor validado: colegio real (18 grupos, 25 docentes) ÓPTIMO en ~11s. UI probada de punta a punta.

## Siguiente
Import Excel de docentes/cargas, ajuste manual del horario, más soft con peso, empaquetado offline (PyInstaller), landing SEO.

## Empaquetar offline (.exe de Windows)

```bash
pip install pyinstaller
cd web && npm run build && cd ..
pyinstaller --noconfirm --onefile --name Horarios-Escolar   --add-data "web/dist;web/dist" --add-data "config.example.json;."   --collect-all ortools --collect-all uvicorn --collect-all fastapi --collect-all starlette app.py
```

Resultado: `dist/Horarios-Escolar.exe` (~74 MB). Doble clic: levanta el server en localhost y abre el navegador. **No necesita Python instalado ni internet** — el intérprete y OR-Tools van dentro del .exe. `app.py` es el punto de entrada (rutas via `sys._MEIPASS`).
