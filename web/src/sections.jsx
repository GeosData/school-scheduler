import { useState } from "react";
import { useStore } from "./store";

function Head({ title, hint }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}

function Plus() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>;
}

function X({ onClick }) {
  return <button className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-lg text-primary-dark hover:bg-slate-200" onClick={onClick} title="Quitar">×</button>;
}

export function Rejilla() {
  const { grid, setGrid, toggleBreak } = useStore();
  return (
    <section className="card">
      <Head title="Rejilla y jornada" hint="Todo se genera desde acá: nada está fijo en el programa." />
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block"><span className="text-sm text-muted">Minutos por hora</span>
          <input className="input mt-1" type="number" value={grid.periodMinutes} onChange={(e) => setGrid({ periodMinutes: e.target.value })} />
        </label>
        <label className="block"><span className="text-sm text-muted">Horas por día</span>
          <input className="input mt-1" type="number" value={grid.periodsPerDay} onChange={(e) => setGrid({ periodsPerDay: e.target.value })} />
        </label>
        <label className="block"><span className="text-sm text-muted">Días</span>
          <input className="input mt-1" value={grid.days.join(", ")} onChange={(e) => setGrid({ days: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
        </label>
      </div>
      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold text-muted">Descanso después de la hora</p>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: Number(grid.periodsPerDay) }, (_, p) => (
            <button key={p} onClick={() => toggleBreak(p)}
              className={"rounded-lg px-3 py-1.5 text-sm font-semibold transition " + (grid.breakAfterPeriods.includes(p) ? "bg-accent text-white" : "bg-slate-100 text-muted hover:bg-slate-200")}>
              H{p + 1}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">Marca tras cuáles horas hay recreo. Un bloque no se parte por un descanso.</p>
      </div>
    </section>
  );
}

export function Salones() {
  const { rooms, set2 } = useStore();
  const upd = (i, patch) => set2("rooms", rooms.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <section className="card">
      <Head title="Salones" hint="Los tipos de salón que tiene el colegio y cuántos hay de cada uno." />
      <div className="space-y-2">
        {rooms.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className="input" placeholder="Tipo (aula, laboratorio, sistemas, cancha…)" value={r.type} onChange={(e) => upd(i, { type: e.target.value })} />
            <input className="input !w-28" type="number" placeholder="Cantidad" value={r.cap} onChange={(e) => upd(i, { cap: e.target.value })} />
            <X onClick={() => set2("rooms", rooms.filter((_, j) => j !== i))} />
          </div>
        ))}
      </div>
      <button className="btn btn-ghost mt-3 text-sm" onClick={() => set2("rooms", [...rooms, { type: "", cap: 1 }])}><Plus /> Agregar tipo de salón</button>
    </section>
  );
}

export function Materias() {
  const { subjects, rooms, set2 } = useStore();
  const types = rooms.map((r) => r.type).filter(Boolean);
  const upd = (i, patch) => set2("subjects", subjects.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const toggleType = (i, ty) => {
    const s = subjects[i];
    const has = s.allowedRoomTypes.includes(ty);
    upd(i, { allowedRoomTypes: has ? s.allowedRoomTypes.filter((t) => t !== ty) : [...s.allowedRoomTypes, ty] });
  };
  return (
    <section className="card">
      <Head title="Materias" hint="Cada materia puede ir en varios tipos de salón. Marca cuáles van por bloque de horas seguidas." />
      <div className="space-y-3">
        {subjects.map((s, i) => (
          <div key={i} className="rounded-xl border border-line bg-[#fbfdff] p-3">
            <div className="flex items-center gap-2">
              <input className="input" placeholder="Nombre de la materia" value={s.name} onChange={(e) => upd(i, { name: e.target.value })} />
              <label className="flex shrink-0 items-center gap-1.5 text-sm text-muted">Bloque
                <input className="input !w-16" type="number" min="0" value={s.block} onChange={(e) => upd(i, { block: e.target.value })} title="0 = suelta; 2 = de a dos horas" />
              </label>
              <X onClick={() => set2("subjects", subjects.filter((_, j) => j !== i))} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {types.length === 0 && <span className="text-xs text-muted">Agrega salones primero.</span>}
              {types.map((ty) => (
                <button key={ty} onClick={() => toggleType(i, ty)}
                  className={"rounded-full px-2.5 py-1 text-xs font-semibold transition " + (s.allowedRoomTypes.includes(ty) ? "bg-primary text-white" : "bg-slate-100 text-muted hover:bg-slate-200")}>
                  {ty}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-ghost mt-3 text-sm" onClick={() => set2("subjects", [...subjects, { name: "", allowedRoomTypes: [], block: 0 }])}><Plus /> Agregar materia</button>
    </section>
  );
}

export function Docentes() {
  const { teachers, set2 } = useStore();
  const upd = (i, patch) => set2("teachers", teachers.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  return (
    <section className="card">
      <Head title="Docentes" hint="Tope de horario: la última hora en que puede dictar (déjalo vacío si no tiene límite)." />
      <div className="grid grid-cols-[1fr_9rem_9rem_auto] items-center gap-2">
        <span className="th">Nombre</span><span className="th">No después de</span><span className="th">Máx horas/día</span><span></span>
        {teachers.map((t, i) => (
          <div key={i} className="contents">
            <input className="input" placeholder="Nombre" value={t.name} onChange={(e) => upd(i, { name: e.target.value })} />
            <input className="input" type="number" placeholder="—" value={t.notAfterPeriod ?? ""} onChange={(e) => upd(i, { notAfterPeriod: e.target.value })} title="Hora (índice) tras la cual no dicta" />
            <input className="input" type="number" placeholder="—" value={t.maxHoursPerDay ?? ""} onChange={(e) => upd(i, { maxHoursPerDay: e.target.value })} />
            <X onClick={() => set2("teachers", teachers.filter((_, j) => j !== i))} />
          </div>
        ))}
      </div>
      <button className="btn btn-ghost mt-3 text-sm" onClick={() => set2("teachers", [...teachers, { name: "", notAfterPeriod: "", maxHoursPerDay: 6 }])}><Plus /> Agregar docente</button>
    </section>
  );
}

export function Grupos() {
  const { groups, set2 } = useStore();
  return (
    <section className="card">
      <Head title="Grupos" hint="Los cursos del colegio (6-1, 6-2, 11-3…)." />
      <div className="flex flex-wrap gap-2">
        {groups.map((g, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-[#e7effc] py-1 pl-3 pr-1 text-sm font-semibold text-primary-dark">
            <input className="w-16 bg-transparent outline-none" value={g} onChange={(e) => set2("groups", groups.map((x, j) => (j === i ? e.target.value : x)))} />
            <button className="grid h-5 w-5 place-items-center rounded-full text-primary-dark/50 hover:text-danger" onClick={() => set2("groups", groups.filter((_, j) => j !== i))}>×</button>
          </span>
        ))}
        <button className="rounded-full border border-dashed border-primary/40 px-3 py-1 text-sm font-semibold text-primary hover:bg-[#e7effc]" onClick={() => set2("groups", [...groups, ""])}>+ Grupo</button>
      </div>
    </section>
  );
}

export function Cargas() {
  const { tasks, teachers, subjects, groups, set2 } = useStore();
  const upd = (i, patch) => set2("tasks", tasks.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  const Sel = ({ value, onChange, options, ph }) => (
    <select className="input" value={value} onChange={onChange}><option value="">{ph}</option>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select>
  );
  return (
    <section className="card">
      <Head title="Cargas académicas" hint="Quién dicta qué materia a qué grupo, y cuántas horas por semana." />
      <div className="grid grid-cols-[1fr_1fr_1fr_6rem_auto] items-center gap-2">
        <span className="th">Docente</span><span className="th">Materia</span><span className="th">Grupo</span><span className="th">Horas/sem</span><span></span>
        {tasks.map((t, i) => (
          <div key={i} className="contents">
            <Sel value={t.teacher} onChange={(e) => upd(i, { teacher: e.target.value })} options={teachers.map((x) => x.name).filter(Boolean)} ph="Docente" />
            <Sel value={t.subject} onChange={(e) => upd(i, { subject: e.target.value })} options={subjects.map((x) => x.name).filter(Boolean)} ph="Materia" />
            <Sel value={t.group} onChange={(e) => upd(i, { group: e.target.value })} options={groups.filter(Boolean)} ph="Grupo" />
            <input className="input" type="number" value={t.weekly} onChange={(e) => upd(i, { weekly: e.target.value })} />
            <X onClick={() => set2("tasks", tasks.filter((_, j) => j !== i))} />
          </div>
        ))}
      </div>
      <button className="btn btn-ghost mt-3 text-sm" onClick={() => set2("tasks", [...tasks, { teacher: "", subject: "", group: "", weekly: 1 }])}><Plus /> Agregar carga</button>
      <p className="mt-3 text-sm text-muted">{tasks.length} cargas.</p>
    </section>
  );
}

export function Importar() {
  const { set2, setView } = useStore();
  const [msg, setMsg] = useState("");

  async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const add = (name, rows, cols) => {
      const ws = XLSX.utils.aoa_to_sheet(rows);
      if (cols) ws["!cols"] = cols;
      XLSX.utils.book_append_sheet(wb, ws, name);
    };
    add("Docentes", [["Nombre", "No despues de (hora, opcional)", "Max horas/dia"], ["Prof-Mate", "", "6"], ["Prof-Sociales", "4", "6"]], [{ wch: 18 }, { wch: 26 }, { wch: 14 }]);
    add("Materias", [["Materia", "Tipos de salon (separados por coma)", "Bloque (0=suelta, 2=de a dos)"], ["Matematicas", "aula", "2"], ["Quimica", "aula, laboratorio", "2"], ["Tecnologia", "aula, sistemas", "0"]], [{ wch: 16 }, { wch: 34 }, { wch: 28 }]);
    add("Salones", [["Tipo", "Cantidad"], ["aula", "18"], ["laboratorio", "2"], ["sistemas", "2"], ["cancha", "2"]], [{ wch: 16 }, { wch: 10 }]);
    add("Grupos", [["Grupo"], ["6-1"], ["6-2"], ["11-3"]], [{ wch: 10 }]);
    add("Cargas", [["Docente", "Materia", "Grupo", "Horas/semana"], ["Prof-Mate", "Matematicas", "6-1", "5"], ["Prof-Sociales", "Sociales", "6-1", "3"]], [{ wch: 18 }, { wch: 16 }, { wch: 10 }, { wch: 14 }]);
    XLSX.writeFile(wb, "plantilla-horarios.xlsx");
  }

  async function importFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMsg("Leyendo…");
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = (name) => wb.Sheets[Object.keys(wb.Sheets).find((k) => k.toLowerCase().startsWith(name.slice(0, 4).toLowerCase()))];
      const rowsOf = (name) => {
        const ws = sheet(name);
        if (!ws) return [];
        const r = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
        return r.slice(1).map((row) => row.map((c) => (c == null ? "" : String(c).trim())));
      };
      const D = rowsOf("Docentes").filter((r) => r[0]).map((r) => ({ name: r[0], notAfterPeriod: r[1] ?? "", maxHoursPerDay: r[2] || 6 }));
      const M = rowsOf("Materias").filter((r) => r[0]).map((r) => ({ name: r[0], allowedRoomTypes: (r[1] || "").split(/[,;]+/).map((x) => x.trim()).filter(Boolean), block: Number(r[2]) || 0 }));
      const S = rowsOf("Salones").filter((r) => r[0]).map((r) => ({ type: r[0], cap: Number(r[1]) || 1 }));
      const G = rowsOf("Grupos").filter((r) => r[0]).map((r) => r[0]);
      const C = rowsOf("Cargas").filter((r) => r[0]).map((r) => ({ teacher: r[0], subject: r[1], group: r[2], weekly: Number(r[3]) || 0 }));
      const applied = [];
      if (D.length) { set2("teachers", D); applied.push(`${D.length} docentes`); }
      if (M.length) { set2("subjects", M); applied.push(`${M.length} materias`); }
      if (S.length) { set2("rooms", S); applied.push(`${S.length} salones`); }
      if (G.length) { set2("groups", G); applied.push(`${G.length} grupos`); }
      if (C.length) { set2("tasks", C); applied.push(`${C.length} cargas`); }
      setMsg(applied.length ? `Importado: ${applied.join(", ")}. Revisa las secciones y pulsa Generar.` : "No se encontraron hojas conocidas (Docentes, Materias, Salones, Grupos, Cargas).");
    } catch (err) {
      setMsg("No se pudo leer el archivo. ¿Es un Excel válido?");
    }
  }

  return (
    <section className="card">
      <Head title="Importar desde Excel" hint="Descarga la plantilla, llénala con los datos del colegio y súbela. Cada hoja llena una sección." />
      <div className="flex flex-wrap items-center gap-2">
        <label className="btn btn-primary cursor-pointer">
          Subir Excel
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={importFile} />
        </label>
        <button className="btn btn-ghost" onClick={downloadTemplate}>Descargar plantilla .xlsx</button>
      </div>
      {msg && <p className="mt-4 rounded-xl border border-line bg-[#f4fbf6] p-3 text-sm">{msg}</p>}
      <div className="mt-5 text-sm text-muted">
        <p className="mb-1 font-semibold">Hojas del libro:</p>
        <ul className="list-disc pl-5">
          <li><b>Docentes</b>: nombre, hora tope (opcional), máx horas/día.</li>
          <li><b>Materias</b>: nombre, tipos de salón (coma), bloque (0 o tamaño).</li>
          <li><b>Salones</b>: tipo, cantidad.</li>
          <li><b>Grupos</b>: un grupo por fila.</li>
          <li><b>Cargas</b>: docente, materia, grupo, horas/semana.</li>
        </ul>
      </div>
    </section>
  );
}

export function Generar() {
  const { solve, solving, error, result, groups, tasks } = useStore();
  return (
    <section className="card">
      <Head title="Generar horario" hint="El motor arma el horario respetando todas las restricciones y minimizando huecos." />
      <p className="mb-4 text-sm text-muted">{groups.length} grupos · {tasks.length} cargas cargadas.</p>
      <button className="btn btn-accent" onClick={() => solve(30)} disabled={solving}>{solving ? "Generando…" : "Generar horario"}</button>
      {error && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm">
          <b className="text-danger">No se pudo generar.</b> {error}
        </div>
      )}
      {result && !error && (
        <div className="mt-4 rounded-xl border border-line bg-[#f4fbf6] p-4 text-sm">
          <b className="text-accent-dark">{result.status}</b> en {result.seconds}s · {result.repeats} materias repetidas/día · abre la pestaña <b>Horario</b>.
        </div>
      )}
    </section>
  );
}
