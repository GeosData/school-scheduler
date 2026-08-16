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

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function exportImage() {
    const scale = 2, pad = 22, hourW = 52, dayW = 158, rowH = 60, headH = 40, titleH = 66, breakH = 24;
    const W = pad * 2 + hourW + days.length * dayW;
    let gridH = 0;
    for (let p = 0; p < P; p++) { gridH += rowH; if (breaks.has(p) && p < P - 1) gridH += breakH; }
    const H = pad * 2 + titleH + headH + gridH;
    const canvas = document.createElement("canvas");
    canvas.width = W * scale; canvas.height = H * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);

    ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
    ctx.fillStyle = "#16233d"; ctx.font = "700 24px Lexend, Segoe UI, sans-serif";
    ctx.fillText(`Horario · ${current}`, pad, pad + 24);
    ctx.fillStyle = "#51607a"; ctx.font = "13px Lexend, Segoe UI, sans-serif";
    ctx.fillText(`Hora de ${result.periodMinutes} min · vista por ${mode === "group" ? "grupo" : "docente"}`, pad, pad + 46);

    const ox = pad, oy = pad + titleH;
    ctx.textBaseline = "middle"; ctx.textAlign = "center";
    ctx.fillStyle = "#51607a"; ctx.font = "700 13px Lexend, Segoe UI, sans-serif";
    days.forEach((d, di) => ctx.fillText(d, ox + hourW + di * dayW + dayW / 2, oy + headH / 2));

    let y = oy + headH;
    for (let p = 0; p < P; p++) {
      ctx.fillStyle = "#51607a"; ctx.font = "700 13px Lexend, Segoe UI, sans-serif";
      ctx.fillText(`H${p + 1}`, ox + hourW / 2, y + rowH / 2);
      days.forEach((_, di) => {
        const c = data.grid[di][p];
        const cx = ox + hourW + di * dayW;
        if (c) {
          ctx.fillStyle = colorFor(c.subject, subjectKeys);
          roundRect(ctx, cx + 3, y + 4, dayW - 6, rowH - 8, 9); ctx.fill();
          ctx.fillStyle = "#16233d"; ctx.font = "700 14px Lexend, Segoe UI, sans-serif";
          ctx.fillText(c.subject, cx + dayW / 2, y + rowH / 2 - 9, dayW - 16);
          ctx.fillStyle = "#51607a"; ctx.font = "11px Lexend, Segoe UI, sans-serif";
          ctx.fillText(`${c.roomType} · ${mode === "group" ? c.teacher : c.group}`, cx + dayW / 2, y + rowH / 2 + 9, dayW - 16);
        } else {
          ctx.fillStyle = "#cbd5e1"; ctx.font = "14px Lexend, sans-serif";
          ctx.fillText("·", cx + dayW / 2, y + rowH / 2);
        }
      });
      y += rowH;
      if (breaks.has(p) && p < P - 1) {
        ctx.fillStyle = "#15803d"; ctx.font = "700 10px Lexend, Segoe UI, sans-serif";
        ctx.fillText("D E S C A N S O", ox + hourW + (days.length * dayW) / 2, y + breakH / 2);
        y += breakH;
      }
    }
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `horario-${current}.png`;
    a.click();
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
          <button className="btn btn-primary text-sm" onClick={exportImage}>Exportar imagen</button>
          <button className="btn btn-ghost text-sm" onClick={exportCSV}>CSV</button>
        </div>
      </div>

      <div className="mb-4">
        {keys.length > 12 ? (
          <label className="flex items-center gap-2 text-sm text-muted">
            {mode === "group" ? "Grupo" : "Docente"}:
            <select className="input !w-auto min-w-[12rem]" value={current} onChange={(e) => setSel(e.target.value)}>
              {keys.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <span className="text-xs">({keys.length})</span>
          </label>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {keys.map((k) => (
              <button key={k} onClick={() => setSel(k)}
                className={"rounded-lg px-3 py-1.5 text-sm font-semibold transition " + (k === current ? "bg-primary text-white" : "bg-slate-100 text-muted hover:bg-slate-200")}>
                {k}
              </button>
            ))}
          </div>
        )}
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
