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

function Tip({ text }) {
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <span className="grid h-4 w-4 cursor-help place-items-center rounded-full bg-slate-200 text-[10px] font-bold text-muted">?</span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 hidden w-56 -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-xs font-normal normal-case leading-snug text-white shadow-lg group-hover:block">{text}</span>
    </span>
  );
}

export function Inicio() {
  const { solve, setView, solving, subjects, error } = useStore();
  const Step = ({ n, title, children }) => (
    <div className="flex gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">{n}</span>
      <div><div className="font-semibold text-ink">{title}</div><div className="text-sm text-muted">{children}</div></div>
    </div>
  );
  return (
    <section className="card">
      <h2 className="text-2xl font-bold">Genera el horario de tu colegio</h2>
      <p className="mt-1 text-muted">Sin choques y sin pelear con Excel. Todo corre en tu computador, sin internet.</p>
      <div className="my-6 space-y-4">
        <Step n={1} title="Carga los datos del colegio">Docentes, materias, salones, grupos y las cargas académicas. Desde un Excel o a mano, en las secciones del menú.</Step>
        <Step n={2} title="Ajusta las reglas (opcional)">Descansos, materias por bloque y preferencias, como docentes sin huecos o materias pesadas temprano.</Step>
        <Step n={3} title="Genera y revisa">El horario sale solo, sin choques. Lo ves por grupo o por docente y lo exportas.</Step>
      </div>
      <div className="rounded-xl border border-line bg-[#f4fbf6] p-4">
        <p className="mb-3 text-sm text-muted">Ya cargamos un <b>colegio de ejemplo</b> para que veas cómo queda. Genéralo con un clic, y luego reemplázalo con los datos de tu colegio.</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-accent" disabled={solving || !subjects.length} onClick={() => solve(10)}>{solving ? "Armando el horario…" : "Ver un horario de ejemplo"}</button>
          <button className="btn btn-ghost" onClick={() => setView("importar")}>Cargar mis datos (Excel)</button>
        </div>
        {solving && <p className="mt-3 flex items-center gap-2 text-sm text-muted"><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-primary" /> Armando el horario sin choques, unos segundos…</p>}
        {error && <p className="mt-3 whitespace-pre-line rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-ink">{error}</p>}
        {!subjects.length && !error && <p className="mt-3 text-sm text-muted">Cargando el colegio de ejemplo…</p>}
      </div>
    </section>
  );
}

export function Rejilla() {
  const { grid, setGrid, toggleBreak } = useStore();
  return (
    <section className="card">
      <Head title="Jornada y horas" hint="La estructura del día: a qué hora empieza, cuánto dura cada hora, cuántas al día y los descansos. Todo el horario se calcula desde acá." />
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block"><span className="text-sm text-muted">Hora de inicio<Tip text="A qué hora empieza la jornada. Con esto y la duración de la hora se calculan los horarios reales (7:00–7:55…)." /></span>
          <input className="input mt-1" type="time" value={grid.startTime} onChange={(e) => setGrid({ startTime: e.target.value })} />
        </label>
        <label className="block"><span className="text-sm text-muted">Minutos por hora<Tip text="Cuánto dura una hora de clase en tu colegio (45, 50, 55, 60…). De aquí sale la rejilla." /></span>
          <input className="input mt-1" type="number" value={grid.periodMinutes} onChange={(e) => setGrid({ periodMinutes: e.target.value })} />
        </label>
        <label className="block"><span className="text-sm text-muted">Minutos de descanso<Tip text="Cuánto dura cada recreo. Se usa para calcular las horas reales de las clases que van después del descanso." /></span>
          <input className="input mt-1" type="number" value={grid.breakMinutes} onChange={(e) => setGrid({ breakMinutes: e.target.value })} />
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
        <p className="mt-2 text-xs text-muted">Marca tras cuáles horas hay recreo. Una clase de horas seguidas no se parte por un descanso.</p>
      </div>
      <div className="mt-5 flex items-center gap-3 rounded-xl border border-line bg-[#fbfdff] p-3">
        <button onClick={() => setGrid({ allowFreePeriods: !grid.allowFreePeriods })}
          className={"relative h-6 w-11 shrink-0 rounded-full transition " + (grid.allowFreePeriods ? "bg-accent" : "bg-slate-300")}>
          <span className={"absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all " + (grid.allowFreePeriods ? "left-[22px]" : "left-0.5")} />
        </button>
        <div className="flex-1">
          <div className="font-semibold text-ink">Permitir horas libres en los grupos</div>
          <div className="text-xs text-muted">Si lo apagas, cada grupo debe tener todas sus horas ocupadas. La jornada tiene que cuadrar con la carga (horas/día × días = horas semanales del grupo); si no cuadra, no se podrá generar.</div>
        </div>
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
              <label className="flex shrink-0 items-center gap-1.5 text-sm text-muted">Horas seguidas<Tip text="0 = la clase va suelta. 2 = va de a dos horas juntas (típico en química, física, matemáticas). No se parte por un descanso." />
                <input className="input !w-16" type="number" min="0" value={s.block} onChange={(e) => upd(i, { block: e.target.value })} />
              </label>
              <button className={"shrink-0 rounded-full px-2.5 py-1.5 text-xs font-semibold transition " + (s.heavy ? "bg-primary text-white" : "bg-slate-100 text-muted hover:bg-slate-200")} onClick={() => upd(i, { heavy: !s.heavy })} title="Materia exigente: se prefiere ponerla en las primeras horas">Exigente</button>
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
        <span className="th">Nombre</span><span className="th">No después de<Tip text="La última hora en que el docente puede dictar. Ej: 4 = no dicta después de la 4ª hora. Déjalo vacío si no tiene límite." /></span><span className="th">Máx horas/día</span><span></span>
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
      {(!teachers.length || !subjects.length || !groups.length) && (
        <p className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-ink">Para crear cargas, primero agrega <b>docentes</b>, <b>materias</b> y <b>grupos</b> en sus secciones (o usa Importar Excel).</p>
      )}
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
  const { set2, setView, subjects, rooms, teachers, groups, tasks } = useStore();
  const [msg, setMsg] = useState("");

  async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const add = (name, header, rows, cols) => {
      const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
      if (cols) ws["!cols"] = cols;
      XLSX.utils.book_append_sheet(wb, ws, name);
    };
    add("Docentes", ["Nombre", "No despues de (hora, opcional)", "Max horas/dia"],
      teachers.map((t) => [t.name, t.notAfterPeriod ?? "", t.maxHoursPerDay ?? 6]), [{ wch: 20 }, { wch: 26 }, { wch: 14 }]);
    add("Materias", ["Materia", "Tipos de salon (separados por coma)", "Bloque (0=suelta, 2=de a dos)"],
      subjects.map((s) => [s.name, (s.allowedRoomTypes || []).join(", "), s.block || 0]), [{ wch: 20 }, { wch: 34 }, { wch: 28 }]);
    add("Salones", ["Tipo", "Cantidad"], rooms.map((r) => [r.type, r.cap]), [{ wch: 16 }, { wch: 10 }]);
    add("Grupos", ["Grupo"], groups.map((g) => [g]), [{ wch: 10 }]);
    add("Cargas", ["Docente", "Materia", "Grupo", "Horas/semana"],
      tasks.map((t) => [t.teacher, t.subject, t.group, t.weekly]), [{ wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 14 }]);
    XLSX.writeFile(wb, "ejemplo-horarios.xlsx");
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
      <Head title="Importar desde Excel" hint="Descarga el archivo base (viene lleno con el colegio de ejemplo), reemplaza los datos con los de tu colegio y súbelo. Cada hoja llena una sección." />
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn btn-primary" onClick={downloadTemplate}>Descargar archivo base (.xlsx)</button>
        <label className="btn btn-ghost cursor-pointer">
          Subir mi Excel
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={importFile} />
        </label>
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

const RULES = [
  { id: "noRepeatSameDay", label: "No repetir materia el mismo día", hint: "Evita que un grupo vea la misma materia dos veces en un día." },
  { id: "groupGaps", label: "Grupos sin huecos", hint: "Clases corridas, sin horas libres entre medio para los estudiantes." },
  { id: "teacherGaps", label: "Docentes sin huecos", hint: "Minimiza las horas libres de los docentes entre clases." },
  { id: "heavyEarly", label: "Materias exigentes temprano", hint: "Prefiere las materias marcadas como 'Exigente' en las primeras horas del día." },
];
const PRIOS = { Baja: 2, Media: 10, Alta: 50 };
const prioOf = (w) => (w >= 30 ? "Alta" : w >= 6 ? "Media" : "Baja");

export function Preferencias() {
  const { rules, setRule } = useStore();
  return (
    <section className="card">
      <Head title="Preferencias" hint="El colegio elige qué reglas aplicar y qué tan importante es cada una. No son obligatorias; el motor las trata de cumplir sin romper las reglas duras (choques, disponibilidad, bloques)." />
      <div className="space-y-2">
        {RULES.map((r) => {
          const v = rules[r.id];
          return (
            <div key={r.id} className="flex items-center gap-3 rounded-xl border border-line bg-[#fbfdff] p-3">
              <button onClick={() => setRule(r.id, { on: !v.on })}
                className={"relative h-6 w-11 shrink-0 rounded-full transition " + (v.on ? "bg-accent" : "bg-slate-300")}>
                <span className={"absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all " + (v.on ? "left-[22px]" : "left-0.5")} />
              </button>
              <div className="flex-1">
                <div className="font-semibold text-ink">{r.label}</div>
                <div className="text-xs text-muted">{r.hint}</div>
              </div>
              <label className="flex shrink-0 items-center gap-1.5 text-sm text-muted">Prioridad<Tip text="Qué tanto se esfuerza el motor por cumplir esta regla. Alta: la respeta casi siempre, aunque el horario quede menos cómodo en otras cosas. Media: la balancea. Baja: la cumple solo si sobra espacio. Nunca rompe las reglas duras (choques, topes, bloques)." />
                <select className="input !w-28" value={prioOf(v.weight)} disabled={!v.on} onChange={(e) => setRule(r.id, { weight: PRIOS[e.target.value] })}>
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </select>
              </label>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function Generar() {
  const { solve, solving, error, result, subjects, rooms, teachers, groups, tasks } = useStore();
  const checks = [
    { label: "Salones", n: rooms.length },
    { label: "Materias", n: subjects.length },
    { label: "Docentes", n: teachers.length },
    { label: "Grupos", n: groups.length },
    { label: "Cargas académicas", n: tasks.length },
  ];
  const ready = checks.every((c) => c.n > 0);
  return (
    <section className="card">
      <Head title="Generar horario" hint="El motor arma el horario respetando todas las restricciones y minimizando huecos." />
      <div className="mb-4 rounded-xl border border-line bg-[#fbfdff] p-4">
        <p className="mb-2 text-sm font-semibold text-muted">Antes de generar necesitas:</p>
        <div className="space-y-1.5">
          {checks.map((c) => (
            <div key={c.label} className="flex items-center gap-2 text-sm">
              <span className={"grid h-5 w-5 place-items-center rounded-full text-xs font-bold " + (c.n > 0 ? "bg-accent text-white" : "bg-slate-200 text-muted")}>{c.n > 0 ? "✓" : "!"}</span>
              <span className={c.n > 0 ? "text-ink" : "text-muted"}>{c.label}: <b>{c.n}</b></span>
            </div>
          ))}
        </div>
      </div>
      <button className="btn btn-accent" onClick={() => solve(30)} disabled={solving || !ready}>{solving ? "Armando el horario…" : "Generar horario"}</button>
      {solving && <p className="mt-3 flex items-center gap-2 text-sm text-muted"><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-primary" /> Armando el horario sin choques, esto puede tomar unos segundos…</p>}
      {!ready && <p className="mt-2 text-sm text-muted">Faltan datos. Complétalos en las secciones del menú, o usa Importar Excel.</p>}
      {error && (
        <div className="mt-4 whitespace-pre-line rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-ink">{error}</div>
      )}
      {result && !error && (
        <div className="mt-4 rounded-xl border border-line bg-[#f4fbf6] p-4 text-sm">
          <b className="text-accent-dark">{{ OPTIMAL: "Horario óptimo", FEASIBLE: "Horario válido (se puede afinar)" }[result.status] || result.status}</b> en {result.seconds}s · {result.repeats} materias repetidas/día · abre la pestaña <b>Horario</b>.
        </div>
      )}
    </section>
  );
}
