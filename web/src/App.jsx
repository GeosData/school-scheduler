import { useEffect } from "react";
import { useStore } from "./store";
import { Importar, Rejilla, Materias, Salones, Docentes, Grupos, Cargas, Generar } from "./sections.jsx";
import Timetable from "./Timetable.jsx";

const NAV = [
  { id: "importar", label: "Importar Excel" },
  { id: "rejilla", label: "Rejilla y jornada" },
  { id: "materias", label: "Materias" },
  { id: "salones", label: "Salones" },
  { id: "docentes", label: "Docentes" },
  { id: "grupos", label: "Grupos" },
  { id: "cargas", label: "Cargas académicas" },
  { id: "generar", label: "Generar" },
  { id: "horario", label: "Horario" },
];

const SECTIONS = { importar: Importar, rejilla: Rejilla, materias: Materias, salones: Salones, docentes: Docentes, grupos: Grupos, cargas: Cargas, generar: Generar, horario: Timetable };

export default function App() {
  const { view, setView, loadExample, subjects } = useStore();
  useEffect(() => { if (!subjects.length) loadExample(); }, []);
  const Active = SECTIONS[view];

  return (
    <div className="grid min-h-screen md:grid-cols-[260px_1fr]">
      <nav className="border-b border-line bg-white p-4 md:border-b-0 md:border-r">
        <div className="mb-4 flex items-center gap-2.5 px-1 font-bold text-primary-dark">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4M8 14h.01M12 14h.01M16 14h.01" /></svg>
          </span>
          Horarios Escolares
        </div>
        <button className="btn btn-ghost mb-4 w-full justify-center text-sm" onClick={loadExample}>Cargar ejemplo</button>
        <div className="flex flex-col gap-1">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => setView(n.id)}
              className={"rounded-lg px-3 py-2 text-left text-sm transition " + (view === n.id ? "bg-[#e7effc] font-semibold text-primary-dark" : "text-muted hover:bg-[#eef3fb]")}>
              {n.label}
            </button>
          ))}
        </div>
      </nav>
      <main className="p-5 md:p-8"><div className="mx-auto max-w-4xl"><Active /></div></main>
    </div>
  );
}
