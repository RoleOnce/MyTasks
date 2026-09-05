import { useState, useMemo, useRef, useEffect } from "react";

// ---- Helpers -----------------------------------------------------------

const DAY_NAMES = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"];
const DAY_SHORT = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];
const MONTH_NAMES = [
  "januari", "februari", "mars", "april", "maj", "juni",
  "juli", "augusti", "september", "oktober", "november", "december",
];

// Local-date based key — avoids the UTC/timezone shift you get from
// toISOString(), which was the root cause of the coloring bug.
function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isSameDay(a, b) {
  return toKey(a) === toKey(b);
}

function currentHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ---- Seed data ----------------------------------------------------------

function seedData() {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const dayAfter = addDays(today, 2);
  let id = 1;
  const mk = (text, opts = {}) => ({
    id: id++,
    text,
    done: false,
    priority: null,
    reminder: null,
    ...opts,
  });

  return {
    [toKey(today)]: [
      mk("Handla frukost och kaffe", { done: true }),
      mk("Svara på mejl från Anna", { priority: "important", reminder: "09:30" }),
      mk("30 minuters promenad"),
      mk("Boka tandläkartid", { priority: "critical" }),
    ],
    [toKey(tomorrow)]: [
      mk("Förbered presentation", { priority: "critical", reminder: "08:00" }),
      mk("Ring mamma"),
    ],
    [toKey(dayAfter)]: [
      mk("Städa förrådet"),
    ],
  };
}

// ---- Icons (inline, no deps) --------------------------------------------

function IconTrash(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
    </svg>
  );
}
function IconSun(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}
function IconCalendar(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="4" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function IconCalendarPlus(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="4" />
      <path d="M16 2v4M8 2v4M3 10h18M12 14v6M9 17h6" />
    </svg>
  );
}
function IconClock(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function IconFlag(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 3v18M5 4h11l-2.5 3.5L16 11H5" />
    </svg>
  );
}
function IconBell(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z" />
      <path d="M9.5 18a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}
function IconX(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
function IconPencil(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
function IconCheck(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function IconChevronLeft(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 18 9 12l6-6" />
    </svg>
  );
}
function IconChevronRight(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

// ---- Palette --------------------------------------------------------------

const C = {
  page: "#F1F6EE",
  card: "#FBFDF9",
  border: "#DCE9D6",
  borderStrong: "#C7DBC0",
  text: "#233420",
  textSoft: "#66795F",
  textMuted: "#A2AF98",
  accent: "#4C8763",
  accentStrong: "#356B4C",
  accentSoft: "#DCEFE0",
  accentSofter: "#EFF7EC",
};

const PRIORITY_STYLES = {
  important: { label: "Viktig", flag: "#C98A2E", bg: "#FBEFD9", border: "#F0DBAE", text: "#8A5A12" },
  critical: { label: "Mycket viktig", flag: "#C0574A", bg: "#FBE6E2", border: "#F0C4BA", text: "#8C3226" },
};

// ---- Compose form (shared shape for add + edit) ----------------------------

function TaskComposer({ initial, onSubmit, onCancel, submitLabel, autoFocus }) {
  const [value, setValue] = useState(initial?.text ?? "");
  const [reminder, setReminder] = useState(initial?.reminder ?? "");
  const [priority, setPriority] = useState(initial?.priority ?? null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit({ text: trimmed, reminder: reminder || null, priority });
    if (!initial) {
      setValue("");
      setReminder("");
      setPriority(null);
      inputRef.current?.focus();
    }
  };

  const cyclePriority = () => {
    setPriority((p) => (p === null ? "important" : p === "important" ? "critical" : null));
  };

  const [error, setError] = useState("");
  const prStyle = priority ? PRIORITY_STYLES[priority] : null;

  const handleSubmit = () => {
    if (!value.trim()) {
      setError("Skriv en uppgift först");
      return;
    }
    setError("");
    submit();
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        {!initial && (
          <div
            className="w-6 h-6 rounded-full border-2 border-dashed flex-shrink-0"
            style={{ borderColor: C.borderStrong }}
          />
        )}
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Ny uppgift"
          className="flex-1 bg-transparent text-[15px] outline-none py-2 min-w-0"
          style={{ color: C.text }}
        />
      </div>
      {error && (
        <p className={`text-[12px] mt-0.5 ${initial ? "" : "pl-9"}`} style={{ color: "#B94A3D" }}>
          {error}
        </p>
      )}

      {
        <div className={`flex items-center gap-2 mt-1 flex-wrap ${initial ? "" : "pl-9"}`}>
          <label
            className="flex items-center gap-1.5 text-[12px] rounded-full pl-2 pr-2.5 py-1 cursor-pointer border"
            style={{ color: C.accent, borderColor: C.border, background: C.accentSofter }}
          >
            <IconClock className="w-3.5 h-3.5" />
            <input
              type="time"
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
              className="bg-transparent outline-none text-[12px] w-[62px]"
              style={{ color: C.accent }}
            />
          </label>

          <button
            type="button"
            onClick={cyclePriority}
            className="flex items-center gap-1.5 text-[12px] rounded-full pl-2 pr-2.5 py-1 border transition-colors"
            style={{
              color: prStyle ? prStyle.text : C.textSoft,
              background: prStyle ? prStyle.bg : C.accentSofter,
              borderColor: prStyle ? prStyle.border : C.border,
            }}
          >
            <IconFlag className="w-3.5 h-3.5" style={{ color: prStyle ? prStyle.flag : C.textMuted }} />
            {prStyle ? prStyle.label : "Ingen prioritet"}
          </button>

          <div className="ml-auto flex items-center gap-1">
            {initial && (
              <button
                onClick={onCancel}
                className="text-[13px] font-medium px-2 py-1"
                style={{ color: C.textSoft }}
              >
                Avbryt
              </button>
            )}
            <button
              onClick={handleSubmit}
              className="text-[13px] font-medium px-3 py-1.5 rounded-full text-white"
              style={{ background: C.accent }}
            >
              {submitLabel}
            </button>
          </div>
        </div>
      }
    </div>
  );
}

// ---- Task row -------------------------------------------------------------

function TaskRow({ task, onToggle, onDelete, onEdit, editing, onSaveEdit, onCancelEdit }) {
  const pr = task.priority ? PRIORITY_STYLES[task.priority] : null;

  if (editing) {
    return (
      <div
        className="rounded-2xl px-3 py-2.5 mb-2 border"
        style={{ background: C.card, borderColor: C.borderStrong }}
      >
        <TaskComposer
          initial={task}
          onSubmit={(updated) => onSaveEdit(task.id, updated)}
          onCancel={onCancelEdit}
          submitLabel="Spara"
          autoFocus
        />
      </div>
    );
  }

  return (
    <div
      className="group flex items-start gap-3 rounded-2xl px-3 py-3 mb-2"
      style={{ background: pr ? pr.bg : C.accentSofter }}
    >
      <button
        onClick={onToggle}
        aria-label={task.done ? "Markera som ej klar" : "Markera som klar"}
        className="flex-shrink-0 w-6 h-6 mt-0.5 rounded-full border-2 flex items-center justify-center transition-colors"
        style={{
          background: task.done ? C.accent : "transparent",
          borderColor: task.done ? C.accent : C.borderStrong,
        }}
      >
        {task.done && <IconCheck className="w-3.5 h-3.5 text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {pr && (
            <IconFlag className="w-3.5 h-3.5 flex-shrink-0" style={{ color: pr.flag }} aria-label={pr.label} />
          )}
          <span
            className="text-[15px] leading-snug transition-colors"
            style={{ color: task.done ? C.textMuted : C.text, textDecoration: task.done ? "line-through" : "none" }}
          >
            {task.text}
          </span>
        </div>
        {task.reminder && (
          <div className="flex items-center gap-1 mt-1" style={{ color: pr ? pr.text : C.accent }}>
            <IconClock className="w-3 h-3" />
            <span className="text-[12px]">{task.reminder}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={onEdit}
          aria-label="Redigera uppgift"
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ color: C.textSoft }}
        >
          <IconPencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          aria-label="Ta bort uppgift"
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ color: C.textSoft }}
        >
          <IconTrash className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ---- Progress ring header ---------------------------------------------------

function ProgressBadge({ done, total, light }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const r = 16;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  const trackColor = light ? "rgba(255,255,255,0.3)" : C.border;
  const barColor = light ? "#FFFFFF" : C.accent;
  const textColor = light ? "#FFFFFF" : C.accentStrong;

  return (
    <div className="relative w-11 h-11 flex-shrink-0">
      <svg viewBox="0 0 40 40" className="w-11 h-11 -rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke={trackColor} strokeWidth="4" />
        <circle
          cx="20" cy="20" r={r} fill="none" stroke={barColor} strokeWidth="4"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium" style={{ color: textColor }}>
        {pct}%
      </span>
    </div>
  );
}

// ---- Day list panel (shared by both tabs) ------------------------------------

function DayPanel({ dateObj, tasks, onToggle, onDelete, onAdd, onSaveEdit, emptyLabel }) {
  const done = tasks.filter((t) => t.done).length;
  const isToday = isSameDay(dateObj, new Date());
  const [editingId, setEditingId] = useState(null);

  return (
    <div>
      <div
        className="rounded-2xl px-5 py-4 mb-5 flex items-center justify-between"
        style={{ background: C.accent }}
      >
        <div>
          <p className="text-[13px] font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.75)" }}>
            {DAY_NAMES[dateObj.getDay()]}, {dateObj.getDate()} {MONTH_NAMES[dateObj.getMonth()]}
          </p>
          <h1 className="text-[24px] font-semibold tracking-tight text-white">
            {isToday ? "Idag" : DAY_NAMES[dateObj.getDay()]}
          </h1>
          {tasks.length > 0 && (
            <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.85)" }}>
              {done} av {tasks.length} klara
            </p>
          )}
        </div>
        {tasks.length > 0 && <ProgressBadge done={done} total={tasks.length} light />}
      </div>

      <div className="rounded-2xl border px-3 pt-3" style={{ background: C.card, borderColor: C.border }}>
        {tasks.length === 0 ? (
          <div className="py-8 text-center">
            <div
              className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
              style={{ background: C.accentSofter }}
            >
              <IconCalendar className="w-4 h-4" style={{ color: C.accent }} />
            </div>
            <p className="text-[14px]" style={{ color: C.textMuted }}>{emptyLabel}</p>
          </div>
        ) : (
          <div>
            {tasks.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                onToggle={() => onToggle(t.id)}
                onDelete={() => onDelete(t.id)}
                onEdit={() => setEditingId(t.id)}
                editing={editingId === t.id}
                onSaveEdit={(id, updated) => {
                  onSaveEdit(id, updated);
                  setEditingId(null);
                }}
                onCancelEdit={() => setEditingId(null)}
              />
            ))}
          </div>
        )}
        <div className="pb-3 pt-1">
          <TaskComposer onSubmit={onAdd} submitLabel="Lägg till" />
        </div>
      </div>
    </div>
  );
}

// ---- Mini calendar (custom, replaces native date input) ----------------------

const WEEKDAY_LETTERS = ["M", "T", "O", "T", "F", "L", "S"];

function MiniCalendar({ initialMonth, selected, tasksByKey, onSelect, onClose }) {
  const [viewMonth, setViewMonth] = useState(
    new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1)
  );
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const cells = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7; // Monday-first grid
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr = [];
    for (let i = 0; i < offset; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(year, month, d));
    return arr;
  }, [viewMonth]);

  const isCurrentMonth =
    viewMonth.getFullYear() === todayStart.getFullYear() && viewMonth.getMonth() === todayStart.getMonth();

  return (
    <div className="rounded-2xl border p-3 mb-4" style={{ background: C.card, borderColor: C.border }}>
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          type="button"
          onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          disabled={isCurrentMonth}
          aria-label="Föregående månad"
          className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-30"
          style={{ color: C.accent, background: C.accentSofter }}
        >
          <IconChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[14px] font-medium capitalize" style={{ color: C.text }}>
          {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
        </span>
        <button
          type="button"
          onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          aria-label="Nästa månad"
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ color: C.accent, background: C.accentSofter }}
        >
          <IconChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LETTERS.map((w, i) => (
          <div key={i} className="text-center text-[11px] font-medium py-1" style={{ color: C.textMuted }}>
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} />;
          const key = toKey(d);
          const isPast = d < todayStart;
          const isSel = isSameDay(d, selected);
          const isToday = isSameDay(d, todayStart);
          const hasTasks = (tasksByKey[key] || []).length > 0;
          return (
            <button
              type="button"
              key={key}
              disabled={isPast}
              onClick={() => {
                onSelect(d);
                onClose();
              }}
              className="aspect-square rounded-xl flex items-center justify-center text-[13px] font-medium disabled:opacity-25 transition-colors"
              style={{
                background: isSel ? C.accent : hasTasks ? C.accentSoft : "transparent",
                color: isSel ? "#FFFFFF" : C.text,
                boxShadow: isToday && !isSel ? `inset 0 0 0 1.5px ${C.accent}` : "none",
              }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---- Upcoming date strip ----------------------------------------------------

function DateStrip({ dates, selected, onSelect, tasksByKey }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-5 px-5" style={{ scrollbarWidth: "none" }}>
      {dates.map((d) => {
        const key = toKey(d);
        const isSel = isSameDay(d, selected);
        const hasTasks = (tasksByKey[key] || []).length > 0;

        let bg = C.card;
        let border = C.border;
        let dayColor = C.textMuted;
        let numColor = C.text;
        if (isSel) {
          bg = C.accent;
          border = C.accent;
          dayColor = "rgba(255,255,255,0.75)";
          numColor = "#FFFFFF";
        } else if (hasTasks) {
          bg = C.accentSoft;
          border = "#BFDDC7";
          dayColor = "#4C7A5B";
          numColor = C.accentStrong;
        }

        return (
          <button
            key={key}
            onClick={() => onSelect(d)}
            className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-2xl border transition-colors"
            style={{ background: bg, borderColor: border }}
          >
            <span className="text-[11px] font-medium mb-1" style={{ color: dayColor }}>
              {DAY_SHORT[d.getDay()]}
            </span>
            <span className="text-[16px] font-semibold" style={{ color: numColor }}>
              {d.getDate()}
            </span>
          </button>
        );
      })}

    </div>
  );
}

// ---- Reminder toast -----------------------------------------------------

function ReminderToast({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="absolute top-3 left-3 right-3 z-10 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-2 text-white rounded-2xl px-3 py-2.5"
          style={{ background: C.accentStrong, boxShadow: "0 8px 20px -8px rgba(53,107,76,0.6)" }}
        >
          <IconBell className="w-4 h-4 flex-shrink-0" />
          <span className="text-[13px] flex-1 min-w-0 truncate">Dags för: {t.text}</span>
          <button
            onClick={() => onDismiss(t.id)}
            aria-label="Stäng påminnelse"
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center opacity-80 hover:opacity-100"
          >
            <IconX className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ---- Persistence (localStorage) --------------------------------------------
// Only safe to use outside the Claude artifact sandbox — this is a real
// standalone website, so the browser's own storage works normally here.

const STORAGE_KEY = "todo-app-data-v1";

function loadStoredData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Kunde inte läsa sparad data:", e);
  }
  return seedData();
}

// ---- Main app ---------------------------------------------------------------

export default function TodoApp() {
  const [tab, setTab] = useState("today");
  const [data, setData] = useState(loadStoredData);
  const [selectedDate, setSelectedDate] = useState(addDays(new Date(), 1));
  const [showCalendar, setShowCalendar] = useState(false);
  const [toasts, setToasts] = useState([]);
  const notifiedRef = useRef(new Set());

  const today = new Date();
  const todayKey = toKey(today);
  const selectedKey = toKey(selectedDate);

  const quickDates = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDays(today, i + 1)),
    []
  );

  // Make sure a far-future date picked via "Välj" always shows up in the strip.
  const stripDates = useMemo(() => {
    const map = new Map(quickDates.map((d) => [toKey(d), d]));
    if (!map.has(selectedKey)) map.set(selectedKey, selectedDate);
    return Array.from(map.values()).sort((a, b) => a - b);
  }, [quickDates, selectedDate, selectedKey]);

  // Spara till webbläsarens lagring varje gång något ändras.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Kunde inte spara data:", e);
    }
  }, [data]);

  // Check today's tasks against the clock every 20s for reminders due now.
  useEffect(() => {
    const check = () => {
      const nowHHMM = currentHHMM();
      const todaysTasks = data[todayKey] || [];
      todaysTasks.forEach((t) => {
        if (t.reminder && !t.done && t.reminder === nowHHMM && !notifiedRef.current.has(t.id)) {
          notifiedRef.current.add(t.id);
          setToasts((prev) => [...prev, { id: t.id, text: t.text }]);
        }
      });
    };
    check();
    const interval = setInterval(check, 20000);
    return () => clearInterval(interval);
  }, [data, todayKey]);

  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const toggleTask = (key, id) => {
    setData((prev) => ({
      ...prev,
      [key]: (prev[key] || []).map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  };

  const deleteTask = (key, id) => {
    setData((prev) => ({ ...prev, [key]: (prev[key] || []).filter((t) => t.id !== id) }));
  };

  const addTask = (key, { text, reminder, priority }) => {
    setData((prev) => {
      const existing = prev[key] || [];
      const allIds = Object.values(prev).flat().map((t) => t.id);
      const nextId = (allIds.length ? Math.max(...allIds) : 0) + 1;
      return { ...prev, [key]: [...existing, { id: nextId, text, done: false, reminder, priority }] };
    });
  };

  const editTask = (key, id, updated) => {
    setData((prev) => ({
      ...prev,
      [key]: (prev[key] || []).map((t) => (t.id === id ? { ...t, ...updated } : t)),
    }));
  };

  return (
    <div
      className="min-h-screen flex items-start justify-center py-10 px-4"
      style={{ background: C.page, fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif' }}
    >
      <div
        className="relative w-full max-w-sm rounded-[2.5rem] border overflow-hidden flex flex-col"
        style={{ height: "700px", background: C.page, borderColor: C.border, boxShadow: "0 20px 50px -25px rgba(35,52,32,0.3)" }}
      >
        <ReminderToast toasts={toasts} onDismiss={dismissToast} />

        <div className="h-4 flex-shrink-0" />

        <div className="px-5 pt-2 pb-6 flex-1 overflow-y-auto">
          {tab === "today" ? (
            <DayPanel
              key={todayKey}
              dateObj={today}
              tasks={data[todayKey] || []}
              onToggle={(id) => toggleTask(todayKey, id)}
              onDelete={(id) => deleteTask(todayKey, id)}
              onAdd={(task) => addTask(todayKey, task)}
              onSaveEdit={(id, updated) => editTask(todayKey, id, updated)}
              emptyLabel="Inga uppgifter idag. Njut av dagen."
            />
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[13px] font-medium mb-0.5" style={{ color: C.textSoft }}>Kommande</p>
                  <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: C.text }}>
                    Planera framåt
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCalendar((v) => !v)}
                  className="flex items-center gap-1.5 text-[12px] font-medium rounded-full pl-2.5 pr-3 py-2 border flex-shrink-0"
                  style={{
                    color: showCalendar ? "#FFFFFF" : C.accent,
                    background: showCalendar ? C.accent : C.accentSofter,
                    borderColor: showCalendar ? C.accent : C.border,
                  }}
                >
                  <IconCalendarPlus className="w-4 h-4" />
                  Välj datum
                </button>
              </div>

              {showCalendar && (
                <MiniCalendar
                  initialMonth={selectedDate}
                  selected={selectedDate}
                  tasksByKey={data}
                  onSelect={setSelectedDate}
                  onClose={() => setShowCalendar(false)}
                />
              )}

              <DateStrip
                dates={stripDates}
                selected={selectedDate}
                onSelect={setSelectedDate}
                tasksByKey={data}
              />
              <DayPanel
                key={selectedKey}
                dateObj={selectedDate}
                tasks={data[selectedKey] || []}
                onToggle={(id) => toggleTask(selectedKey, id)}
                onDelete={(id) => deleteTask(selectedKey, id)}
                onAdd={(task) => addTask(selectedKey, task)}
                onSaveEdit={(id, updated) => editTask(selectedKey, id, updated)}
                emptyLabel="Inget planerat den här dagen än."
              />
            </div>
          )}
        </div>

        <div
          className="flex-shrink-0 border-t px-8 py-3 flex justify-around"
          style={{ background: "rgba(241,246,238,0.9)", borderColor: C.border, backdropFilter: "blur(6px)" }}
        >
          <button
            onClick={() => setTab("today")}
            className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-2xl transition-colors"
            style={{ background: tab === "today" ? C.accentSoft : "transparent" }}
          >
            <IconSun className="w-5 h-5" style={{ color: tab === "today" ? C.accentStrong : C.textMuted }} />
            <span className="text-[11px] font-medium" style={{ color: tab === "today" ? C.accentStrong : C.textMuted }}>
              Idag
            </span>
          </button>
          <button
            onClick={() => setTab("upcoming")}
            className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-2xl transition-colors"
            style={{ background: tab === "upcoming" ? C.accentSoft : "transparent" }}
          >
            <IconCalendar className="w-5 h-5" style={{ color: tab === "upcoming" ? C.accentStrong : C.textMuted }} />
            <span className="text-[11px] font-medium" style={{ color: tab === "upcoming" ? C.accentStrong : C.textMuted }}>
              Kommande
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
