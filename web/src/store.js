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
let _toastId = 0;

export const useStore = create((set, get) => ({
  levels: [{ id: "n1", name: "Secundaria" }],
  saved: {},
  activeId: "n1",

  ...blankData(),
  solving: false,
  hydrated: false,
  toasts: [],
  lastSaved: null,
  view: "inicio",
  tutorial: typeof localStorage !== "undefined" && !localStorage.getItem("hs_tutorial_seen"),

  pushToast: (message, kind = "ok") => {
    const id = ++_toastId;
    set((s) => ({ toasts: [...s.toasts, { id, message, kind }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2600);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  openTutorial: () => set({ tutorial: true }),
  closeTutorial: () => {
    try { localStorage.setItem("hs_tutorial_seen", "1"); } catch (e) { /* noop */ }
    set({ tutorial: false });
  },

  snapshot: () => {
    const s = get();
    return { grid: s.grid, subjects: s.subjects, rooms: s.rooms, teachers: s.teachers, groups: s.groups, tasks: s.tasks, rules: s.rules, result: s.result, error: s.error };
  },

  buildWorkspace: () => {
    const s = get();
    return { levels: s.levels, activeId: s.activeId, data: { ...s.saved, [s.activeId]: s.snapshot() } };
  },
  restoreWorkspace: (w) => {
    if (!(w && Array.isArray(w.levels) && w.levels.length && w.data)) return false;
    const activeId = w.data[w.activeId] ? w.activeId : w.levels[0].id;
    const active = w.data[activeId] || blankData();
    const saved = { ...w.data }; delete saved[activeId];
    set({ levels: w.levels, activeId, saved, ...active });
    return true;
  },
  saveWorkspace: async () => {
    if (!get().hydrated) return;
    try {
      await fetch("/api/workspace", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: get().buildWorkspace() }) });
      set({ lastSaved: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) });
    } catch (e) { /* offline */ }
  },
  loadWorkspace: async () => {
    try {
      const r = await (await fetch("/api/workspace")).json();
      return get().restoreWorkspace(r.data);
    } catch (e) { return false; }
  },
  exportProject: () => {
    const blob = new Blob([JSON.stringify(get().buildWorkspace(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "proyecto-horarios.json";
    a.click();
    URL.revokeObjectURL(a.href);
    get().pushToast("Copia descargada", "ok");
  },
  importProject: async (file) => {
    try {
      const ok = get().restoreWorkspace(JSON.parse(await file.text()));
      if (ok) { get().saveWorkspace(); get().pushToast("Proyecto abierto", "ok"); }
      else get().pushToast("El archivo no es un proyecto válido", "error");
      return ok;
    } catch (e) { get().pushToast("No se pudo abrir el archivo", "error"); return false; }
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
    const w = await (await fetch("/api/example")).json();
    return get().restoreWorkspace(w);
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

  preflight() {
    const s = get();
    const days = (s.grid.days || []).length;
    const P = Number(s.grid.periodsPerDay) || 0;
    const slots = days * P;
    const allowFree = s.grid.allowFreePeriods !== false;
    const hoursByGroup = {}, loadByTeacher = {};
    s.tasks.forEach((t) => {
      const w = Number(t.weekly) || 0;
      if (t.group) hoursByGroup[t.group] = (hoursByGroup[t.group] || 0) + w;
      if (t.teacher) loadByTeacher[t.teacher] = (loadByTeacher[t.teacher] || 0) + w;
    });
    const groups = s.groups.filter(Boolean).map((g) => {
      const hours = hoursByGroup[g] || 0;
      const diff = slots - hours;
      let level = "ok", msg;
      if (hours === 0) { level = "warn"; msg = "sin cargas asignadas"; }
      else if (diff < 0) { level = "error"; msg = `faltan ${-diff} franjas (más horas que espacios en la jornada)`; }
      else if (diff === 0) { msg = "cuadra exacto, jornada llena"; }
      else if (!allowFree) { level = "error"; msg = `sobran ${diff} franjas y "horas libres" está apagado: no cuadra`; }
      else { level = "info"; msg = `${diff} ${diff === 1 ? "hora libre" : "horas libres"} por semana (sale más temprano algunos días)`; }
      return { group: g, hours, slots, level, msg };
    });
    const teachers = s.teachers.filter((t) => t.name).map((t) => {
      const naSet = t.notAfterPeriod !== "" && t.notAfterPeriod != null;
      const perDay = naSet ? Math.min(Number(t.notAfterPeriod), P) : P;
      const maxDay = t.maxHoursPerDay ? Number(t.maxHoursPerDay) : perDay;
      const cap = Math.min(perDay, maxDay) * days;
      const load = loadByTeacher[t.name] || 0;
      return { name: t.name, load, cap, over: load > cap };
    });
    return { slots, days, P, allowFree, groups, teachers,
      errors: groups.filter((g) => g.level === "error").length + teachers.filter((t) => t.over).length };
  },

  async solve(timeLimit = 30, _retried = false) {
    set({ solving: true, error: "", result: null });
    const cfg = get().buildConfig();
    cfg._timeLimit = timeLimit;
    try {
      const data = await (await fetch("/api/solve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cfg) })).json();
      if (data.status === "INVALID") set({ error: data.message + "\n• " + (data.problems || []).join("\n• "), solving: false });
      else if (data.status === "TIMEOUT" && !_retried) { get().pushToast("El horario está ajustado, reintentando…", "info"); return get().solve(Math.round(timeLimit * 1.7), true); }
      else if (data.status === "INFEASIBLE" || data.status === "ERROR" || data.status === "TIMEOUT") set({ error: data.message || "No se pudo generar.", solving: false });
      else { set({ result: data, solving: false, view: "horario" }); get().pushToast("Horario listo", "ok"); }
    } catch (e) {
      set({ error: "No se pudo conectar con el motor de horarios. Revisa que la aplicación siga abierta e inténtalo de nuevo.", solving: false });
    }
  },

  canMoveClass: (group, fd, fp, td, tp) => {
    const s = get();
    const res = s.result;
    if (!res || (fd === td && fp === tp)) return { ok: false };
    const g = res.byGroup[group];
    const cell = g.grid[fd][fp];
    if (!cell) return { ok: false };
    if (g.grid[td][tp]) return { ok: false, reason: "Ahí ya hay una clase de este grupo" };
    const teacher = cell.teacher;
    const tGrid = res.byTeacher[teacher] && res.byTeacher[teacher].grid;
    if (tGrid && tGrid[td][tp]) return { ok: false, reason: `${teacher} ya dicta a esa hora en otro grupo` };
    const teDef = s.teachers.find((t) => t.name === teacher);
    const limit = teDef && teDef.notAfterPeriod !== "" && teDef.notAfterPeriod != null ? Number(teDef.notAfterPeriod) : null;
    if (limit != null && tp >= limit) return { ok: false, reason: `${teacher} no puede dictar a esa hora (su tope es la ${limit}ª)` };
    const subj = s.subjects.find((x) => x.name === cell.subject);
    const allowed = subj ? subj.allowedRoomTypes : [cell.roomType];
    const capOf = (ty) => { const r = s.rooms.find((rr) => rr.type === ty); return r ? Number(r.cap) : 0; };
    const usedAt = (ty) => Object.values(res.byGroup).reduce((n, gg) => n + (gg.grid[td][tp] && gg.grid[td][tp].roomType === ty ? 1 : 0), 0);
    let chosen = null;
    for (const ty of allowed) { if (usedAt(ty) < capOf(ty)) { chosen = ty; break; } }
    if (!chosen) return { ok: false, reason: "No hay salón libre de un tipo permitido a esa hora" };
    return { ok: true, roomType: chosen, cell, teacher };
  },

  moveClass: (group, fd, fp, td, tp) => {
    const s = get();
    const chk = get().canMoveClass(group, fd, fp, td, tp);
    if (!chk.ok) { if (chk.reason) s.pushToast(chk.reason, "error"); return; }
    const res = s.result;
    const cell = chk.cell, teacher = chk.teacher, chosen = chk.roomType;
    const clone = (grid) => grid.map((row) => row.slice());
    const byGroup = { ...res.byGroup };
    byGroup[group] = { ...g, grid: clone(g.grid) };
    byGroup[group].grid[fd][fp] = null;
    byGroup[group].grid[td][tp] = { ...cell, roomType: chosen };
    const byTeacher = { ...res.byTeacher };
    if (byTeacher[teacher]) {
      byTeacher[teacher] = { ...byTeacher[teacher], grid: clone(byTeacher[teacher].grid) };
      byTeacher[teacher].grid[fd][fp] = null;
      byTeacher[teacher].grid[td][tp] = { subject: cell.subject, roomType: chosen, group };
    }
    const P = res.periodsPerDay, D = res.days.length;
    let holes = 0;
    for (let d = 0; d < D; d++) {
      const col = [];
      for (let p = 0; p < P; p++) col.push(byGroup[group].grid[d][p] ? 1 : 0);
      if (col.includes(1)) {
        const a = col.indexOf(1), b = col.lastIndexOf(1);
        holes += (b - a + 1) - col.slice(a, b + 1).reduce((x, y) => x + y, 0);
      }
    }
    byGroup[group].holes = holes;
    set({ result: { ...res, byGroup, byTeacher } });
    s.pushToast("Clase movida", "ok");
  },
}));

let _saveTimer;
useStore.subscribe((s, p) => {
  if (!s.hydrated) return;
  const changed = ["levels", "saved", "activeId", "grid", "subjects", "rooms", "teachers", "groups", "tasks", "rules", "result"].some((k) => s[k] !== p[k]);
  if (!changed) return;
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => useStore.getState().saveWorkspace(), 700);
});
