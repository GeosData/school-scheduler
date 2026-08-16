# ADR-001 — Stack: FastAPI + React, offline con PyInstaller

## Contexto
El motor de horarios es Python (OR-Tools CP-SAT). Votación Escolar es Go puro + React embebido; aquí no aplica porque el solver es Python y empaquetar OR-Tools dentro de un binario Go no es viable.

## Decisión
- **Backend:** Python **FastAPI** — expone la configuración y el `/api/solve` (motor), y sirve el frontend estático.
- **Frontend:** **React + Vite + Zustand + Tailwind** (misma paleta cívica de Votación).
- **Offline:** empaquetar con **PyInstaller** a un `.exe` de Windows que levanta FastAPI en localhost y abre el navegador. Mantiene la promesa: gratis, sin instalar líos, offline.
- Un solo lenguaje de backend (Python), que además apalanca la meta de carrera.

## Estado
Aceptada. El empaquetado PyInstaller se valida en la fase de distribución (como la firma en Votación).
