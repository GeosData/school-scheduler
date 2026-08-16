import json
import sys
from engine import solve

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "config.example.json"
    tl = float(sys.argv[2]) if len(sys.argv) > 2 else 30.0
    with open(path, encoding="utf-8") as f:
        cfg = json.load(f)
    r = solve(cfg, tl)
    if r["status"] == "INFEASIBLE":
        print("SIN SOLUCION:", r.get("message"))
        return
    days, P = r["days"], r["periodsPerDay"]
    breaks = set(r["breakAfterPeriods"])
    print(f"Estado: {r['status']}  |  {r['seconds']}s  |  objetivo {r['objective']}  |  repeticiones {r['repeats']}")
    for g, data in r["byGroup"].items():
        print(f"\n===== Grupo {g}  ({data['holes']} huecos) =====")
        print("      " + "".join(f"{d:<12}" for d in days))
        for p in range(P):
            cells = []
            for d in range(len(days)):
                c = data["grid"][d][p]
                cells.append(f"{c['subject'][:4]}/{c['roomType'][:3]}" if c else "-")
            print(f"H{p+1}   " + "".join(f"{x:<12}" for x in cells))
            if p in breaks:
                print("      " + "· · · descanso · · ·")


if __name__ == "__main__":
    main()
