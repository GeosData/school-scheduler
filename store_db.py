import datetime
import json
import os
import sqlite3
import sys
import threading

_lock = threading.Lock()


def db_path():
    if getattr(sys, "frozen", False):
        base = os.path.dirname(sys.executable)
    else:
        base = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base, "horarios.db")


def _conn():
    c = sqlite3.connect(db_path())
    c.execute("CREATE TABLE IF NOT EXISTS workspace (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL, updated_at TEXT)")
    return c


def load_workspace():
    with _lock:
        c = _conn()
        try:
            row = c.execute("SELECT data FROM workspace WHERE id=1").fetchone()
            return json.loads(row[0]) if row else None
        finally:
            c.close()


def save_workspace(data):
    with _lock:
        c = _conn()
        try:
            c.execute(
                "INSERT INTO workspace(id, data, updated_at) VALUES(1, ?, ?) "
                "ON CONFLICT(id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at",
                (json.dumps(data), datetime.datetime.now().isoformat(timespec="seconds")),
            )
            c.commit()
        finally:
            c.close()
