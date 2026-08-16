import { useState } from "react";
import { useStore } from "./store";

const STEPS = [
  {
    title: "Bienvenido a Horarios Escolares",
    body: "Arma el horario de tu colegio sin choques y sin pelear con Excel. Todo corre en tu computador, sin internet. Te muestro el flujo en 30 segundos.",
  },
  {
    title: "Paso 1 · Carga los datos",
    body: "En el menú, sección por sección, defines salones, materias, docentes, grupos y las cargas académicas (quién dicta qué a quién). ¿Ya los tienes en Excel? Usa “Importar Excel” y se llenan todos de una.",
  },
  {
    title: "Paso 2 · Ajusta las reglas (opcional)",
    body: "En “Rejilla y jornada” pones la duración de la hora y los descansos. En “Preferencias” eliges reglas blandas: docentes sin huecos, materias pesadas temprano, y con qué prioridad. Nada es obligatorio.",
  },
  {
    title: "Paso 3 · Genera y revisa",
    body: "Pulsa “Generar” y el horario sale solo, sin choques. Lo ves por grupo o por docente, y lo exportas a CSV. Consejo: pulsa “Ver un horario de ejemplo” en Inicio para verlo funcionando ya.",
  },
];

export default function Tutorial() {
  const { tutorial, closeTutorial } = useStore();
  const [i, setI] = useState(0);
  if (!tutorial) return null;
  const s = STEPS[i];
  const last = i === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={closeTutorial}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-white">{i + 1}</span>
          <h3 className="text-lg font-bold text-ink">{s.title}</h3>
        </div>
        <p className="text-muted">{s.body}</p>
        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, j) => <span key={j} className={"h-2 w-2 rounded-full " + (j === i ? "bg-primary" : "bg-slate-200")} />)}
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost text-sm" onClick={closeTutorial}>Saltar</button>
            {i > 0 && <button className="btn btn-ghost text-sm" onClick={() => setI(i - 1)}>Atrás</button>}
            {last
              ? <button className="btn btn-accent text-sm" onClick={closeTutorial}>Entendido</button>
              : <button className="btn btn-primary text-sm" onClick={() => setI(i + 1)}>Siguiente</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
