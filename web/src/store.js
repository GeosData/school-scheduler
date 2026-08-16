import { create } from "zustand";

const DEFAULT_RULES = {
  noRepeatSameDay: { on: true, weight: 50 },
  groupGaps: { on: true, weight: 10 },
  teacherGaps: { on: true, weight: 2 },
  heavyEarly: { on: false, weight: 10 },
};
const blankGrid = () => ({ days: ["Lun", "Mar", "Mie", "Jue", "Vie"], periodMinutes: 55, startTime: "06:30", breakMinutes: 15, periodsPerDay: 8, breakAfterPeriods: [2, 5], allowFreePeriods: true });
const blankData = () => ({
  grid: blankGrid(),
  subjects: [], rooms: [], teachers: [], groups: [], tasks: [],
  rules: JSON.parse(JSON.stringify(DEFAULT_RULES)),
  result: null, error: "",
});
const newId = () => "n" + Math.random().toString(36).slice(2, 7);

export const useStore = create((set, get) => ({
  levels: [{ id: "n1", name: "Secundaria" }],
  saved: {},
  activeId: "n1",

  ...blankData(),
  solving: false,
  view: "inicio",
  tutorial: typeof localStorage !== "undefined" && !localStorage.getItem("hs_tutorial_seen"),

  openTutorial: () => set({ tutorial: true }),
  closeTutorial: () => {
    try { localStorage.setItem("hs_tutorial_seen", "1"); } catch (e) { /* noop */ }
    set({ tutorial: false });
  },

  snapshot: () => {
    const s = get();
    return { grid: s.grid, subjects: s.subjects, rooms: s.rooms, teachers: s.teachers, groups: s.groups, tasks: s.tasks, rules: s.rules, result: s.result, error: s.error };
  },
  selectLevel: (id) => {
    const s = get();
    if (id === s.activeId) return;
    const saved = { ...s.saved, [s.activeId]: s.snapshot() };
    const target = saved[id] || blankData();
    set({ saved, activeId: id, ...target });
  },
  addLevel: (name) => {
    const s = get();
    const saved = { ...s.saved, [s.activeId]: s.snapshot() };
    const id = newId();
    set({ saved, levels: [...s.levels, { id, name: name || "Nuevo nivel" }], activeId: id, ...blankData(), view: "importar" });
  },
  renameLevel: (id, name) => set((s) => ({ levels: s.levels.map((l) => (l.id === id ? { ...l, name } : l)) })),
  removeLevel: (id) => {
    const s = get();
    if (s.levels.length <= 1) return;
    const levels = s.levels.filter((l) => l.id !== id);
    const saved = { ...s.saved }; delete saved[id];
    if (id === s.activeId) {
      const nextId = levels[0].id;
      const target = saved[nextId] || blankData();
      set({ levels, saved, activeId: nextId, ...target });
    } else {
      set({ levels, saved });
    }
  },

  setView: (view) => set({ view }),
  setGrid: (patch) => set((s) => ({ grid: { ...s.grid, ...patch } })),
  set2: (key, value) => set({ [key]: value }),
  setRule: (name, patch) => set((s) => ({ rules: { ...s.rules, [name]: { ...s.rules[name], ...patch } } })),

  toggleBreak: (p) => set((s) => {
    const has = s.grid.breakAfterPeriods.includes(p);
    const breakAfterPeriods = has ? s.grid.breakAfterPeriods.filter((x) => x !== p) : [...s.grid.breakAfterPeriods, p].sort((a, b) => a - b);
    return { grid: { ...s.grid, breakAfterPeriods } };
  }),

  async loadExample() {
    const c = await (await fetch("/api/example")).json();
    set({
      grid: { days: c.days, periodMinutes: c.periodMinutes, startTime: c.startTime || "06:30", breakMinutes: c.breakMinutes ?? 15, periodsPerDay: c.periodsPerDay, breakAfterPeriods: c.breakAfterPeriods, allowFreePeriods: c.allowFreePeriods !== false },
      subjects: Object.entries(c.subjects).map(([name, v]) => ({ name, allowedRoomTypes: v.allowedRoomTypes, block: v.block || 0, heavy: !!v.heavy })),
      rooms: Object.entries(c.roomTypes).map(([type, cap]) => ({ type, cap })),
      teachers: Object.entries(c.teachers).map(([name, v]) => ({ name, notAfterPeriod: v.notAfterPeriod, maxHoursPerDay: v.maxHoursPerDay })),
      groups: [...c.groups],
      tasks: c.tasks.map((t) => ({ ...t })),
      result: null, error: "",
    });
  },

  buildConfig() {
    const s = get();
    const na = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
    return {
      days: s.grid.days,
      periodMinutes: Number(s.grid.periodMinutes),
      startTime: s.grid.startTime || "06:30",
      breakMinutes: Number(s.grid.breakMinutes) || 0,
      periodsPerDay: Number(s.grid.periodsPerDay),
      breakAfterPeriods: s.grid.breakAfterPeriods,
      allowFreePeriods: s.grid.allowFreePeriods !== false,
      roomTypes: Object.fromEntries(s.rooms.filter((r) => r.type).map((r) => [r.type, Number(r.cap) || 1])),
      subjects: Object.fromEntries(s.subjects.filter((x) => x.name).map((x) => [x.name, { allowedRoomTypes: x.allowedRoomTypes, block: Number(x.block) || 0, heavy: !!x.heavy }])),
      groups: s.groups.filter(Boolean),
      teachers: Object.fromEntries(s.teachers.filter((t) => t.name).map((t) => [t.name, { notAfterPeriod: na(t.notAfterPeriod), maxHoursPerDay: t.maxHoursPerDay ? Number(t.maxHoursPerDay) : null }])),
      tasks: s.tasks.filter((t) => t.teacher && t.subject && t.group).map((t) => ({ teacher: t.teacher, subject: t.subject, group: t.group, weekly: Number(t.weekly) || 0 })),
      rules: s.rules,
    };
  },

  async solve(timeLimit = 30) {
    set({ solving: true, error: "", result: null });
    const cfg = get().buildConfig();
    cfg._timeLimit = timeLimit;
    try {
      const data = await (await fetch("/api/solve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cfg) })).json();
      if (data.status === "INFEASIBLE" || data.status === "ERROR") set({ error: data.message || "No se pudo generar.", solving: false });
      else set({ result: data, solving: false, view: "horario" });
    } catch (e) {
      set({ error: "No se pudo conectar con el motor de horarios. Revisa que la aplicación siga abierta e inténtalo de nuevo.", solving: false });
    }
  },
}));
