import json
import sys
from ortools.sat.python import cp_model

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


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


def solve(cfg):
    days = cfg["days"]
    D, P = len(days), cfg["periodsPerDay"]
    segments = build_segments(P, set(cfg["breakAfterPeriods"]))
    subjects, room_cap, teachers = cfg["subjects"], cfg["roomTypes"], cfg["teachers"]

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
            print(f"INFACTIBLE: la sesion {s['subject']} {s['group']} (largo {s['len']}) no cabe en ningun segmento con la disponibilidad del docente")
            return
        pv = []
        for (d, ps) in s["cand"]:
            v = model.NewBoolVar(f"pl_{si}_{d}_{ps[0]}")
            place[(si, d, ps[0])] = v
            pv.append(v)
        model.AddExactlyOne(pv)

    def occ_terms(si, d, p):
        return [place[(si, dd, ps[0])] for (dd, ps) in sessions[si]["cand"] if dd == d and p in ps]

    groups = cfg["groups"]
    for g in groups:
        gs = [si for si, s in enumerate(sessions) if s["group"] == g]
        for d in range(D):
            for p in range(P):
                terms = [t for si in gs for t in occ_terms(si, d, p)]
                if terms:
                    model.Add(sum(terms) <= 1)

    for tname in teachers:
        ts = [si for si, s in enumerate(sessions) if s["teacher"] == tname]
        for d in range(D):
            for p in range(P):
                terms = [t for si in ts for t in occ_terms(si, d, p)]
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
                    ot = occ_terms(si, d, p)
                    if not ot:
                        continue
                    occ = sum(ot)
                    z = model.NewBoolVar(f"z_{si}_{d}_{p}_{ty}")
                    model.Add(z <= occ)
                    model.Add(z <= uses_type[(si, ty)])
                    model.Add(z >= occ + uses_type[(si, ty)] - 1)
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

    repeats = []
    for g in groups:
        for subjname in subjects:
            ss = [si for si, s in enumerate(sessions) if s["group"] == g and s["subject"] == subjname]
            if len(ss) < 2:
                continue
            for d in range(D):
                dayterms = [place[(si, dd, ps[0])]
                            for si in ss for (dd, ps) in sessions[si]["cand"] if dd == d]
                if not dayterms:
                    continue
                ex = model.NewIntVar(0, len(ss), f"ex_{g}_{subjname}_{d}")
                model.Add(ex >= sum(dayterms) - 1)
                repeats.append(ex)

    holes = []
    for g in groups:
        gs = [si for si, s in enumerate(sessions) if s["group"] == g]
        for d in range(D):
            busy = []
            for p in range(P):
                terms = [t for si in gs for t in occ_terms(si, d, p)]
                bv = model.NewBoolVar(f"busy_{g}_{d}_{p}")
                model.Add(bv == sum(terms)) if terms else model.Add(bv == 0)
                busy.append(bv)
            for p in range(P):
                before = model.NewBoolVar(f"bef_{g}_{d}_{p}")
                after = model.NewBoolVar(f"aft_{g}_{d}_{p}")
                model.AddMaxEquality(before, busy[:p]) if p > 0 else model.Add(before == 0)
                model.AddMaxEquality(after, busy[p + 1:]) if p < P - 1 else model.Add(after == 0)
                hole = model.NewBoolVar(f"hole_{g}_{d}_{p}")
                model.Add(hole <= 1 - busy[p])
                model.Add(hole <= before)
                model.Add(hole <= after)
                model.Add(hole >= before + after - busy[p] - 1)
                holes.append(hole)

    model.Minimize(100 * sum(repeats) + sum(holes))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 20
    solver.parameters.num_search_workers = 8
    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        print("SIN SOLUCION:", solver.StatusName(status))
        return

    grid = {g: [["" for _ in range(P)] for _ in range(D)] for g in groups}
    for si, s in enumerate(sessions):
        for (d, ps) in s["cand"]:
            if solver.Value(place[(si, d, ps[0])]):
                ty = next(t for t in s["types"] if solver.Value(uses_type[(si, t)]))
                for p in ps:
                    grid[s["group"]][d][p] = f"{s['subject'][:4]}·{ty[:3]}"

    breaks = set(cfg["breakAfterPeriods"])
    rep = sum(solver.Value(ex) for ex in repeats)
    print(f"Estado: {solver.StatusName(status)}  |  objetivo: {int(solver.ObjectiveValue())}  |  materias repetidas/dia: {rep}")
    print(f"Hora de {cfg['periodMinutes']} min  |  {P} clases/dia  |  descanso tras periodo {sorted(breaks)}\n")
    for g in groups:
        print(f"===== Grupo {g} =====")
        header = "      " + "".join(f"{d:<12}" for d in days)
        print(header)
        for p in range(P):
            row = f"H{p+1}   " + "".join(f"{grid[g][d][p] or '-':<12}" for d in range(D))
            print(row)
            if p in breaks:
                print("      " + "· · · · descanso · · · ·")
        print()

    for g in groups:
        holes = 0
        for d in range(D):
            col = [1 if grid[g][d][p] else 0 for p in range(P)]
            if 1 in col:
                first, last = col.index(1), len(col) - 1 - col[::-1].index(1)
                holes += (last - first + 1) - sum(col[first:last + 1])
        print(f"Grupo {g}: {holes} huecos (horas libres entre clases)")


if __name__ == "__main__":
    solve(load(sys.argv[1] if len(sys.argv) > 1 else "config.example.json"))
