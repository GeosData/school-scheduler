import json
import os
import sys

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from engine import solve, validate

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "web", "dist")

app = FastAPI(title="school-scheduler")


@app.get("/api/example")
def example():
    with open(os.path.join(ROOT, "config.example.json"), encoding="utf-8") as f:
        return json.load(f)


@app.post("/api/solve")
def do_solve(cfg: dict):
    problems = validate(cfg)
    if problems:
        return {"status": "INVALID", "message": "Revisa la configuración antes de generar:", "problems": problems}
    try:
        return solve(cfg, time_limit=float(cfg.get("_timeLimit", 30)))
    except KeyError as e:
        return JSONResponse(status_code=400, content={"status": "ERROR", "message": f"Falta o no coincide: {e}"})


if os.path.isdir(DIST):
    app.mount("/", StaticFiles(directory=DIST, html=True), name="web")
