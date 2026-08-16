import { Fragment, useState } from "react";
import { useStore } from "./store";

const PALETTE = ["#e7effc", "#e7f6ee", "#fdf1e7", "#f3e7fc", "#e7f8fb", "#fcf3e7", "#fbe7ef", "#eef7e7"];
function colorFor(name, keys) {
  const i = keys.indexOf(name);
  return PALETTE[(i < 0 ? 0 : i) % PALETTE.length];
}

export default function Timetable() {
  const { result, setView } = useStore();
  const [mode, setMode] = useState("group");
  const [sel, setSel] = useState(null);

  if (!result) {
    return (
      <section className="card text-center text-muted">
        <p>Todavía no hay horario. Ve a <button className="font-semibold text-primary underline" onClick={() => setView("generar")}>Generar</button>.</p>
      </section>
    );
  }

  const days = result.days;
  const P = result.periodsPerDay;
  const breaks = new Set(result.breakAfterPeriods);
  const source = mode === "group" ? result.byGroup : result.byTeacher;
  const keys = Object.keys(source);
  const current = sel && source[sel] ? sel : keys[0];
  const data = source[current];
  const subjectKeys = [...new Set(Object.values(result.byGroup).flatMap((g) => g.grid.flat().filter(Boolean).map((c) => c.subject)))];

  function exportCSV() {
    const rows = [["Hora", ...days]];
    for (let p = 0; p < P; p++) {
      rows.push([`H${p + 1}`, ...days.map((_, d) => {
        const c = data.grid[d][p];
        return c ? `${c.subject} (${c.roomType})${mode === "group" ? " · " + c.teacher : " · " + c.group}` : "";
      })]);
    }
    const csv = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `horario-${current}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <section className="card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Horario</h2>
          <p className="text-sm text-muted">{result.status} en {result.seconds}s · hora de {result.periodMinutes} min{mode === "group" && data.holes != null ? ` · ${data.holes} huecos` : ""}</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-full bg-slate-100 p-1 text-sm font-semibold">
            <button className={"rounded-full px-3 py-1 " + (mode === "group" ? "bg-white text-primary-dark shadow" : "text-muted")} onClick={() => { setMode("group"); setSel(null); }}>Por grupo</button>
            <button className={"rounded-full px-3 py-1 " + (mode === "teacher" ? "bg-white text-primary-dark shadow" : "text-muted")} onClick={() => { setMode("teacher"); setSel(null); }}>Por docente</button>
          </div>
          <button className="btn btn-ghost text-sm" onClick={exportCSV}>Exportar CSV</button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {keys.map((k) => (
          <button key={k} onClick={() => setSel(k)}
            className={"rounded-lg px-3 py-1.5 text-sm font-semibold transition " + (k === current ? "bg-primary text-white" : "bg-slate-100 text-muted hover:bg-slate-200")}>
            {k}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="th w-14"></th>
              {days.map((d) => <th key={d} className="th text-center">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: P }, (_, p) => (
              <Fragment key={p}>
                <tr>
                  <td className="td font-semibold text-muted">H{p + 1}</td>
                  {days.map((_, d) => {
                    const c = data.grid[d][p];
                    return (
                      <td key={d} className="p-1">
                        {c ? (
                          <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: colorFor(c.subject, subjectKeys) }}>
                            <div className="font-semibold text-ink">{c.subject}</div>
                            <div className="text-[11px] text-muted">{c.roomType}{mode === "group" ? ` · ${c.teacher}` : ` · ${c.group}`}</div>
                          </div>
                        ) : <div className="py-1.5 text-center text-line">·</div>}
                      </td>
                    );
                  })}
                </tr>
                {breaks.has(p) && (
                  <tr><td></td><td colSpan={days.length} className="py-0.5 text-center text-[11px] font-semibold uppercase tracking-wide text-accent-dark">descanso</td></tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
