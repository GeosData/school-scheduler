import json
import sys

RULES = {
    "noRepeatSameDay": {"on": True, "weight": 50},
    "groupGaps": {"on": True, "weight": 10},
    "teacherGaps": {"on": True, "weight": 2},
    "heavyEarly": {"on": False, "weight": 10},
}


def cfg_to_snapshot(c):
    return {
        "grid": {
            "days": c["days"], "periodMinutes": c["periodMinutes"],
            "startTime": c.get("startTime", "06:30"), "breakMinutes": c.get("breakMinutes", 15),
            "periodsPerDay": c["periodsPerDay"], "breakAfterPeriods": c["breakAfterPeriods"],
            "allowFreePeriods": c.get("allowFreePeriods", True),
        },
        "subjects": [{"name": n, "allowedRoomTypes": v["allowedRoomTypes"], "block": v.get("block", 0),
                      "heavy": bool(v.get("heavy"))} for n, v in c["subjects"].items()],
        "rooms": [{"type": t, "cap": cap} for t, cap in c["roomTypes"].items()],
        "teachers": [{"name": n, "notAfterPeriod": v.get("notAfterPeriod"),
                      "maxHoursPerDay": v.get("maxHoursPerDay")} for n, v in c["teachers"].items()],
        "groups": list(c["groups"]),
        "tasks": [dict(t) for t in c["tasks"]],
        "rules": json.loads(json.dumps(RULES)),
        "result": None, "error": "",
    }


def tasks_from(plan, groups):
    tasks = []
    for g in groups:
        for subj, teacher, weekly in plan(g):
            tasks.append({"teacher": teacher, "subject": subj, "group": g, "weekly": weekly})
    return tasks


def preescolar():
    groups = ["Transicion A", "Transicion B", "Transicion C"]
    titular = {"Transicion A": "Titular A", "Transicion B": "Titular B", "Transicion C": "Titular C"}
    subjects = {
        "Dim. Comunicativa": {"allowedRoomTypes": ["aula"]},
        "Dim. Cognitiva": {"allowedRoomTypes": ["aula"]},
        "Dim. Corporal": {"allowedRoomTypes": ["patio", "aula"]},
        "Dim. Artistica": {"allowedRoomTypes": ["aula"]},
        "Dim. Personal-Social": {"allowedRoomTypes": ["aula"]},
        "Ingles": {"allowedRoomTypes": ["aula"]},
        "Exploracion del Medio": {"allowedRoomTypes": ["aula"]},
    }

    def plan(g):
        t = titular[g]
        return [
            ("Dim. Comunicativa", t, 5), ("Dim. Cognitiva", t, 4),
            ("Dim. Personal-Social", t, 2), ("Exploracion del Medio", t, 1),
            ("Dim. Corporal", "Prof. Corporal", 3), ("Dim. Artistica", "Prof. Artistica", 3),
            ("Ingles", "Prof. Ingles Pre", 2),
        ]
    teachers = {}
    for t in list(titular.values()) + ["Prof. Corporal", "Prof. Artistica", "Prof. Ingles Pre"]:
        teachers[t] = {"notAfterPeriod": None, "maxHoursPerDay": 4}
    return {
        "days": ["Lun", "Mar", "Mie", "Jue", "Vie"], "periodMinutes": 45, "startTime": "07:00",
        "breakMinutes": 20, "periodsPerDay": 4, "breakAfterPeriods": [1], "allowFreePeriods": False,
        "roomTypes": {"aula": 3, "patio": 1}, "subjects": subjects, "groups": groups,
        "teachers": teachers, "tasks": tasks_from(plan, groups),
    }


def primaria():
    groups = ["1A", "2A", "3A", "4A", "5A"]
    titular = {g: f"Titular {g}" for g in groups}
    subjects = {
        "Matematicas": {"allowedRoomTypes": ["aula"], "block": 2, "heavy": True},
        "Lengua Castellana": {"allowedRoomTypes": ["aula"]},
        "Ciencias Naturales": {"allowedRoomTypes": ["aula", "laboratorio"]},
        "Ciencias Sociales": {"allowedRoomTypes": ["aula"]},
        "Ingles": {"allowedRoomTypes": ["aula"]},
        "Ed. Fisica": {"allowedRoomTypes": ["cancha", "aula"]},
        "Artistica": {"allowedRoomTypes": ["aula"]},
        "Tecnologia": {"allowedRoomTypes": ["aula", "sistemas"]},
        "Etica": {"allowedRoomTypes": ["aula"]},
        "Religion": {"allowedRoomTypes": ["aula"]},
    }

    def plan(g):
        t = titular[g]
        return [
            ("Matematicas", t, 5), ("Lengua Castellana", t, 5), ("Ciencias Sociales", t, 3),
            ("Etica", t, 1), ("Religion", t, 1),
            ("Ciencias Naturales", "Prof. Naturales", 3), ("Ingles", "Prof. Ingles Prim", 2),
            ("Ed. Fisica", "Prof. Ed. Fisica Prim", 2), ("Artistica", "Prof. Artistica Prim", 2),
            ("Tecnologia", "Prof. Tecnologia Prim", 1),
        ]
    teachers = {}
    for t in list(titular.values()) + ["Prof. Naturales", "Prof. Ingles Prim",
                                       "Prof. Ed. Fisica Prim", "Prof. Artistica Prim", "Prof. Tecnologia Prim"]:
        teachers[t] = {"notAfterPeriod": None, "maxHoursPerDay": 5}
    return {
        "days": ["Lun", "Mar", "Mie", "Jue", "Vie"], "periodMinutes": 50, "startTime": "06:30",
        "breakMinutes": 15, "periodsPerDay": 5, "breakAfterPeriods": [2], "allowFreePeriods": False,
        "roomTypes": {"aula": 5, "laboratorio": 1, "cancha": 1, "sistemas": 1}, "subjects": subjects,
        "groups": groups, "teachers": teachers, "tasks": tasks_from(plan, groups),
    }


def secundaria():
    grades = [6, 7, 8, 9, 10, 11]
    groups = [f"{g}-1" for g in grades]
    subjects = {
        "Matematicas": {"allowedRoomTypes": ["aula"], "block": 2, "heavy": True},
        "Lengua Castellana": {"allowedRoomTypes": ["aula"]},
        "Ingles": {"allowedRoomTypes": ["aula"]},
        "Ciencias Sociales": {"allowedRoomTypes": ["aula"]},
        "Quimica": {"allowedRoomTypes": ["aula", "laboratorio"], "block": 2, "heavy": True},
        "Fisica": {"allowedRoomTypes": ["aula", "laboratorio"], "block": 2, "heavy": True},
        "Biologia": {"allowedRoomTypes": ["aula", "laboratorio"]},
        "Ed. Fisica": {"allowedRoomTypes": ["cancha", "aula"]},
        "Artistica": {"allowedRoomTypes": ["aula"]},
        "Tecnologia": {"allowedRoomTypes": ["aula", "sistemas"]},
        "Etica": {"allowedRoomTypes": ["aula"]},
        "Religion": {"allowedRoomTypes": ["aula"]},
    }
    weekly = {"Matematicas": 5, "Lengua Castellana": 4, "Ingles": 3, "Ciencias Sociales": 4,
              "Quimica": 2, "Fisica": 2, "Biologia": 2, "Ed. Fisica": 2, "Artistica": 2,
              "Tecnologia": 2, "Etica": 1, "Religion": 1}
    prefix = {"Matematicas": "Mat", "Lengua Castellana": "Len", "Ingles": "Ing", "Ciencias Sociales": "Soc",
              "Quimica": "Qui", "Fisica": "Fis", "Biologia": "Bio", "Ed. Fisica": "EdF", "Artistica": "Art",
              "Tecnologia": "Tec", "Etica": "Eti", "Religion": "Rel"}
    import math
    tasks, teachers, load = [], {}, {}
    for subj, w in weekly.items():
        n_teachers = max(1, math.ceil(len(groups) * w / 24))
        names = [f"{prefix[subj]}-{i + 1}" for i in range(n_teachers)]
        for i, g in enumerate(groups):
            tname = names[i % n_teachers]
            teachers.setdefault(tname, {"notAfterPeriod": None, "maxHoursPerDay": 6})
            load[tname] = load.get(tname, 0) + w
            tasks.append({"teacher": tname, "subject": subj, "group": g, "weekly": w})
    part = 0
    for tname, l in load.items():
        if l <= 12 and part < 2:
            teachers[tname]["notAfterPeriod"] = 5
            part += 1
    return {
        "days": ["Lun", "Mar", "Mie", "Jue", "Vie"], "periodMinutes": 55, "startTime": "06:30",
        "breakMinutes": 15, "periodsPerDay": 6, "breakAfterPeriods": [2], "allowFreePeriods": False,
        "roomTypes": {"aula": len(groups), "laboratorio": 2, "sistemas": 2, "cancha": 2},
        "subjects": subjects, "groups": groups, "teachers": teachers, "tasks": tasks,
    }


LEVELS = [("n_pre", "Preescolar", preescolar), ("n_pri", "Primaria", primaria), ("n_sec", "Secundaria", secundaria)]


def build_workspace():
    return {
        "levels": [{"id": lid, "name": name} for lid, name, _ in LEVELS],
        "activeId": "n_sec",
        "data": {lid: cfg_to_snapshot(fn()) for lid, name, fn in LEVELS},
    }


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        import copy
        from engine import solve
        for lid, name, fn in LEVELS:
            c = fn()
            c["rules"] = RULES
            r = solve(copy.deepcopy(c), time_limit=15)
            gslots = c["periodsPerDay"] * len(c["days"])
            print(f"{name}: {len(c['groups'])} grupos, {len(c['teachers'])} docentes, "
                  f"{sum(t['weekly'] for t in c['tasks']) // len(c['groups'])}h/grupo sobre {gslots} -> "
                  f"{r['status']} ({r.get('seconds', '-')}s)")
    else:
        path = sys.argv[1] if len(sys.argv) > 1 else "example.workspace.json"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(build_workspace(), f, ensure_ascii=False, indent=1)
        print("escrito:", path)
