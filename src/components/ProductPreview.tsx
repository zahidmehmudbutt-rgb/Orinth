import { LayoutDashboard, ClipboardCheck, BookOpen, BarChart3, MessageSquare, Users } from "lucide-react";

/**
 * A stylised mock of the attendance dashboard, built entirely from design tokens
 * so it tracks light/dark themes. Used in the hero in place of stock photography —
 * showing the actual interface tells a visitor far more than a classroom photo.
 *
 * Purely decorative: no data fetching, and hidden from assistive tech.
 */

const navItems = [
  { icon: LayoutDashboard, label: "Overview", active: true },
  { icon: ClipboardCheck, label: "Attendance" },
  { icon: BookOpen, label: "Homework" },
  { icon: BarChart3, label: "Results" },
  { icon: MessageSquare, label: "Messages" },
  { icon: Users, label: "Students" },
];

const tiles = [
  { label: "Present today", value: "312", tone: "text-[hsl(var(--success))]" },
  { label: "Absent", value: "18", tone: "text-[hsl(var(--destructive))]" },
  { label: "On leave", value: "7", tone: "text-[hsl(var(--warning))]" },
  { label: "Attendance", value: "92%", tone: "text-primary" },
];

// Deterministic bar heights — no randomness, so the mock renders identically every time.
const bars = [62, 74, 58, 88, 71, 94, 80, 67, 91, 76, 85, 70];
const weekdays = ["M", "T", "W", "T", "F", "M", "T", "W", "T", "F", "M", "T"];

const roster = [
  { name: "Ayesha Khan", cls: "8-B", status: "Present", tone: "bg-[hsl(var(--success))]/12 text-[hsl(var(--success))]" },
  { name: "Bilal Ahmed", cls: "8-B", status: "Late", tone: "bg-[hsl(var(--warning))]/14 text-[hsl(var(--warning))]" },
  { name: "Fatima Noor", cls: "8-B", status: "Present", tone: "bg-[hsl(var(--success))]/12 text-[hsl(var(--success))]" },
];

export const ProductPreview = () => (
  <div
    aria-hidden="true"
    className="select-none rounded-xl border border-border bg-card shadow-card-hover overflow-hidden"
  >
    {/* window chrome */}
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
      <span className="w-2.5 h-2.5 rounded-full bg-foreground/15" />
      <span className="w-2.5 h-2.5 rounded-full bg-foreground/15" />
      <span className="w-2.5 h-2.5 rounded-full bg-foreground/15" />
      <div className="ml-3 h-5 flex-1 max-w-[220px] rounded bg-background/70 border border-border" />
    </div>

    <div className="flex">
      {/* sidebar */}
      <aside className="hidden sm:flex w-40 shrink-0 flex-col gap-0.5 p-3 border-r border-border">
        {navItems.map(({ icon: Icon, label, active }) => (
          <div
            key={label}
            className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-[11px] font-medium ${
              active ? "bg-primary/10 text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {label}
          </div>
        ))}
      </aside>

      {/* main panel */}
      <div className="flex-1 min-w-0 p-4 sm:p-5 space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-foreground truncate">Class 8-B — Attendance</p>
          <span className="text-[11px] text-muted-foreground shrink-0">This term</span>
        </div>

        {/* stat tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-lg border border-border bg-background/60 px-3 py-2.5">
              <p className="text-[10px] text-muted-foreground truncate">{t.label}</p>
              <p className={`text-lg font-bold tabular-nums leading-tight ${t.tone}`}>{t.value}</p>
            </div>
          ))}
        </div>

        {/* chart */}
        <div className="rounded-lg border border-border bg-background/60 p-3">
          <div className="flex items-end gap-[5px] h-24">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end h-full">
                <div
                  className={`w-full rounded-t-[3px] ${i === 5 ? "bg-primary" : "bg-primary/25"}`}
                  style={{ height: `${h}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-[5px] mt-1.5">
            {weekdays.map((d, i) => (
              <span key={i} className="flex-1 text-center text-[9px] text-muted-foreground">{d}</span>
            ))}
          </div>
        </div>

        {/* roster rows */}
        <div className="space-y-1.5">
          {roster.map((r) => (
            <div key={r.name} className="flex items-center gap-3 rounded-lg border border-border bg-background/60 px-3 py-2">
              <div className="w-6 h-6 rounded-full bg-primary/15 shrink-0" />
              <span className="text-[11px] font-medium text-foreground truncate flex-1">{r.name}</span>
              <span className="text-[10px] text-muted-foreground hidden sm:inline">{r.cls}</span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${r.tone}`}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
