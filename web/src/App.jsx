import { useEffect } from "react";
import { useStore } from "./store";
import { Inicio, Importar, Rejilla, Materias, Salones, Docentes, Grupos, Cargas, Preferencias, Generar } from "./sections.jsx";
import Timetable from "./Timetable.jsx";
import Tutorial from "./Tutorial.jsx";

const NAV = [
  { group: "", items: [{ id: "inicio", label: "Inicio" }] },
  {
    group: "1 · Datos del colegio",
    items: [
      { id: "importar", label: "Importar Excel" },
      { id: "rejilla", label: "Rejilla y jornada" },
      { id: "salones", label: "Salones" },
      { id: "materias", label: "Materias" },
      { id: "docentes", label: "Docentes" },
      { id: "grupos", label: "Grupos" },
      { id: "cargas", label: "Cargas académicas" },
    ],
  },
  { group: "2 · Reglas", items: [{ id: "preferencias", label: "Preferencias" }] },
  {
    group: "3 · Generar",
    items: [
      { id: "generar", label: "Generar" },
      { id: "horario", label: "Horario" },
    ],
  },
];

const ORDER = ["inicio", "importar", "rejilla", "salones", "materias", "docentes", "grupos", "cargas", "preferencias", "generar", "horario"];
const LABEL = Object.fromEntries(NAV.flatMap((s) => s.items).map((n) => [n.id, n.label]));

const SECTIONS = { inicio: Inicio, importar: Importar, rejilla: Rejilla, materias: Materias, salones: Salones, docentes: Docentes, grupos: Grupos, cargas: Cargas, preferencias: Preferencias, generar: Generar, horario: Timetable };

export default function App() {
  const { view, setView, loadExample, subjects, openTutorial } = useStore();
  useEffect(() => { if (!subjects.length) loadExample(); }, []);
  const Active = SECTIONS[view];
  const idx = ORDER.indexOf(view);
  const next = idx >= 0 && idx < ORDER.length - 1 ? ORDER[idx + 1] : null;

  return (
    <div className="grid min-h-screen md:grid-cols-[260px_1fr]">
      <Tutorial />
      <nav className="border-b border-line bg-white p-4 md:border-b-0 md:border-r">
        <div className="mb-4 flex items-center gap-2.5 px-1 font-bold text-primary-dark">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4M8 14h.01M12 14h.01M16 14h.01" /></svg>
          </span>
          Horarios Escolares
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button className="btn btn-ghost justify-center text-sm" onClick={loadExample}>Cargar ejemplo</button>
          <button className="btn btn-ghost justify-center text-sm" onClick={openTutorial}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.7M12 17h.01" /></svg>
            Guía
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {NAV.map((sec, i) => (
            <div key={i} className={sec.group && i > 0 ? "mt-3 border-t border-line pt-3" : ""}>
              {sec.group && <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{sec.group}</p>}
              {sec.items.map((n) => (
                <button key={n.id} onClick={() => setView(n.id)}
                  className={"w-full rounded-lg px-3 py-2 text-left text-sm transition " + (view === n.id ? "bg-[#e7effc] font-semibold text-primary-dark" : "text-muted hover:bg-[#eef3fb]")}>
                  {n.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </nav>
      <main className="p-5 md:p-8">
        <div className="mx-auto max-w-4xl">
          <Active />
          {next && (
            <div className="mt-5 flex justify-end">
              <button className="btn btn-primary" onClick={() => setView(next)}>
                Siguiente: {LABEL[next]}
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
