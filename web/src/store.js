import { create } from "zustand";

export const useStore = create((set, get) => ({
  grid: { days: ["Lun", "Mar", "Mie", "Jue", "Vie"], periodMinutes: 55, startTime: "06:30", breakMinutes: 15, periodsPerDay: 8, breakAfterPeriods: [2, 5], allowFreePeriods: true },
  subjects: [],
  rooms: [],
  teachers: [],
  groups: [],
  tasks: [],
  rules: {
    noRepeatSameDay: { on: true, weight: 100 },
    groupGaps: { on: true, weight: 3 },
    teacherGaps: { on: true, weight: 1 },
    heavyEarly: { on: false, weight: 2 },
  },
  result: null,
  solving: false,
  error: "",
  view: "inicio",
  tutorial: typeof localStorage !== "undefined" && !localStorage.getItem("hs_tutorial_seen"),

  openTutorial: () => set({ tutorial: true }),
  closeTutorial: () => {
    try { localStorage.setItem("hs_tutorial_seen", "1"); } catch (e) { /* noop */ }
    set({ tutorial: false });
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
