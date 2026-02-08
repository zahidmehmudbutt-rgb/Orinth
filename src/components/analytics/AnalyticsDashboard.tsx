import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  Award,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

interface AnalyticsDashboardProps {
  schoolId: string;
  role: "class_teacher" | "coordinator" | "principal";
  classId?: string;
}

interface AttendanceTrendData {
  date: string;
  attendance: number;
  present: number;
  absent: number;
}

interface MarksDistributionData {
  name: string;
  value: number;
}

interface SubjectPerformanceData {
  subject: string;
  average: number;
  students: number;
}

interface ClassComparisonData {
  class: string;
  attendance: number;
  marks: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function AnalyticsDashboard({ schoolId, role, classId }: AnalyticsDashboardProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [selectedClass, setSelectedClass] = useState(classId || "all");
  const [classes, setClasses] = useState<{ id: string; name: string; section: string | null }[]>([]);

  // Analytics data states
  const [marksDistribution, setMarksDistribution] = useState<MarksDistributionData[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformanceData[]>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrendData[]>([]);
  const [classComparison, setClassComparison] = useState<ClassComparisonData[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    avgAttendance: 0,
    avgMarks: 0,
    topPerformers: 0,
    attendanceTrend: 0,
    marksTrend: 0,
  });

  useEffect(() => {
    fetchClasses();
  }, [schoolId]);

  useEffect(() => {
    fetchAnalytics();
  }, [schoolId, timeRange, selectedClass]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, section")
        .eq("school_id", schoolId)
        .order("name");

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching classes:", error);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const days = parseInt(timeRange);
      const startDate = format(subDays(new Date(), days), "yyyy-MM-dd");
      const endDate = format(new Date(), "yyyy-MM-dd");

      // Build class filter
      let classFilter = selectedClass === "all" ? null : selectedClass;
      if (role === "class_teacher" && classId) {
        classFilter = classId;
      }

      // Fetch students count
      let studentsQuery = supabase
        .from("students")
        .select("id", { count: "exact" })
        .eq("school_id", schoolId);

      if (classFilter) {
        studentsQuery = studentsQuery.eq("class_id", classFilter);
      }

      const { count: totalStudents } = await studentsQuery;

      // Fetch attendance data
      let attendanceQuery = supabase
        .from("attendance")
        .select("date, is_present, class_id")
        .eq("school_id", schoolId)
        .gte("date", startDate)
        .lte("date", endDate);

      if (classFilter) {
        attendanceQuery = attendanceQuery.eq("class_id", classFilter);
      }

      const { data: attendanceRaw } = await attendanceQuery;

      // Calculate attendance statistics
      const attendanceByDate: Record<string, { present: number; total: number }> = {};
      (attendanceRaw || []).forEach((record) => {
        if (!attendanceByDate[record.date]) {
          attendanceByDate[record.date] = { present: 0, total: 0 };
        }
        attendanceByDate[record.date].total++;
        if (record.is_present) {
          attendanceByDate[record.date].present++;
        }
      });

      const attendanceTrendData = Object.entries(attendanceByDate)
        .map(([date, data]) => ({
          date: format(new Date(date), "MMM dd"),
          attendance: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
          present: data.present,
          absent: data.total - data.present,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-14); // Last 14 days

      setAttendanceTrend(attendanceTrendData);

      // Calculate overall attendance
      const totalAttendance = attendanceRaw?.length || 0;
      const presentCount = attendanceRaw?.filter((a) => a.is_present).length || 0;
      const avgAttendance = totalAttendance > 0
        ? Math.round((presentCount / totalAttendance) * 100)
        : 0;

      // Fetch marks data from exam system
      let examsQuery = supabase
        .from("student_exam_marks")
        .select(`
          marks_obtained,
          is_absent,
          exam_id,
          student_id,
          exam_results!inner(max_marks, subject, school_id, class_id)
        `)
        .eq("exam_results.school_id", schoolId);

      if (classFilter) {
        examsQuery = examsQuery.eq("exam_results.class_id", classFilter);
      }

      const { data: marksRawData } = await examsQuery;

      // Transform to expected format
      const marksRaw = (marksRawData || [])
        .filter(m => !m.is_absent && m.marks_obtained != null)
        .map(m => {
          const exam = m.exam_results as unknown as { max_marks: number; subject: string; class_id: string };
          return {
            marks_obtained: m.marks_obtained as number,
            total_marks: exam.max_marks,
            subject: exam.subject,
            student_id: m.student_id,
          };
        });

      // Calculate marks distribution
      const marksRanges = {
        "90-100%": 0,
        "80-89%": 0,
        "70-79%": 0,
        "60-69%": 0,
        "Below 60%": 0,
      };

      let totalMarksPercentage = 0;
      let marksCount = 0;
      let topPerformersCount = 0;

      (marksRaw || []).forEach((mark) => {
        if (mark.total_marks <= 0) return; // Skip invalid marks
        const percentage = (mark.marks_obtained / mark.total_marks) * 100;
        totalMarksPercentage += percentage;
        marksCount++;

        if (percentage >= 90) {
          marksRanges["90-100%"]++;
          topPerformersCount++;
        } else if (percentage >= 80) {
          marksRanges["80-89%"]++;
        } else if (percentage >= 70) {
          marksRanges["70-79%"]++;
        } else if (percentage >= 60) {
          marksRanges["60-69%"]++;
        } else {
          marksRanges["Below 60%"]++;
        }
      });

      const marksDistributionData = Object.entries(marksRanges).map(([name, value]) => ({
        name,
        value,
      }));

      setMarksDistribution(marksDistributionData);

      // Subject-wise performance
      const subjectMarks: Record<string, { total: number; obtained: number; count: number }> = {};
      (marksRaw || []).forEach((mark) => {
        if (mark.total_marks <= 0) return; // Skip invalid marks
        if (!subjectMarks[mark.subject]) {
          subjectMarks[mark.subject] = { total: 0, obtained: 0, count: 0 };
        }
        subjectMarks[mark.subject].total += mark.total_marks;
        subjectMarks[mark.subject].obtained += mark.marks_obtained;
        subjectMarks[mark.subject].count++;
      });

      const subjectPerformanceData = Object.entries(subjectMarks)
        .map(([subject, data]) => ({
          subject,
          average: data.total > 0 ? Math.round((data.obtained / data.total) * 100) : 0,
          students: data.count,
        }))
        .sort((a, b) => b.average - a.average)
        .slice(0, 8);

      setSubjectPerformance(subjectPerformanceData);

      // Class comparison (for coordinators and principals)
      if (role !== "class_teacher") {
        const { data: classesData } = await supabase
          .from("classes")
          .select("id, name, section")
          .eq("school_id", schoolId);

        const classComparisonData = await Promise.all(
          (classesData || []).slice(0, 6).map(async (cls) => {
            // Get attendance for this class
            const { data: classAttendance } = await supabase
              .from("attendance")
              .select("is_present")
              .eq("class_id", cls.id)
              .gte("date", startDate);

            const classPresent = classAttendance?.filter((a) => a.is_present).length || 0;
            const classTotal = classAttendance?.length || 1;

            // Get average marks for this class
            const { data: classMarksRaw } = await supabase
              .from("student_exam_marks")
              .select("marks_obtained, is_absent, exam_results!inner(max_marks, class_id)")
              .eq("exam_results.class_id", cls.id);

            let avgMarks = 0;
            if (classMarksRaw && classMarksRaw.length > 0) {
              const validMarks = classMarksRaw.filter(m =>
                !m.is_absent && m.marks_obtained != null
              );
              if (validMarks.length > 0) {
                const totalPct = validMarks.reduce(
                  (sum, m) => {
                    const exam = m.exam_results as unknown as { max_marks: number };
                    return sum + ((m.marks_obtained as number) / exam.max_marks) * 100;
                  },
                  0
                );
                avgMarks = Math.round(totalPct / validMarks.length);
              }
            }

            return {
              class: `${cls.name}${cls.section ? ` ${cls.section}` : ""}`,
              attendance: Math.round((classPresent / classTotal) * 100),
              marks: avgMarks,
            };
          })
        );

        setClassComparison(classComparisonData);
      }

      // Set summary stats
      setStats({
        totalStudents: totalStudents || 0,
        avgAttendance,
        avgMarks: marksCount > 0 ? Math.round(totalMarksPercentage / marksCount) : 0,
        topPerformers: topPerformersCount,
        attendanceTrend: attendanceTrendData.length >= 2
          ? attendanceTrendData[attendanceTrendData.length - 1].attendance -
            attendanceTrendData[0].attendance
          : 0,
        marksTrend: 0,
      });

    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    trend,
    icon: Icon,
    suffix = "",
  }: {
    title: string;
    value: number;
    trend?: number;
    icon: React.ComponentType<{ className?: string }>;
    suffix?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">
              {value}
              {suffix}
            </p>
            {trend !== undefined && trend !== 0 && (
              <div className={`flex items-center text-sm ${trend > 0 ? "text-success" : "text-destructive"}`}>
                {trend > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                {trend > 0 ? t("analyticsShared.trendUp", { value: Math.abs(trend) }) : t("analyticsShared.trendDown", { value: Math.abs(trend) })}
              </div>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-24 mb-2" />
                  <div className="h-8 bg-muted rounded w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("analyticsShared.timeRange")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">{t("analyticsShared.last7Days")}</SelectItem>
            <SelectItem value="30">{t("analyticsShared.last30Days")}</SelectItem>
            <SelectItem value="90">{t("analyticsShared.last3Months")}</SelectItem>
            <SelectItem value="365">{t("analyticsShared.lastYear")}</SelectItem>
          </SelectContent>
        </Select>

        {role !== "class_teacher" && (
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t("analyticsShared.selectClass")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("analyticsShared.allClasses")}</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} {cls.section}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("analyticsShared.totalStudents")}
          value={stats.totalStudents}
          icon={Users}
        />
        <StatCard
          title={t("analyticsShared.avgAttendance")}
          value={stats.avgAttendance}
          suffix="%"
          trend={stats.attendanceTrend}
          icon={Calendar}
        />
        <StatCard
          title={t("analyticsShared.avgMarks")}
          value={stats.avgMarks}
          suffix="%"
          icon={BookOpen}
        />
        <StatCard
          title={t("analyticsShared.topPerformers")}
          value={stats.topPerformers}
          icon={Award}
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {t("analyticsShared.attendanceTab")}
          </TabsTrigger>
          <TabsTrigger value="marks" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t("analyticsShared.marksAnalysis")}
          </TabsTrigger>
          {role !== "class_teacher" && (
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              {t("analyticsShared.classComparison")}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("analyticsShared.attendanceTrend")}</CardTitle>
                <CardDescription>{t("analyticsShared.attendanceTrendDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={attendanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="attendance"
                        stroke="#0088FE"
                        fill="#0088FE"
                        fillOpacity={0.3}
                        name={t("analyticsShared.attendancePercent")}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("analyticsShared.presentVsAbsent")}</CardTitle>
                <CardDescription>{t("analyticsShared.presentVsAbsentDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" fill="#00C49F" name={t("analyticsShared.present")} stackId="a" />
                      <Bar dataKey="absent" fill="#FF8042" name={t("analyticsShared.absent")} stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Marks Analysis Tab */}
        <TabsContent value="marks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("analyticsShared.marksDistribution")}</CardTitle>
                <CardDescription>{t("analyticsShared.marksDistributionDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={marksDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {marksDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("analyticsShared.subjectPerformance")}</CardTitle>
                <CardDescription>{t("analyticsShared.subjectPerformanceDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectPerformance} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <YAxis dataKey="subject" type="category" tick={{ fontSize: 12 }} width={80} />
                      <Tooltip />
                      <Bar dataKey="average" fill="#8884d8" name={t("analyticsShared.averagePercent")} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Class Comparison Tab */}
        {role !== "class_teacher" && (
          <TabsContent value="comparison" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("analyticsShared.classPerformance")}</CardTitle>
                <CardDescription>{t("analyticsShared.classPerformanceDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="class" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="attendance" fill="#0088FE" name={t("analyticsShared.attendancePercent")} />
                      <Bar dataKey="marks" fill="#00C49F" name={t("analyticsShared.avgMarksPercent")} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
