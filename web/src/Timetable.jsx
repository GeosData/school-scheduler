import { Fragment, useEffect, useState } from "react";
import { useStore } from "./store";

const PALETTE = ["#dbe7fb", "#d7efe0", "#fbe6d3", "#eddcfb", "#d4eef6", "#fbeecf", "#f8d9e6", "#e2efcf"];
function colorFor(name, keys) {
  const i = keys.indexOf(name);
  return PALETTE[(i < 0 ? 0 : i) % PALETTE.length];
}

const STATUS = { OPTIMAL: "Óptimo", FEASIBLE: "Válido (se puede mejorar)" };
function fmt(mins) { const h = Math.floor(mins / 60), m = mins % 60; return `${h}:${String(m).padStart(2, "0")}`; }
function computeTimes(result) {
  const [sh, sm] = (result.startTime || "07:00").split(":").map(Number);
  let t = sh * 60 + sm;
  const M = Number(result.periodMinutes) || 60;
  const B = Number(result.breakMinutes) || 0;
  const breaks = new Set(result.breakAfterPeriods);
  const out = [];
  for (let p = 0; p < result.periodsPerDay; p++) {
    out.push([fmt(t), fmt(t + M)]);
    t += M + (breaks.has(p) ? B : 0);
  }
  return out;
}

export default function Timetable() {
  const { result, setView, moveClass } = useStore();
  const [mode, setMode] = useState("group");
  const [sel, setSel] = useState(null);
  const [picked, setPicked] = useState(null);

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
  const times = computeTimes(result);
  const source = mode === "group" ? result.byGroup : result.byTeacher;
  const keys = Object.keys(source);
  const current = sel && source[sel] ? sel : keys[0];
  const data = source[current];
  const subjectKeys = [...new Set(Object.values(result.byGroup).flatMap((g) => g.grid.flat().filter(Boolean).map((c) => c.subject)))];
  const metaOf = (c) => {
    const who = mode === "group" ? c.teacher : c.group;
    return c.roomType && c.roomType !== "aula" ? `${c.roomType} · ${who}` : who;
  };
  const editable = mode === "group";
  useEffect(() => { setPicked(null); }, [current, mode]);
  function onCell(d, p, c) {
    if (!editable) return;
    if (c) setPicked((cur) => (cur && cur.d === d && cur.p === p ? null : { d, p }));
    else if (picked) { moveClass(current, picked.d, picked.p, d, p); setPicked(null); }
  }

  function exportCSV() {
    const rows = [["Hora", ...days]];
    for (let p = 0; p < P; p++) {
      rows.push([`H${p + 1} (${times[p][0]}-${times[p][1]})`, ...days.map((_, d) => {
        const c = data.grid[d][p];
        return c ? `${c.subject} · ${metaOf(c)}` : "";
      })]);
    }
    const csv = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `horario-${current}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportImage() {
    const scale = 2, pad = 24, hourW = 92, dayW = 172, rowH = 64, headH = 44, titleH = 68, breakH = 28;
    const cols = days.length;
    const rowsLayout = [];
    for (let p = 0; p < P; p++) { rowsLayout.push({ type: "row", p }); if (breaks.has(p) && p < P - 1) rowsLayout.push({ type: "break" }); }
    const gridW = hourW + cols * dayW;
    const gridH = rowsLayout.reduce((a, r) => a + (r.type === "row" ? rowH : breakH), 0);
    const W = pad * 2 + gridW;
    const H = pad * 2 + titleH + headH + gridH;
    const canvas = document.createElement("canvas");
    canvas.width = W * scale; canvas.height = H * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);

    ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
    ctx.fillStyle = "#16233d"; ctx.font = "700 25px Lexend, Segoe UI, sans-serif";
    ctx.fillText(`Horario · ${current}`, pad, pad + 25);
    ctx.fillStyle = "#51607a"; ctx.font = "13px Lexend, Segoe UI, sans-serif";
    ctx.fillText(`Hora de ${result.periodMinutes} min · inicia ${result.startTime} · vista por ${mode === "group" ? "grupo" : "docente"}`, pad, pad + 47);

    const gx = pad, gy = pad + titleH;
    ctx.fillStyle = "#eef2f7"; ctx.fillRect(gx, gy, gridW, headH);
    ctx.textBaseline = "middle"; ctx.textAlign = "center";
    ctx.fillStyle = "#51607a"; ctx.font = "700 13px Lexend, Segoe UI, sans-serif";
    ctx.fillText("Hora", gx + hourW / 2, gy + headH / 2);
    ctx.fillStyle = "#16233d"; ctx.font = "700 15px Lexend, Segoe UI, sans-serif";
    days.forEach((d, di) => ctx.fillText(d, gx + hourW + di * dayW + dayW / 2, gy + headH / 2));

    let y = gy + headH;
    rowsLayout.forEach((r) => {
      if (r.type === "break") {
        ctx.fillStyle = "#eef2f7"; ctx.fillRect(gx, y, gridW, breakH);
        ctx.fillStyle = "#15803d"; ctx.font = "700 11px Lexend, Segoe UI, sans-serif";
        ctx.fillText("D E S C A N S O", gx + gridW / 2, y + breakH / 2);
        y += breakH; return;
      }
      const p = r.p;
      ctx.fillStyle = "#f6f8fb"; ctx.fillRect(gx, y, hourW, rowH);
      ctx.fillStyle = "#16233d"; ctx.font = "700 15px Lexend, Segoe UI, sans-serif";
      ctx.fillText(`H${p + 1}`, gx + hourW / 2, y + rowH / 2 - 10);
      ctx.fillStyle = "#51607a"; ctx.font = "12px Lexend, Segoe UI, sans-serif";
      ctx.fillText(`${times[p][0]}–${times[p][1]}`, gx + hourW / 2, y + rowH / 2 + 10);
      days.forEach((_, di) => {
        const cx = gx + hourW + di * dayW;
        const c = data.grid[di][p];
        if (c) {
          ctx.fillStyle = colorFor(c.subject, subjectKeys);
          ctx.fillRect(cx, y, dayW, rowH);
          ctx.fillStyle = "#16233d"; ctx.font = "700 15px Lexend, Segoe UI, sans-serif";
          ctx.fillText(c.subject, cx + dayW / 2, y + rowH / 2 - 9, dayW - 16);
          ctx.fillStyle = "#3f4b60"; ctx.font = "12px Lexend, Segoe UI, sans-serif";
          ctx.fillText(metaOf(c), cx + dayW / 2, y + rowH / 2 + 10, dayW - 16);
        }
      });
      y += rowH;
    });

    ctx.strokeStyle = "#9aa8bd"; ctx.lineWidth = 1;
    const xs = [gx, gx + hourW];
    for (let i = 1; i <= cols; i++) xs.push(gx + hourW + i * dayW);
    ctx.beginPath();
    xs.forEach((xx) => { ctx.moveTo(Math.round(xx) + 0.5, gy); ctx.lineTo(Math.round(xx) + 0.5, y); });
    let hy = gy;
    const hlines = [gy, gy + headH];
    rowsLayout.forEach((rr) => { hy += rr.type === "row" ? rowH : breakH; });
    let acc = gy + headH;
    ctx.moveTo(gx, Math.round(gy) + 0.5); ctx.lineTo(gx + gridW, Math.round(gy) + 0.5);
    ctx.moveTo(gx, Math.round(gy + headH) + 0.5); ctx.lineTo(gx + gridW, Math.round(gy + headH) + 0.5);
    rowsLayout.forEach((rr) => { acc += rr.type === "row" ? rowH : breakH; ctx.moveTo(gx, Math.round(acc) + 0.5); ctx.lineTo(gx + gridW, Math.round(acc) + 0.5); });
    ctx.stroke();

    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `horario-${current}.png`;
    a.click();
  }

  return (
    <section className="card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Horario · {current}</h2>
          <p className="text-sm text-muted">{STATUS[result.status] || result.status} · generado en {result.seconds}s · hora de {result.periodMinutes} min{mode === "group" && data.holes != null ? ` · ${data.holes} huecos` : ""}</p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <div className="flex rounded-full bg-slate-100 p-1 text-sm font-semibold">
            <button className={"rounded-full px-3 py-1 " + (mode === "group" ? "bg-white text-primary-dark shadow" : "text-muted")} onClick={() => { setMode("group"); setSel(null); }}>Por grupo</button>
            <button className={"rounded-full px-3 py-1 " + (mode === "teacher" ? "bg-white text-primary-dark shadow" : "text-muted")} onClick={() => { setMode("teacher"); setSel(null); }}>Por docente</button>
          </div>
          <button className="btn btn-primary text-sm" onClick={exportImage}>Exportar imagen</button>
          <button className="btn btn-ghost text-sm" onClick={() => window.print()}>Imprimir</button>
          <button className="btn btn-ghost text-sm" onClick={exportCSV}>CSV</button>
        </div>
      </div>

      <div className="mb-4 no-print">
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

      {editable && (
        <p className="mb-2 text-xs text-muted no-print">Ajuste manual: toca una clase y luego un espacio libre para moverla. {picked ? "Ahora toca dónde la quieres poner (o la misma clase para soltar)." : ""}</p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-slate-300 bg-slate-100 px-2 py-2 text-xs font-semibold text-muted">Hora</th>
              {days.map((d) => <th key={d} className="border border-slate-300 bg-slate-100 px-2 py-2 text-center text-sm font-bold text-ink">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: P }, (_, p) => (
              <Fragment key={p}>
                <tr>
                  <td className="border border-slate-300 bg-slate-50 px-2 py-2 text-center">
                    <div className="font-bold text-ink">H{p + 1}</div>
                    <div className="text-[11px] text-muted">{times[p][0]}–{times[p][1]}</div>
                  </td>
                  {days.map((_, d) => {
                    const c = data.grid[d][p];
                    const isPicked = editable && picked && picked.d === d && picked.p === p;
                    return (
                      <td key={d} onClick={editable ? () => onCell(d, p, c) : undefined}
                        className={"border border-slate-300 p-0 align-middle " + (editable ? "cursor-pointer " : "") + (isPicked ? "ring-2 ring-inset ring-primary " : (editable && picked && !c ? "hover:bg-[#eef4ff] " : ""))}
                        style={c ? { background: colorFor(c.subject, subjectKeys) } : {}}>
                        {c ? (
                          <div className="px-2 py-2 text-center">
                            <div className="font-bold text-ink">{c.subject}</div>
                            <div className="text-[11px] text-slate-600">{metaOf(c)}</div>
                          </div>
                        ) : <div className="py-4 text-center text-slate-300">{editable && picked ? "＋" : "·"}</div>}
                      </td>
                    );
                  })}
                </tr>
                {breaks.has(p) && (
                  <tr><td colSpan={days.length + 1} className="border border-slate-300 bg-slate-100 py-1 text-center text-[11px] font-bold uppercase tracking-wide text-accent-dark">Descanso</td></tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
