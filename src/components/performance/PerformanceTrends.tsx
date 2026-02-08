import { memo } from "react";
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, BookOpen, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getDateLocale } from "@/lib/utils/date-locale";
import type { ExamResult } from "@/types/exam";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#d0ed57"];

interface PerformanceTrendsProps {
  examResults: ExamResult[];
  attendanceData: { present: number; absent: number; percentage: number };
  className?: string;
}

export const PerformanceTrends = memo(function PerformanceTrends({ examResults, attendanceData, className }: PerformanceTrendsProps) {
  // Only graded results (not absent, has marks)
  const graded = examResults.filter(r => r.marksObtained !== null && !r.isAbsent);
  const { t } = useTranslation();

  if (graded.length === 0) return null;

  // --- Subject-wise average percentage (Bar Chart) ---
  const subjectMap = new Map<string, { total: number; max: number; count: number }>();
  graded.forEach(r => {
    const existing = subjectMap.get(r.subject) || { total: 0, max: 0, count: 0 };
    existing.total += r.marksObtained!;
    existing.max += r.maxMarks;
    existing.count += 1;
    subjectMap.set(r.subject, existing);
  });

  const subjectData = Array.from(subjectMap.entries()).map(([subject, data]) => ({
    subject: subject.length > 10 ? subject.slice(0, 10) + "..." : subject,
    fullSubject: subject,
    percentage: Math.round((data.total / data.max) * 100),
  }));

  // --- Grade over time (Line Chart) ---
  const sortedByDate = [...graded]
    .filter(r => r.examDate)
    .sort((a, b) => new Date(a.examDate!).getTime() - new Date(b.examDate!).getTime());

  const timelineData = sortedByDate.map(r => ({
    date: new Date(r.examDate!).toLocaleDateString(getDateLocale(), { month: "short", day: "numeric" }),
    percentage: Math.round((r.marksObtained! / r.maxMarks) * 100),
    title: r.title,
  }));

  // --- Grade distribution (Pie Chart) ---
  const gradeCount = { "A+": 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
  graded.forEach(r => {
    const pct = (r.marksObtained! / r.maxMarks) * 100;
    if (pct >= 90) gradeCount["A+"]++;
    else if (pct >= 80) gradeCount["A"]++;
    else if (pct >= 70) gradeCount["B"]++;
    else if (pct >= 60) gradeCount["C"]++;
    else if (pct >= 50) gradeCount["D"]++;
    else gradeCount["F"]++;
  });

  const gradeData = Object.entries(gradeCount)
    .filter(([, count]) => count > 0)
    .map(([grade, count]) => ({ name: grade, value: count }));

  // --- Overall stats ---
  const totalObtained = graded.reduce((sum, r) => sum + r.marksObtained!, 0);
  const totalMax = graded.reduce((sum, r) => sum + r.maxMarks, 0);
  const overallPercentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

  // --- Exam Type Comparison ---
  const typeComparisonData = [
    {
      type: t("performanceTrends.weekly"),
      average: graded.filter(r => r.examType === "weekly_daily").length > 0
        ? Math.round(
            graded.filter(r => r.examType === "weekly_daily")
              .reduce((sum, r) => sum + (r.marksObtained! / r.maxMarks) * 100, 0) /
            graded.filter(r => r.examType === "weekly_daily").length
          )
        : 0,
      count: graded.filter(r => r.examType === "weekly_daily").length,
    },
    {
      type: t("performanceTrends.monthly"),
      average: graded.filter(r => r.examType === "monthly_midterm").length > 0
        ? Math.round(
            graded.filter(r => r.examType === "monthly_midterm")
              .reduce((sum, r) => sum + (r.marksObtained! / r.maxMarks) * 100, 0) /
            graded.filter(r => r.examType === "monthly_midterm").length
          )
        : 0,
      count: graded.filter(r => r.examType === "monthly_midterm").length,
    },
    {
      type: t("performanceTrends.semester"),
      average: graded.filter(r => r.examType === "semester_final").length > 0
        ? Math.round(
            graded.filter(r => r.examType === "semester_final")
              .reduce((sum, r) => sum + (r.marksObtained! / r.maxMarks) * 100, 0) /
            graded.filter(r => r.examType === "semester_final").length
          )
        : 0,
      count: graded.filter(r => r.examType === "semester_final").length,
    },
  ].filter(d => d.count > 0);

  return (
    <div className={className}>
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{overallPercentage}%</p>
            <p className="text-xs text-muted-foreground">{t("performance.overallScore")}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <Target className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{attendanceData.percentage}%</p>
            <p className="text-xs text-muted-foreground">{t("performance.attendance")}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <BookOpen className="w-5 h-5 text-warning mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{graded.length}</p>
            <p className="text-xs text-muted-foreground">{t("performance.examsTaken")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance Bar Chart */}
      {subjectData.length > 0 && (
        <Card className="bg-card border-border mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground">{t("performance.subjectPerformance")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number) => [`${value}%`, t("performance.average")]}
                    labelFormatter={(label: string, payload: Array<{ payload?: { fullSubject?: string } }>) => payload?.[0]?.payload?.fullSubject || label}
                  />
                  <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                    {subjectData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Progress Over Time Line Chart */}
        {timelineData.length > 1 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-foreground">{t("performance.progressOverTime")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                        color: "hsl(var(--foreground))",
                      }}
                      formatter={(value: number) => [`${value}%`, t("performance.score")]}
                      labelFormatter={(_, payload: Array<{ payload?: { title?: string } }>) => payload?.[0]?.payload?.title || ""}
                    />
                    <Line type="monotone" dataKey="percentage" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grade Distribution Pie Chart */}
        {gradeData.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-foreground">{t("performance.gradeDistribution")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gradeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name} (${value})`}
                    >
                      {gradeData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Exam Type Comparison Bar Chart */}
      {typeComparisonData.length > 1 && (
        <Card className="bg-card border-border mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              {t("performanceTrends.examTypeComparison")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={typeComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="type" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number) => [`${value}%`, t("performanceTrends.avgPercentage")]}
                />
                <Bar dataKey="average" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Subject Insights */}
      {subjectData.length > 1 && (
        <Card className="bg-card border-border mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              {t("performanceTrends.subjectInsights")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-success/5 border border-success/20 rounded-lg">
                <p className="text-xs text-muted-foreground">{t("performanceTrends.strongest")}</p>
                <p className="font-semibold text-success">
                  {subjectData.reduce((a, b) => a.percentage > b.percentage ? a : b).fullSubject}
                </p>
                <p className="text-sm text-muted-foreground">
                  {subjectData.reduce((a, b) => a.percentage > b.percentage ? a : b).percentage}%
                </p>
              </div>
              <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                <p className="text-xs text-muted-foreground">{t("performanceTrends.weakest")}</p>
                <p className="font-semibold text-destructive">
                  {subjectData.reduce((a, b) => a.percentage < b.percentage ? a : b).fullSubject}
                </p>
                <p className="text-sm text-muted-foreground">
                  {subjectData.reduce((a, b) => a.percentage < b.percentage ? a : b).percentage}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
