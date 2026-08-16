from ortools.sat.python import cp_model


def build_segments(periods, break_after):
    segments, cur = [], []
    for p in range(periods):
        cur.append(p)
        if p in break_after:
            segments.append(cur)
            cur = []
    if cur:
        segments.append(cur)
    return segments


def sessions_of(weekly, block):
    if block and block > 1:
        s = [block] * (weekly // block)
        if weekly % block:
            s.append(weekly % block)
        return s
    return [1] * weekly


def teacher_available(teacher, period):
    limit = teacher.get("notAfterPeriod")
    return limit is None or period <= limit


def solve(cfg, time_limit=30.0):
    days = cfg["days"]
    D, P = len(days), cfg["periodsPerDay"]
    breaks = set(cfg["breakAfterPeriods"])
    segments = build_segments(P, breaks)
    subjects, room_cap, teachers = cfg["subjects"], cfg["roomTypes"], cfg["teachers"]
    groups = cfg["groups"]

    sessions = []
    for task in cfg["tasks"]:
        subj = subjects[task["subject"]]
        for length in sessions_of(task["weekly"], subj.get("block", 0)):
            sessions.append({
                "teacher": task["teacher"], "subject": task["subject"], "group": task["group"],
                "len": length, "types": subj["allowedRoomTypes"], "cand": [],
            })

    model = cp_model.CpModel()
    place = {}
    for si, s in enumerate(sessions):
        te = teachers[s["teacher"]]
        for d in range(D):
            for seg in segments:
                for i in range(len(seg) - s["len"] + 1):
                    ps = tuple(seg[i:i + s["len"]])
                    if all(teacher_available(te, p) for p in ps):
                        s["cand"].append((d, ps))
        if not s["cand"]:
            return {"status": "INFEASIBLE",
                    "message": f"La clase {s['subject']} de {s['group']} (bloque {s['len']}) no cabe en ningun segmento con la disponibilidad del docente {s['teacher']}."}
        pv = []
        for (d, ps) in s["cand"]:
            v = model.NewBoolVar(f"pl_{si}_{d}_{ps[0]}")
            place[(si, d, ps[0])] = v
            pv.append(v)
        model.AddExactlyOne(pv)

    def occ(si, d, p):
        return [place[(si, dd, ps[0])] for (dd, ps) in sessions[si]["cand"] if dd == d and p in ps]

    allow_free = cfg.get("allowFreePeriods", True)
    for g in groups:
        gs = [si for si, s in enumerate(sessions) if s["group"] == g]
        for d in range(D):
            for p in range(P):
                terms = [t for si in gs for t in occ(si, d, p)]
                if allow_free:
                    if terms:
                        model.Add(sum(terms) <= 1)
                else:
                    model.Add(sum(terms) == 1)

    for tname in teachers:
        ts = [si for si, s in enumerate(sessions) if s["teacher"] == tname]
        for d in range(D):
            for p in range(P):
                terms = [t for si in ts for t in occ(si, d, p)]
                if terms:
                    model.Add(sum(terms) <= 1)

    uses_type = {}
    for si, s in enumerate(sessions):
        tv = []
        for ty in s["types"]:
            v = model.NewBoolVar(f"ut_{si}_{ty}")
            uses_type[(si, ty)] = v
            tv.append(v)
        model.AddExactlyOne(tv)

    for d in range(D):
        for p in range(P):
            for ty, cap in room_cap.items():
                terms = []
                for si, s in enumerate(sessions):
                    if ty not in s["types"]:
                        continue
                    ot = occ(si, d, p)
                    if not ot:
                        continue
                    e = sum(ot)
                    z = model.NewBoolVar(f"z_{si}_{d}_{p}_{ty}")
                    model.Add(z <= e)
                    model.Add(z <= uses_type[(si, ty)])
                    model.Add(z >= e + uses_type[(si, ty)] - 1)
                    terms.append(z)
                if terms:
                    model.Add(sum(terms) <= cap)

    for tname, te in teachers.items():
        mx = te.get("maxHoursPerDay")
        if not mx:
            continue
        ts = [si for si, s in enumerate(sessions) if s["teacher"] == tname]
        for d in range(D):
            terms = [len(ps) * place[(si, dd, ps[0])]
                     for si in ts for (dd, ps) in sessions[si]["cand"] if dd == d]
            if terms:
                model.Add(sum(terms) <= mx)

    rules = cfg.get("rules") or {}

    def rule(name, default_on, default_weight):
        r = rules.get(name) or {}
        return bool(r.get("on", default_on)), int(r.get("weight", default_weight))

    def gap_bools(owners, tag):
        out = []
        for oi, sidxs in enumerate(owners):
            for d in range(D):
                busy = []
                for p in range(P):
                    terms = [t for si in sidxs for t in occ(si, d, p)]
                    bv = model.NewBoolVar(f"b_{tag}_{oi}_{d}_{p}")
                    model.Add(bv == sum(terms)) if terms else model.Add(bv == 0)
                    busy.append(bv)
                for p in range(P):
                    before = model.NewBoolVar(f"bf_{tag}_{oi}_{d}_{p}")
                    after = model.NewBoolVar(f"af_{tag}_{oi}_{d}_{p}")
                    model.AddMaxEquality(before, busy[:p]) if p > 0 else model.Add(before == 0)
                    model.AddMaxEquality(after, busy[p + 1:]) if p < P - 1 else model.Add(after == 0)
                    hole = model.NewBoolVar(f"h_{tag}_{oi}_{d}_{p}")
                    model.Add(hole <= 1 - busy[p])
                    model.Add(hole <= before)
                    model.Add(hole <= after)
                    model.Add(hole >= before + after - busy[p] - 1)
                    out.append(hole)
        return out

    obj = []
    repeats_vars = []

    on, w = rule("noRepeatSameDay", True, 100)
    if on and w:
        for g in groups:
            for subjname in subjects:
                ss = [si for si, s in enumerate(sessions) if s["group"] == g and s["subject"] == subjname]
                if len(ss) < 2:
                    continue
                for d in range(D):
                    dayterms = [place[(si, dd, ps[0])] for si in ss for (dd, ps) in sessions[si]["cand"] if dd == d]
                    if not dayterms:
                        continue
                    ex = model.NewIntVar(0, len(ss), f"ex_{g}_{subjname}_{d}")
                    model.Add(ex >= sum(dayterms) - 1)
                    repeats_vars.append(ex)
        obj.append(w * sum(repeats_vars))

    on, w = rule("groupGaps", True, 3)
    if on and w:
        owners = [[si for si, s in enumerate(sessions) if s["group"] == g] for g in groups]
        obj.append(w * sum(gap_bools(owners, "g")))

    on, w = rule("teacherGaps", True, 1)
    if on and w:
        owners = [[si for si, s in enumerate(sessions) if s["teacher"] == t] for t in teachers]
        obj.append(w * sum(gap_bools(owners, "t")))

    on, w = rule("heavyEarly", False, 2)
    if on and w:
        heavy = []
        for si, s in enumerate(sessions):
            if subjects[s["subject"]].get("heavy"):
                for (d, ps) in s["cand"]:
                    heavy.append(ps[0] * place[(si, d, ps[0])])
        if heavy:
            obj.append(w * sum(heavy))

    if obj:
        model.Minimize(sum(obj))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit
    solver.parameters.num_search_workers = 8
    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {"status": "INFEASIBLE",
                "message": "No se encontro un horario que cumpla todas las restricciones. Revisa la carga contra las franjas disponibles, los topes de docente o los salones."}

    def empty_grid():
        return [[None for _ in range(P)] for _ in range(D)]

    by_group = {g: empty_grid() for g in groups}
    by_teacher = {t: empty_grid() for t in teachers}
    for si, s in enumerate(sessions):
        for (d, ps) in s["cand"]:
            if solver.Value(place[(si, d, ps[0])]):
                ty = next(t for t in s["types"] if solver.Value(uses_type[(si, t)]))
                for p in ps:
                    by_group[s["group"]][d][p] = {"subject": s["subject"], "roomType": ty, "teacher": s["teacher"]}
                    by_teacher[s["teacher"]][d][p] = {"subject": s["subject"], "roomType": ty, "group": s["group"]}

    def count_holes(grid):
        h = 0
        for d in range(D):
            col = [1 if grid[d][p] else 0 for p in range(P)]
            if 1 in col:
                a, b = col.index(1), len(col) - 1 - col[::-1].index(1)
                h += (b - a + 1) - sum(col[a:b + 1])
        return h

    return {
        "status": "OPTIMAL" if status == cp_model.OPTIMAL else "FEASIBLE",
        "seconds": round(solver.WallTime(), 1),
        "objective": int(solver.ObjectiveValue()),
        "repeats": sum(solver.Value(ex) for ex in repeats_vars),
        "days": days,
        "periodsPerDay": P,
        "periodMinutes": cfg.get("periodMinutes"),
        "startTime": cfg.get("startTime", "06:30"),
        "breakMinutes": cfg.get("breakMinutes", 0),
        "breakAfterPeriods": sorted(breaks),
        "byGroup": {g: {"grid": by_group[g], "holes": count_holes(by_group[g])} for g in groups},
        "byTeacher": {t: {"grid": by_teacher[t]} for t in teachers},
    }
