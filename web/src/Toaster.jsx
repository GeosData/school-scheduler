import { useStore } from "./store";

const STYLES = {
  ok: "border-accent bg-[#f4fbf6] text-accent-dark",
  error: "border-amber-300 bg-amber-50 text-danger",
  info: "border-primary bg-[#eef4ff] text-primary-dark",
};

export default function Toaster() {
  const { toasts, dismissToast } = useStore();
  if (!toasts.length) return null;
  return (
    <div className="no-print fixed bottom-5 left-5 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <button key={t.id} onClick={() => dismissToast(t.id)}
          className={"flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-lg transition " + (STYLES[t.kind] || STYLES.ok)}>
          {t.kind === "ok" && <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 12l6 6L20 6" /></svg>}
          {t.message}
        </button>
      ))}
    </div>
  );
}
