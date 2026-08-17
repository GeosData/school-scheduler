import datetime
import json
import os
import socket
import sys
import threading
import traceback
import webbrowser

import uvicorn
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from engine import solve, validate
from store_db import db_path, load_workspace, save_workspace

APP_VERSION = "1.0.1"


def resource(*parts):
    base = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base, *parts)


def log_error(where, detail):
    try:
        path = os.path.join(os.path.dirname(db_path()), "errores.txt")
        with open(path, "a", encoding="utf-8") as f:
            f.write(f"\n=== {datetime.datetime.now().isoformat()} · {where} · v{APP_VERSION} ===\n{detail}\n")
    except Exception:
        pass


app = FastAPI(title="Horarios Escolares")


@app.get("/api/version")
def version():
    return {"version": APP_VERSION}


@app.get("/api/example")
def example():
    with open(resource("example.workspace.json"), encoding="utf-8") as f:
        return json.load(f)


@app.get("/api/workspace")
def get_workspace():
    return {"data": load_workspace()}


@app.put("/api/workspace")
def put_workspace(body: dict):
    save_workspace(body.get("data"))
    return {"status": "ok"}


@app.post("/api/solve")
def do_solve(cfg: dict):
    problems = validate(cfg)
    if problems:
        return {"status": "INVALID", "message": "Revisa la configuración antes de generar:", "problems": problems}
    try:
        return solve(cfg, time_limit=float(cfg.get("_timeLimit", 30)))
    except KeyError as e:
        log_error("solve/KeyError", traceback.format_exc())
        return JSONResponse(status_code=400, content={"status": "ERROR", "message": f"Falta o no coincide un dato: {e}. Revisa que docentes, materias y grupos coincidan con las cargas."})
    except Exception as e:
        log_error("solve", traceback.format_exc())
        return JSONResponse(status_code=500, content={"status": "ERROR", "message": f"Ocurrió un error al generar el horario ({type(e).__name__}). Si vuelve a pasar, repórtalo desde el botón de la aplicación."})


dist = resource("web", "dist")
if os.path.isdir(dist):
    app.mount("/", StaticFiles(directory=dist, html=True), name="web")


def free_port(start=8000):
    for p in range(start, start + 60):
        with socket.socket() as s:
            try:
                s.bind(("127.0.0.1", p))
                return p
            except OSError:
                continue
    return start


def main():
    port = free_port()
    url = f"http://127.0.0.1:{port}/"
    threading.Timer(1.5, lambda: webbrowser.open(url)).start()
    print(f"\n  Horarios Escolares corriendo en {url}")
    print("  Deja esta ventana abierta mientras usas la aplicacion. Cierrala para salir.\n")
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning")


if __name__ == "__main__":
    main()
