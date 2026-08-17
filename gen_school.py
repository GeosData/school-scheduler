import json
import sys
import math

GRADES = [6, 7, 8, 9, 10, 11]
GROUPS_PER_GRADE = 3
PERIODS_PER_DAY = 6
BREAK_AFTER = [2]
TEACHER_CAP = 24

# 9 áreas obligatorias del MEN (Ley 115, Art. 23). Suman 30 h/semana = 6 horas/día x 5 días (jornada llena).
SUBJECTS = {
    "Matematicas": {"weekly": 5, "block": 2, "allowedRoomTypes": ["aula"], "heavy": True},
    "Lengua Castellana": {"weekly": 4, "block": 0, "allowedRoomTypes": ["aula"]},
    "Ingles": {"weekly": 3, "block": 0, "allowedRoomTypes": ["aula"]},
    "Ciencias Sociales": {"weekly": 4, "block": 0, "allowedRoomTypes": ["aula"]},
    "Quimica": {"weekly": 2, "block": 2, "allowedRoomTypes": ["aula", "laboratorio"], "heavy": True},
    "Fisica": {"weekly": 2, "block": 2, "allowedRoomTypes": ["aula", "laboratorio"], "heavy": True},
    "Biologia": {"weekly": 2, "block": 0, "allowedRoomTypes": ["aula", "laboratorio"]},
    "Ed. Fisica": {"weekly": 2, "block": 0, "allowedRoomTypes": ["cancha", "aula"]},
    "Artistica": {"weekly": 2, "block": 0, "allowedRoomTypes": ["aula"]},
    "Tecnologia": {"weekly": 2, "block": 0, "allowedRoomTypes": ["aula", "sistemas"]},
    "Etica": {"weekly": 1, "block": 0, "allowedRoomTypes": ["aula"]},
    "Religion": {"weekly": 1, "block": 0, "allowedRoomTypes": ["aula"]},
}


def build():
    groups = [f"{g}-{n}" for g in GRADES for n in range(1, GROUPS_PER_GRADE + 1)]
    tasks, teachers = [], {}
    prefix = {"Matematicas": "Mat", "Lengua Castellana": "Len", "Ingles": "Ing", "Ciencias Sociales": "Soc",
              "Quimica": "Qui", "Fisica": "Fis", "Biologia": "Bio", "Ed. Fisica": "EdF", "Artistica": "Art",
              "Tecnologia": "Tec", "Etica": "Eti", "Religion": "Rel"}

    for subj, meta in SUBJECTS.items():
        w = meta["weekly"]
        n_teachers = max(1, math.ceil(len(groups) * w / TEACHER_CAP))
        names = [f"{prefix[subj]}-{i+1}" for i in range(n_teachers)]
        for i, g in enumerate(groups):
            tname = names[i % n_teachers]
            teachers.setdefault(tname, {"load": 0, "block": False})
            teachers[tname]["load"] += w
            if meta["block"]:
                teachers[tname]["block"] = True
            tasks.append({"teacher": tname, "subject": subj, "group": g, "weekly": w})

    out_teachers = {}
    part_time = 0
    for tname, info in teachers.items():
        na = None
        if not info["block"] and info["load"] <= 14 and part_time < 2:
            na = PERIODS_PER_DAY - 1
            part_time += 1
        out_teachers[tname] = {"notAfterPeriod": na, "maxHoursPerDay": 6}

    n_groups = len(groups)
    cfg = {
        "days": ["Lun", "Mar", "Mie", "Jue", "Vie"],
        "periodMinutes": 55,
        "startTime": "06:30",
        "breakMinutes": 15,
        "periodsPerDay": PERIODS_PER_DAY,
        "breakAfterPeriods": BREAK_AFTER,
        "allowFreePeriods": True,
        "roomTypes": {"aula": n_groups, "laboratorio": 2, "sistemas": 2, "cancha": 2},
        "subjects": {s: {"allowedRoomTypes": m["allowedRoomTypes"], "block": m["block"], **({"heavy": True} if m.get("heavy") else {})} for s, m in SUBJECTS.items()},
        "groups": groups,
        "teachers": out_teachers,
        "tasks": tasks,
    }
    load_per_group = sum(m["weekly"] for m in SUBJECTS.values())
    print(f"Colegio: {n_groups} grupos, {len(out_teachers)} docentes ({part_time} con tope de horario), "
          f"{len(tasks)} tareas, {load_per_group} horas/semana por grupo sobre {PERIODS_PER_DAY*5} franjas")
    return cfg


if __name__ == "__main__":
    cfg = build()
    path = sys.argv[1] if len(sys.argv) > 1 else "config.big.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=1)
    print("escrito:", path)
