import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  CalendarDays,
  Users,
  TrendingUp,
  ClipboardList,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

// ---------------------------------------------------------------------------
// Shared tooltip style that adapts to light/dark via CSS variables
// ---------------------------------------------------------------------------
const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--radius)",
  color: "hsl(var(--foreground))",
  boxShadow: "var(--shadow-card)",
};

const axisTickStyle = {
  fontSize: 11,
  fill: "hsl(var(--muted-foreground))",
};

// ---------------------------------------------------------------------------
// 1. AttendanceHeatmap
// ---------------------------------------------------------------------------
export interface AttendanceHeatmapData {
  date: string;
  present: number;
  absent: number;
  total: number;
}

interface AttendanceHeatmapProps {
  data: AttendanceHeatmapData[];
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Returns a Tailwind-compatible background class based on attendance %.
 * Ranges: >= 90% green, >= 75% lime, >= 60% yellow, >= 40% orange, < 40% red.
 */
function getAttendanceCellColor(percentage: number): string {
  if (percentage >= 90) return "bg-success text-success-foreground";
  if (percentage >= 75) return "bg-success/70 text-success-foreground";
  if (percentage >= 60) return "bg-warning/80 text-warning-foreground";
  if (percentage >= 40) return "bg-warning text-warning-foreground";
  return "bg-destructive/80 text-destructive-foreground";
}

function getAttendanceCellBorder(percentage: number): string {
  if (percentage >= 90) return "border-success/30";
  if (percentage >= 75) return "border-success/20";
  if (percentage >= 60) return "border-warning/30";
  if (percentage >= 40) return "border-warning/20";
  return "border-destructive/30";
}

export function AttendanceHeatmap({ data }: AttendanceHeatmapProps) {
  const shouldReduceMotion = useReducedMotion();

  // Group dates into weeks (rows). Each week has up to 7 days.
  const weeks = useMemo(() => {
    if (!data.length) return [];

    // Sort by date ascending
    const sorted = [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const result: (AttendanceHeatmapData | null)[][] = [];
    let currentWeek: (AttendanceHeatmapData | null)[] = [];

    sorted.forEach((entry) => {
      const dayOfWeek = new Date(entry.date).getDay();
      // Convert Sunday (0) to 6, Monday (1) to 0, etc.
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      // If the current week already has a value at this day position or later,
      // push it and start a new week
      if (currentWeek.length > adjustedDay && currentWeek[adjustedDay] !== null) {
        // Fill remaining days with null
        while (currentWeek.length < 7) currentWeek.push(null);
        result.push(currentWeek);
        currentWeek = [];
      }

      // Fill gaps before this day with null
      while (currentWeek.length < adjustedDay) {
        currentWeek.push(null);
      }

      currentWeek.push(entry);
    });

    // Push last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      result.push(currentWeek);
    }

    return result;
  }, [data]);

  // Overall stats
  const stats = useMemo(() => {
    if (!data.length) return { avgRate: 0, totalPresent: 0, totalAbsent: 0 };
    const totalPresent = data.reduce((sum, d) => sum + d.present, 0);
    const totalStudents = data.reduce((sum, d) => sum + d.total, 0);
    const totalAbsent = data.reduce((sum, d) => sum + d.absent, 0);
    return {
      avgRate: totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0,
      totalPresent,
      totalAbsent,
    };
  }, [data]);

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: "easeOut" }}
    >
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Weekly Attendance Heatmap</CardTitle>
            </div>
            <Badge
              variant="secondary"
              className="text-sm font-medium"
            >
              Avg: {stats.avgRate}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-xs text-muted-foreground">Low</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded-sm bg-destructive/80" />
              <div className="w-4 h-4 rounded-sm bg-warning" />
              <div className="w-4 h-4 rounded-sm bg-warning/80" />
              <div className="w-4 h-4 rounded-sm bg-success/70" />
              <div className="w-4 h-4 rounded-sm bg-success" />
            </div>
            <span className="text-xs text-muted-foreground">High</span>
          </div>

          {/* Day labels header */}
          <div className="overflow-x-auto custom-scrollbar">
            <div className="min-w-[420px]">
              <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-1">
                <div /> {/* spacer for week label column */}
                {DAY_LABELS.map((day) => (
                  <div
                    key={day}
                    className="text-xs text-muted-foreground text-center font-medium"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Heatmap grid */}
              {weeks.map((week, weekIdx) => {
                // Build a week label from the first non-null date
                const firstDate = week.find((d) => d !== null);
                const weekLabel = firstDate
                  ? new Date(firstDate.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  : "";

                return (
                  <div
                    key={weekIdx}
                    className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-1"
                  >
                    <div className="text-xs text-muted-foreground flex items-center truncate pr-1">
                      {weekLabel}
                    </div>
                    {week.map((cell, dayIdx) => {
                      if (!cell) {
                        return (
                          <div
                            key={dayIdx}
                            className="aspect-square rounded-md bg-muted/40 border border-border/50"
                          />
                        );
                      }
                      const pct =
                        cell.total > 0
                          ? Math.round((cell.present / cell.total) * 100)
                          : 0;

                      return (
                        <div
                          key={dayIdx}
                          className={`
                            aspect-square rounded-md flex items-center justify-center
                            text-[10px] font-semibold border cursor-default
                            transition-transform hover:scale-110 hover:z-10
                            ${getAttendanceCellColor(pct)}
                            ${getAttendanceCellBorder(pct)}
                          `}
                          title={`${new Date(cell.date).toLocaleDateString()} - ${pct}% (${cell.present}/${cell.total})`}
                        >
                          {pct}%
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary footer */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/50 flex-wrap">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              <span className="text-xs text-muted-foreground">
                Present: <span className="font-semibold text-foreground">{stats.totalPresent.toLocaleString()}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-destructive" />
              <span className="text-xs text-muted-foreground">
                Absent: <span className="font-semibold text-foreground">{stats.totalAbsent.toLocaleString()}</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// 2. PerformanceComparisonChart
// ---------------------------------------------------------------------------
export interface PerformanceComparisonData {
  className: string;
  averageMarks: number;
  passRate: number;
}

interface PerformanceComparisonChartProps {
  data: PerformanceComparisonData[];
}

export function PerformanceComparisonChart({ data }: PerformanceComparisonChartProps) {
  const shouldReduceMotion = useReducedMotion();

  // Best and worst performing class
  const insights = useMemo(() => {
    if (!data.length) return null;
    const bestByMarks = [...data].sort((a, b) => b.averageMarks - a.averageMarks)[0];
    const lowestPassRate = [...data].sort((a, b) => a.passRate - b.passRate)[0];
    return { bestByMarks, lowestPassRate };
  }, [data]);

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay: 0.1, ease: "easeOut" }}
    >
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Class Performance Comparison</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Average marks and pass rates across classes
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.6}
                />
                <XAxis
                  dataKey="className"
                  tick={axisTickStyle}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={axisTickStyle}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => [
                    `${value}%`,
                    name === "averageMarks" ? "Average Marks" : "Pass Rate",
                  ]}
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                />
                <Legend
                  formatter={(value: string) =>
                    value === "averageMarks" ? "Average Marks" : "Pass Rate"
                  }
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Bar
                  dataKey="averageMarks"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="passRate"
                  fill="hsl(var(--success))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Insights row */}
          {insights && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-border/50">
              <div className="p-3 bg-success/5 border border-success/20 rounded-lg">
                <p className="text-xs text-muted-foreground">Top Performer</p>
                <p className="font-semibold text-success text-sm">
                  {insights.bestByMarks.className}
                </p>
                <p className="text-xs text-muted-foreground">
                  {insights.bestByMarks.averageMarks}% average
                </p>
              </div>
              <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
                <p className="text-xs text-muted-foreground">Needs Attention</p>
                <p className="font-semibold text-warning text-sm">
                  {insights.lowestPassRate.className}
                </p>
                <p className="text-xs text-muted-foreground">
                  {insights.lowestPassRate.passRate}% pass rate
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// 3. TeacherWorkloadChart
// ---------------------------------------------------------------------------
export interface TeacherWorkloadData {
  teacherName: string;
  classes: number;
  homework: number;
  pendingGrading: number;
}

interface TeacherWorkloadChartProps {
  data: TeacherWorkloadData[];
}

export function TeacherWorkloadChart({ data }: TeacherWorkloadChartProps) {
  const shouldReduceMotion = useReducedMotion();

  // Highlight the most overloaded teacher
  const mostLoaded = useMemo(() => {
    if (!data.length) return null;
    return [...data].sort(
      (a, b) =>
        b.classes + b.homework + b.pendingGrading -
        (a.classes + a.homework + a.pendingGrading),
    )[0];
  }, [data]);

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay: 0.2, ease: "easeOut" }}
    >
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Teacher Workload</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Classes, homework, and pending grading
                </p>
              </div>
            </div>
            {mostLoaded && (
              <Badge variant="outline" className="text-xs">
                Busiest: {mostLoaded.teacherName}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.6}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={axisTickStyle}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  dataKey="teacherName"
                  type="category"
                  tick={axisTickStyle}
                  width={100}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="classes"
                  fill="hsl(var(--primary))"
                  name="Classes"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={24}
                  stackId="workload"
                />
                <Bar
                  dataKey="homework"
                  fill="hsl(var(--accent))"
                  name="Homework"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={24}
                  stackId="workload"
                />
                <Bar
                  dataKey="pendingGrading"
                  fill="hsl(var(--warning))"
                  name="Pending Grading"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={24}
                  stackId="workload"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Workload summary cards */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/50">
            <div className="text-center p-2 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-lg font-bold text-primary">
                {data.reduce((sum, d) => sum + d.classes, 0)}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Total Classes
              </p>
            </div>
            <div className="text-center p-2 rounded-lg bg-accent/5 border border-accent/10">
              <p className="text-lg font-bold text-accent">
                {data.reduce((sum, d) => sum + d.homework, 0)}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Homework
              </p>
            </div>
            <div className="text-center p-2 rounded-lg bg-warning/5 border border-warning/10">
              <p className="text-lg font-bold text-warning">
                {data.reduce((sum, d) => sum + d.pendingGrading, 0)}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Pending
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// 4. StudentProgressTrend
// ---------------------------------------------------------------------------
export interface StudentProgressData {
  examTitle: string;
  percentage: number;
  classAverage: number;
}

interface StudentProgressTrendProps {
  data: StudentProgressData[];
}

export function StudentProgressTrend({ data }: StudentProgressTrendProps) {
  const shouldReduceMotion = useReducedMotion();

  const stats = useMemo(() => {
    if (!data.length) return null;

    const studentAvg = Math.round(
      data.reduce((sum, d) => sum + d.percentage, 0) / data.length,
    );
    const classAvg = Math.round(
      data.reduce((sum, d) => sum + d.classAverage, 0) / data.length,
    );

    // Trend: compare the first half average to the second half average
    const midpoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midpoint || 1);
    const secondHalf = data.slice(midpoint || 1);
    const firstAvg =
      firstHalf.reduce((s, d) => s + d.percentage, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((s, d) => s + d.percentage, 0) / secondHalf.length;
    const trendDirection = secondAvg >= firstAvg ? "up" : "down";
    const trendDiff = Math.abs(Math.round(secondAvg - firstAvg));

    return { studentAvg, classAvg, trendDirection, trendDiff };
  }, [data]);

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay: 0.15, ease: "easeOut" }}
    >
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Student Progress Trend</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Individual performance vs class average
                </p>
              </div>
            </div>
            {stats && (
              <Badge
                className={`text-xs ${
                  stats.trendDirection === "up"
                    ? "bg-success/10 text-success border-success/20"
                    : "bg-destructive/10 text-destructive border-destructive/20"
                }`}
                variant="outline"
              >
                {stats.trendDirection === "up" ? "+" : "-"}
                {stats.trendDiff}% trend
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.6}
                />
                <XAxis
                  dataKey="examTitle"
                  tick={axisTickStyle}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={axisTickStyle}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => [
                    `${value}%`,
                    name === "percentage" ? "Student Score" : "Class Average",
                  ]}
                  labelFormatter={(label: string) => label}
                  cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 3" }}
                />
                <Legend
                  formatter={(value: string) =>
                    value === "percentage" ? "Student Score" : "Class Average"
                  }
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{
                    fill: "hsl(var(--primary))",
                    stroke: "hsl(var(--card))",
                    strokeWidth: 2,
                    r: 5,
                  }}
                  activeDot={{
                    fill: "hsl(var(--primary))",
                    stroke: "hsl(var(--card))",
                    strokeWidth: 2,
                    r: 7,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="classAverage"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={1.5}
                  strokeDasharray="6 3"
                  dot={{
                    fill: "hsl(var(--muted-foreground))",
                    stroke: "hsl(var(--card))",
                    strokeWidth: 2,
                    r: 4,
                  }}
                  activeDot={{
                    fill: "hsl(var(--muted-foreground))",
                    stroke: "hsl(var(--card))",
                    strokeWidth: 2,
                    r: 6,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stats footer */}
          {stats && (
            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-border/50">
              <div className="p-3 bg-primary/5 border border-primary/15 rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">{stats.studentAvg}%</p>
                <p className="text-xs text-muted-foreground">Student Average</p>
              </div>
              <div className="p-3 bg-muted/50 border border-border rounded-lg text-center">
                <p className="text-2xl font-bold text-foreground">{stats.classAvg}%</p>
                <p className="text-xs text-muted-foreground">Class Average</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
