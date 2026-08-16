from engine import solve, validate

CFG = {
    "days": ["Lun", "Mar", "Mie", "Jue", "Vie"],
    "periodMinutes": 55, "startTime": "07:00", "breakMinutes": 15,
    "periodsPerDay": 7, "breakAfterPeriods": [2, 5], "allowFreePeriods": True,
    "roomTypes": {"aula": 2, "laboratorio": 1, "cancha": 1},
    "subjects": {
        "Matematicas": {"allowedRoomTypes": ["aula"], "block": 2},
        "Quimica": {"allowedRoomTypes": ["aula", "laboratorio"], "block": 2},
        "Sociales": {"allowedRoomTypes": ["aula"], "block": 0},
        "EdFisica": {"allowedRoomTypes": ["cancha"], "block": 0},
    },
    "groups": ["11-1", "11-2"],
    "teachers": {
        "Prof-Mate": {"notAfterPeriod": None, "maxHoursPerDay": 6},
        "Prof-Quim": {"notAfterPeriod": None, "maxHoursPerDay": 6},
        "Prof-Soc": {"notAfterPeriod": 4, "maxHoursPerDay": 6},
        "Prof-Fis": {"notAfterPeriod": None, "maxHoursPerDay": 6},
    },
    "tasks": [
        {"teacher": "Prof-Mate", "subject": "Matematicas", "group": "11-1", "weekly": 5},
        {"teacher": "Prof-Mate", "subject": "Matematicas", "group": "11-2", "weekly": 5},
        {"teacher": "Prof-Quim", "subject": "Quimica", "group": "11-1", "weekly": 3},
        {"teacher": "Prof-Quim", "subject": "Quimica", "group": "11-2", "weekly": 3},
        {"teacher": "Prof-Soc", "subject": "Sociales", "group": "11-1", "weekly": 3},
        {"teacher": "Prof-Soc", "subject": "Sociales", "group": "11-2", "weekly": 3},
        {"teacher": "Prof-Fis", "subject": "EdFisica", "group": "11-1", "weekly": 2},
        {"teacher": "Prof-Fis", "subject": "EdFisica", "group": "11-2", "weekly": 2},
    ],
}


def solved():
    r = solve(CFG, 15)
    assert r["status"] in ("OPTIMAL", "FEASIBLE"), r
    return r


def test_meets_weekly_hours():
    r = solved()
    for t in CFG["tasks"]:
        grid = r["byGroup"][t["group"]]["grid"]
        count = sum(1 for row in grid for c in row if c and c["subject"] == t["subject"])
        assert count == t["weekly"], f"{t['subject']} {t['group']}: {count} != {t['weekly']}"


def test_no_teacher_double_booking():
    r = solved()
    expected = {}
    for t in CFG["tasks"]:
        expected[t["teacher"]] = expected.get(t["teacher"], 0) + t["weekly"]
    for tname, data in r["byTeacher"].items():
        cells = sum(1 for row in data["grid"] for c in row if c)
        assert cells == expected.get(tname, 0), f"{tname}: {cells} != {expected.get(tname, 0)} (posible doble reserva)"


def test_teacher_time_limit():
    r = solved()
    limit = CFG["teachers"]["Prof-Soc"]["notAfterPeriod"]
    grid = r["byTeacher"]["Prof-Soc"]["grid"]
    for row in grid:
        for p, c in enumerate(row):
            assert not (c and p >= limit), f"Prof-Soc dicta en hora {p+1}, pasa su tope {limit}"


def test_room_type_respected():
    r = solved()
    for g, data in r["byGroup"].items():
        for row in data["grid"]:
            for c in row:
                if c:
                    allowed = CFG["subjects"][c["subject"]]["allowedRoomTypes"]
                    assert c["roomType"] in allowed, f"{c['subject']} en {c['roomType']}, permitido {allowed}"


def test_blocks_consecutive_no_break_crossing():
    r = solved()
    breaks = set(CFG["breakAfterPeriods"])
    P = CFG["periodsPerDay"]
    for g, data in r["byGroup"].items():
        grid = data["grid"]
        for subj in ("Matematicas", "Quimica"):
            for d in range(len(CFG["days"])):
                run = 0
                for p in range(P):
                    c = grid[d][p]
                    if c and c["subject"] == subj:
                        run += 1
                        assert not (run >= 2 and (p - 1) in breaks), f"Bloque de {subj} cruza un descanso"
                    else:
                        run = 0


def test_validate_catches_unknown_group():
    bad = dict(CFG)
    bad["tasks"] = CFG["tasks"] + [{"teacher": "Prof-Mate", "subject": "Matematicas", "group": "99-9", "weekly": 2}]
    problems = validate(bad)
    assert any("99-9" in p for p in problems), problems


def test_validate_catches_overloaded_group():
    bad = dict(CFG)
    bad["periodsPerDay"] = 2  # 10 franjas, pero un grupo tiene 13 horas
    problems = validate(bad)
    assert any("horas semanales" in p for p in problems), problems
