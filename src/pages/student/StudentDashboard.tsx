import { Helmet } from "react-helmet-async";
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, LogOut, BookOpen, Calendar, BarChart3, Megaphone, Clock, Upload, CheckCircle, AlertCircle, Settings, Sparkles, FileText, Download, Award, Printer, CalendarDays, RefreshCw } from "lucide-react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { GroupChat } from "@/components/chat";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { FadeInView, StaggerContainer, StaggerItem, HoverScale } from "@/components/ui/motion-wrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import AccountSettings from "@/components/account/AccountSettings";
import { WelcomeBanner } from "@/components/onboarding/WelcomeBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSkeleton } from "@/components/ui/skeleton-loader";
import { MobileNav } from "@/components/ui/mobile-nav";
import { SwipeableTabContent } from "@/components/ui/swipeable-tabs";
import { HomeworkCalendar } from "@/components/ui/homework-calendar";
import { SmartHeader } from "@/components/ui/smart-header";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { MobileResultCards } from "@/components/ui/mobile-result-card";
import { useTour } from "@/hooks/useTour";
import { TourHelpButton } from "@/components/onboarding/TourHelpButton";
import { getStudentTourSteps } from "@/components/onboarding/tour-configs";
import type { ExamType, ExamResult } from "@/types/exam";
import { EXAM_TYPE_LABELS } from "@/types/exam";
import { getExamTypeBadgeColor } from "@/utils/exam";
import { calculateGrade, getGradeColors, calculatePercentage, formatPercentage, calculateResultTotals, GRADING_SCALE } from "@/utils/grades";
import { PerformanceTrends } from "@/components/performance/PerformanceTrends";
import { Leaderboard } from "@/components/leaderboard/Leaderboard";
import { getDateLocale } from "@/lib/utils/date-locale";
import { exportToPDF } from "@/lib/utils/pdf-export";

interface StudentData {
  id: string;
  studentId: string;
  name: string;
  className: string;
  classId: string;
}

interface Subject {
  name: string;
  code: string;
  teacher: string;
  pending: number;
}

interface Homework {
  id: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  dueDateRaw: string; // YYYY-MM-DD format for calendar
  status: "pending" | "submitted" | "graded";
  marks?: number;
  remarks?: string;
  fileUrl?: string;
  fileName?: string;
}

interface AttendanceRecord {
  date: string;
  day: string;
  status: "present" | "absent";
}

interface Mark {
  subject: string;
  title: string;
  marks: number;
  maxMarks: number;
  remarks?: string;
}

interface Notice {
  id: string;
  title: string;
  date: string;
  content: string;
}

// Types imported from @/types/exam

const StudentDashboard = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("homework");
  const [homeworkView, setHomeworkView] = useState<"list" | "calendar">("list");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [attendanceData, setAttendanceData] = useState({ present: 0, absent: 0, percentage: 0 });
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const navigate = useNavigate();
  const { toast } = useToast();
  const tourSteps = useMemo(() => getStudentTourSteps(), []);
  const { startTour, hasCompletedTour } = useTour("student", tourSteps);
  const dateLocale = getDateLocale();

  useEffect(() => {
    fetchStudentData();
  }, []);

  useEffect(() => {
    if (!loading && !hasCompletedTour) {
      const timer = setTimeout(() => startTour(), 800);
      return () => clearTimeout(timer);
    }
  }, [loading, hasCompletedTour, startTour]);

  const fetchStudentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/student/login");
        return;
      }

      // Get student record
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select(`
          id,
          student_id,
          full_name,
          class_id,
          classes (
            id,
            name,
            section
          )
        `)
        .eq("user_id", user.id)
        .single();

      if (studentError || !student) {
        if (import.meta.env.DEV) console.error("Error fetching student:", studentError);
        return;
      }

      const classInfo = student.classes as { id: string; name: string; section: string } | null;

      setStudentData({
        id: student.id,
        studentId: student.student_id,
        name: student.full_name,
        className: classInfo ? `${classInfo.name}-${classInfo.section}` : t("studentDashboard.notAssigned"),
        classId: student.class_id,
      });

      // Fetch all data in parallel
      await Promise.all([
        fetchSubjectsAndHomework(student.class_id, student.id),
        fetchAttendance(student.id),
        fetchNotices(student.class_id),
        fetchExamResults(student.id, student.class_id),
      ]);

    } catch (error) {
      if (import.meta.env.DEV) console.error("Error:", error);
      toast({
        variant: "destructive",
        title: t("studentDashboard.error"),
        description: t("studentDashboard.dashboardError"),
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectsAndHomework = async (classId: string, studentId: string) => {
    // Get teacher classes - fetch without FK join
    const { data: teacherClasses } = await supabase
      .from("teacher_classes")
      .select("subject, teacher_id")
      .eq("class_id", classId);

    // Get teacher names separately
    const teacherIds = [...new Set((teacherClasses || []).map(tc => tc.teacher_id))];
    const { data: teacherProfiles } = teacherIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", teacherIds)
      : { data: [] };
    const teacherMap = new Map((teacherProfiles || []).map(p => [p.id, p.full_name]));

    // Get homework for this class - fetch without FK join
    const { data: homeworkData } = await supabase
      .from("homework")
      .select("id, title, description, subject, due_date, teacher_id")
      .eq("class_id", classId)
      .order("due_date", { ascending: true });

    // Get student's submissions
    const { data: submissions } = await supabase
      .from("homework_submissions")
      .select("homework_id, submitted_at, marks, remarks, file_url, file_name")
      .eq("student_id", studentId);

    const submissionMap = new Map(
      submissions?.map(s => [s.homework_id, s]) || []
    );

    // Build subjects with pending count
    const subjectMap = new Map<string, Subject>();
    teacherClasses?.forEach(tc => {
      const teacherName = teacherMap.get(tc.teacher_id) || "Unknown";
      if (!subjectMap.has(tc.subject)) {
        subjectMap.set(tc.subject, {
          name: tc.subject,
          code: tc.subject.substring(0, 3).toUpperCase(),
          teacher: teacherName,
          pending: 0,
        });
      }
    });

    // Process homework
    const processedHomework: Homework[] = [];
    const marksData: Mark[] = [];

    homeworkData?.forEach(hw => {
      const submission = submissionMap.get(hw.id);
      const isPastDue = new Date(hw.due_date) < new Date();

      let status: "pending" | "submitted" | "graded" = "pending";
      if (submission?.marks !== null && submission?.marks !== undefined) {
        status = "graded";
      } else if (submission?.submitted_at) {
        status = "submitted";
      }

      processedHomework.push({
        id: hw.id,
        subject: hw.subject,
        title: hw.title,
        description: hw.description || "",
        dueDate: new Date(hw.due_date).toLocaleDateString(dateLocale, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        dueDateRaw: hw.due_date.split('T')[0], // YYYY-MM-DD format for calendar
        status,
        marks: submission?.marks,
        remarks: submission?.remarks,
        fileUrl: submission?.file_url || undefined,
        fileName: submission?.file_name || undefined,
      });

      // Update pending count
      if (status === "pending" && !isPastDue) {
        const subject = subjectMap.get(hw.subject);
        if (subject) {
          subject.pending++;
        }
      }

      // Add to marks if graded
      if (status === "graded" && submission?.marks !== undefined) {
        marksData.push({
          subject: hw.subject,
          title: hw.title,
          marks: submission.marks,
          maxMarks: 10,
          remarks: submission.remarks,
        });
      }
    });

    setSubjects(Array.from(subjectMap.values()));
    setHomeworks(processedHomework);
    setMarks(marksData);
  };

  const fetchAttendance = async (studentId: string) => {
    const { data: attendanceRecords } = await supabase
      .from("attendance")
      .select("date, is_present")
      .eq("student_id", studentId)
      .order("date", { ascending: false })
      .limit(30);

    if (attendanceRecords && attendanceRecords.length > 0) {
      const present = attendanceRecords.filter(r => r.is_present).length;
      const absent = attendanceRecords.filter(r => !r.is_present).length;
      const total = present + absent;

      setAttendanceData({
        present,
        absent,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      });

      setRecentAttendance(
        attendanceRecords.slice(0, 14).map(r => ({
          date: new Date(r.date).toLocaleDateString(dateLocale, {
            month: "short",
            day: "numeric",
          }),
          day: new Date(r.date).toLocaleDateString(dateLocale, { weekday: "long" }),
          status: r.is_present ? "present" : "absent",
        }))
      );
    }
  };

  const fetchNotices = async (classId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get student's school_id
    const { data: student } = await supabase
      .from("students")
      .select("school_id")
      .eq("user_id", user.id)
      .single();

    if (!student) return;

    const { data: noticesData } = await supabase
      .from("notices")
      .select("id, title, content, created_at")
      .eq("school_id", student.school_id)
      .or(`target_class_id.is.null,target_class_id.eq.${classId}`)
      .or("target_role.is.null,target_role.eq.student")
      .order("created_at", { ascending: false })
      .limit(10);

    if (noticesData) {
      setNotices(
        noticesData.map(n => ({
          id: n.id,
          title: n.title,
          content: n.content,
          date: new Date(n.created_at).toLocaleDateString(dateLocale, {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        }))
      );
    }
  };

  const fetchExamResults = async (studentId: string, classId: string) => {
    try {
      // Get all exams for this class
      const { data: examsData, error: examsError } = await supabase
        .from("exam_results")
        .select("id, title, subject, exam_type, max_marks, exam_date")
        .eq("class_id", classId)
        .order("exam_date", { ascending: false });

      if (examsError) {
        if (import.meta.env.DEV) console.error("Error fetching exams:", examsError);
        toast({
          variant: "destructive",
          title: t("studentDashboard.error"),
          description: t("studentDashboard.examLoadError"),
        });
        return;
      }

      if (!examsData || examsData.length === 0) {
        setExamResults([]);
        return;
      }

      // Get student's marks for these exams
      const examIds = examsData.map(e => e.id);
      const { data: marksData, error: marksError } = await supabase
        .from("student_exam_marks")
        .select("id, exam_id, marks_obtained, remarks, is_absent")
        .eq("student_id", studentId)
        .in("exam_id", examIds);

      if (marksError) {
        if (import.meta.env.DEV) console.error("Error fetching marks:", marksError);
      }

      const marksMap = new Map(
        marksData?.map(m => [m.exam_id, m]) || []
      );

      const results: ExamResult[] = examsData.map(exam => {
        const mark = marksMap.get(exam.id);
        return {
          id: mark?.id || exam.id,
          examId: exam.id,
          title: exam.title,
          subject: exam.subject,
          examType: exam.exam_type as ExamType,
          examDate: new Date(exam.exam_date).toLocaleDateString(dateLocale, {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          marksObtained: mark?.marks_obtained ?? null,
          maxMarks: exam.max_marks,
          remarks: mark?.remarks || null,
          isAbsent: mark?.is_absent || false,
        };
      });

      setExamResults(results);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching exam results:", error);
      toast({
        variant: "destructive",
        title: t("studentDashboard.error"),
        description: t("studentDashboard.examProcessError"),
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleFileSelect = (homeworkId: string) => {
    const input = fileInputRefs.current[homeworkId];
    if (input) {
      input.click();
    }
  };

  const handleUpload = async (homeworkId: string, file: File) => {
    if (!studentData) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/gif", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: t("studentDashboard.fileTooLarge"),
        description: t("studentDashboard.fileTooLargeDesc"),
      });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: t("studentDashboard.invalidFileType"),
        description: t("studentDashboard.invalidFileTypeDesc"),
      });
      return;
    }

    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".doc", ".docx"];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!allowedExtensions.includes(fileExtension)) {
      toast({
        variant: "destructive",
        title: t("studentDashboard.invalidFileType"),
        description: "Only JPG, PNG, GIF, WebP, PDF, DOC, and DOCX files are allowed.",
      });
      return;
    }

    setUploadingId(homeworkId);

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${homeworkId}_${Date.now()}.${fileExt}`;
      const filePath = `${studentData.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("homework-files")
        .upload(filePath, file);

      if (uploadError) {
        if (import.meta.env.DEV) console.error("Upload error:", uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("homework-files")
        .getPublicUrl(filePath);

      // Check if submission exists
      const { data: existingSubmissions } = await supabase
        .from("homework_submissions")
        .select("id")
        .eq("homework_id", homeworkId)
        .eq("student_id", studentData.id)
        .limit(1);

      const existingSubmission = existingSubmissions?.[0] || null;

      if (existingSubmission) {
        // Update existing submission
        const { error: updateError } = await supabase
          .from("homework_submissions")
          .update({
            file_url: urlData.publicUrl,
            file_name: file.name,
            submitted_at: new Date().toISOString(),
          })
          .eq("id", existingSubmission.id);

        if (updateError) throw updateError;
      } else {
        // Create new submission
        const { error: insertError } = await supabase
          .from("homework_submissions")
          .insert({
            homework_id: homeworkId,
            student_id: studentData.id,
            file_url: urlData.publicUrl,
            file_name: file.name,
            submitted_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }

      toast({
        title: t("studentDashboard.homeworkSubmitted"),
        description: t("studentDashboard.homeworkSubmittedDesc"),
      });

      // Refresh homework list
      await fetchSubjectsAndHomework(studentData.classId, studentData.id);

    } catch (error) {
      if (import.meta.env.DEV) console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: t("studentDashboard.uploadFailed"),
        description: t("studentDashboard.uploadFailedDesc"),
      });
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) {
    return <DashboardSkeleton roleColor="bg-gradient-primary" />;
  }

  const hasSubjects = subjects.length > 0;
  const hasHomework = homeworks.length > 0;
  const hasAttendance = recentAttendance.length > 0;
  const hasMarks = marks.length > 0;
  const hasExamResults = examResults.length > 0;
  const hasNotices = notices.length > 0;
  const pendingHomework = homeworks.filter(h => h.status === "pending");

  // Filter exam results for yearly results tab (only monthly and semester exams)
  const yearlyResults = examResults.filter(
    e => e.examType === 'monthly_midterm' || e.examType === 'semester_final'
  );
  const hasYearlyResults = yearlyResults.length > 0;

  // Group exam results by type
  const semesterResults = examResults.filter(e => e.examType === 'semester_final');
  const monthlyResults = examResults.filter(e => e.examType === 'monthly_midterm');
  const weeklyResults = examResults.filter(e => e.examType === 'weekly_daily');

  // getExamTypeBadgeColor imported from @/utils/exam

  // FAB quick actions for student
  const fabActions = [
    {
      id: "refresh",
      label: t("studentDashboard.refreshData"),
      icon: RefreshCw,
      onClick: () => fetchStudentData(),
      color: "bg-blue-500 text-white",
    },
    {
      id: "homework",
      label: t("studentDashboard.viewHomework"),
      icon: BookOpen,
      onClick: () => setActiveTab("homework"),
      color: "bg-amber-500 text-white",
    },
    {
      id: "attendance",
      label: t("studentDashboard.checkAttendance"),
      icon: Calendar,
      onClick: () => setActiveTab("attendance"),
      color: "bg-green-500 text-white",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Helmet><title>Student Dashboard — School Smart Pakistan</title></Helmet>
      {/* Smart Header - hides on scroll down */}
      <SmartHeader className="bg-gradient-primary text-primary-foreground" data-tour="student-header">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{t("studentDashboard.title")}</h1>
              <p className="text-xs opacity-80 truncate max-w-[150px] sm:max-w-none">{t("studentDashboard.welcome")}, {studentData?.name}!</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline text-sm opacity-80">{studentData?.className}</span>
            <LanguageToggle className="text-primary-foreground hover:bg-primary-foreground/20" />
            <ThemeToggle className="text-primary-foreground hover:bg-primary-foreground/20" data-tour="student-theme-toggle" />
            <span data-tour="student-chat"><GroupChat triggerClassName="text-primary-foreground hover:bg-primary-foreground/20" /></span>
            <span data-tour="student-notifications"><NotificationCenter className="text-primary-foreground hover:bg-primary-foreground/20" /></span>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </SmartHeader>

      {/* Main Content */}
      <motion.main
        id="main-content"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="container mx-auto px-4 py-6 pb-24 md:pb-6">
        {/* Welcome Banner for new students */}
        {!hasSubjects && (
          <WelcomeBanner
            icon={Sparkles}
            title={t("studentDashboard.welcomeTitle")}
            description={t("studentDashboard.welcomeDesc")}
            tips={[
              t("studentDashboard.welcomeTip1"),
              t("studentDashboard.welcomeTip2"),
              t("studentDashboard.welcomeTip3"),
            ]}
            accentColor="bg-primary"
            storageKey="student-welcome-dismissed"
            className="mb-6"
          />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop tabs - hidden on mobile where MobileNav handles navigation */}
          <TabsList className="hidden md:grid w-full max-w-2xl mx-auto grid-cols-6 mb-8 bg-card shadow-card" data-tour="student-tabs">
            <TabsTrigger value="homework" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BookOpen className="w-4 h-4" />
              {t("studentDashboard.tabs.homework")}
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="w-4 h-4" />
              {t("studentDashboard.tabs.attendance")}
            </TabsTrigger>
            <TabsTrigger value="marks" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="w-4 h-4" />
              {t("studentDashboard.tabs.marks")}
            </TabsTrigger>
            <TabsTrigger value="yearly" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Award className="w-4 h-4" />
              {t("studentDashboard.tabs.yearly")}
            </TabsTrigger>
            <TabsTrigger value="notices" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Megaphone className="w-4 h-4" />
              {t("studentDashboard.tabs.notices")}
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="w-4 h-4" />
              {t("studentDashboard.tabs.account")}
            </TabsTrigger>
          </TabsList>

          {/* Mobile: Account tab button (not in bottom MobileNav) */}
          <div className="flex md:hidden mb-6">
            <button
              onClick={() => setActiveTab("account")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "account" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border"
              }`}
            >
              <Settings className="w-4 h-4" />
              {t("common.accountSettings")}
            </button>
          </div>

          <SwipeableTabContent activeTab={activeTab} tabOrder={["homework", "attendance", "marks", "yearly", "notices", "account"]} onTabChange={setActiveTab}>
          {/* Homework Tab */}
          <TabsContent value="homework" className="animate-fade-in">
            {!hasSubjects ? (
              <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                <EmptyState
                  icon={BookOpen}
                  title={t("studentDashboard.noSubjectsTitle")}
                  description={t("studentDashboard.noSubjectsDesc")}
                />
              </div>
            ) : (
              <>
                <FadeInView className="mb-6">
                  <h2 className="text-xl font-bold text-foreground mb-2">{t("studentDashboard.yourSubjects")}</h2>
                  <p className="text-muted-foreground text-sm">{t("studentDashboard.subjectsEnrolled", { count: subjects.length })}</p>
                </FadeInView>

                <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {subjects.map((subject) => (
                    <StaggerItem key={subject.code}>
                      <HoverScale>
                        <div className="bg-card rounded-xl p-5 shadow-card border border-border h-full">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-foreground">{subject.name}</h3>
                              <p className="text-xs text-muted-foreground">{subject.code}</p>
                            </div>
                            <BookOpen className="w-5 h-5 text-primary" />
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{t("studentDashboard.teacherLabel", { name: subject.teacher })}</p>
                          {subject.pending > 0 ? (
                            <div className="bg-warning/10 text-warning px-3 py-1.5 rounded-lg text-sm font-medium">
                              {t("studentDashboard.homeworkPending", { count: subject.pending })}
                            </div>
                          ) : (
                            <div className="bg-success/10 text-success px-3 py-1.5 rounded-lg text-sm font-medium">
                              {t("studentDashboard.allCaughtUp")}
                            </div>
                          )}
                        </div>
                      </HoverScale>
                    </StaggerItem>
                  ))}
                </StaggerContainer>

                <FadeInView className="mb-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      {t("studentDashboard.allHomework", { count: homeworks.length })}
                    </h2>
                    <div className="flex gap-2" data-tour="student-view-toggle">
                      <Button
                        variant={homeworkView === "list" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHomeworkView("list")}
                        className={homeworkView === "list" ? "bg-primary" : ""}
                      >
                        <BookOpen className="w-4 h-4 mr-1" />
                        {t("studentDashboard.list")}
                      </Button>
                      <Button
                        variant={homeworkView === "calendar" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHomeworkView("calendar")}
                        className={homeworkView === "calendar" ? "bg-primary" : ""}
                      >
                        <CalendarDays className="w-4 h-4 mr-1" />
                        {t("studentDashboard.calendar")}
                      </Button>
                    </div>
                  </div>
                </FadeInView>

                {homeworkView === "calendar" ? (
                  <HomeworkCalendar
                    homework={homeworks.map(hw => ({
                      id: hw.id,
                      title: hw.title,
                      subject: hw.subject,
                      dueDate: hw.dueDateRaw,
                      status: hw.status,
                    }))}
                    onSelectHomework={(hw) => {
                      const homework = homeworks.find(h => h.id === hw.id);
                      if (homework && homework.status === "pending") {
                        handleFileSelect(hw.id);
                      }
                    }}
                  />
                ) : hasHomework ? (
                  <StaggerContainer className="grid sm:grid-cols-2 gap-4">
                    {homeworks.map((hw) => (
                      <StaggerItem key={hw.id}>
                        <div className="bg-card rounded-xl p-5 shadow-card border border-border h-full">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground">{hw.title}</h3>
                            <p className="text-sm text-muted-foreground">{hw.subject}</p>
                          </div>
                          {hw.status === "graded" ? (
                            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-lg text-xs font-medium">
                              <BarChart3 className="w-3 h-3" /> {hw.marks}/10
                            </span>
                          ) : hw.status === "submitted" ? (
                            <span className="inline-flex items-center gap-1 bg-success/10 text-success px-2 py-1 rounded-lg text-xs font-medium">
                              <CheckCircle className="w-3 h-3" /> {t("studentDashboard.submitted")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-warning/10 text-warning px-2 py-1 rounded-lg text-xs font-medium">
                              <AlertCircle className="w-3 h-3" /> {t("studentDashboard.pending")}
                            </span>
                          )}
                        </div>

                        {hw.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{hw.description}</p>
                        )}

                        <p className="text-sm text-muted-foreground mb-4">{t("studentDashboard.due", { date: hw.dueDate })}</p>

                        {hw.remarks && (
                          <p className="text-sm text-primary mb-3 italic">"{hw.remarks}"</p>
                        )}

                        {hw.fileName && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <FileText className="w-4 h-4" />
                            <span className="truncate">{hw.fileName}</span>
                          </div>
                        )}

                        {hw.status === "pending" && (
                          <>
                            <input
                              type="file"
                              ref={(el) => (fileInputRefs.current[hw.id] = el)}
                              className="hidden"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUpload(hw.id, file);
                              }}
                            />
                            <LoadingButton
                              className="w-full bg-gradient-primary text-primary-foreground shadow-button"
                              onClick={() => handleFileSelect(hw.id)}
                              loading={uploadingId === hw.id}
                              loadingText={t("studentDashboard.uploading")}
                              data-tour="student-upload-btn"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              {t("studentDashboard.uploadAnswer")}
                            </LoadingButton>
                          </>
                        )}
                      </div>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                ) : (
                  <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                    <EmptyState
                      icon={CheckCircle}
                      title={t("studentDashboard.noHomeworkTitle")}
                      description={t("studentDashboard.noHomeworkDesc")}
                    />
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="animate-fade-in">
            {!hasAttendance ? (
              <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                <EmptyState
                  icon={Calendar}
                  title={t("studentDashboard.noAttendanceTitle")}
                  description={t("studentDashboard.noAttendanceDesc")}
                />
              </div>
            ) : (
              <>
                <div className="bg-card rounded-xl p-6 shadow-card border border-border mb-8">
                  <h2 className="text-xl font-bold text-foreground mb-6">{t("studentDashboard.attendanceOverview")}</h2>
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="hsl(var(--destructive) / 0.2)"
                          strokeWidth="12"
                          fill="none"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="hsl(var(--primary))"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${attendanceData.percentage * 2.51} 251`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl sm:text-3xl font-bold text-primary">{attendanceData.percentage}%</span>
                        <span className="text-xs text-muted-foreground">{t("studentDashboard.attendanceLabel")}</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 bg-primary rounded-full"></span>
                          <span className="text-foreground">{t("studentDashboard.present")}</span>
                        </div>
                        <span className="font-semibold text-foreground">{t("studentDashboard.daysCount", { count: attendanceData.present })}</span>
                      </div>
                      <Progress value={(attendanceData.present / (attendanceData.present + attendanceData.absent)) * 100} className="h-2" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 bg-destructive rounded-full"></span>
                          <span className="text-foreground">{t("studentDashboard.absent")}</span>
                        </div>
                        <span className="font-semibold text-foreground">{t("studentDashboard.daysCount", { count: attendanceData.absent })}</span>
                      </div>
                      <Progress value={(attendanceData.absent / (attendanceData.present + attendanceData.absent)) * 100} className="h-2 [&>div]:bg-destructive" />
                    </div>
                  </div>
                </div>

                <FadeInView>
                  <h2 className="text-xl font-bold text-foreground mb-4">{t("studentDashboard.dailyRecord")}</h2>
                </FadeInView>
                <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentAttendance.map((record, index) => (
                    <StaggerItem key={index}>
                      <div
                        className={`bg-card rounded-xl p-4 shadow-card border border-border flex items-center justify-between ${
                          record.status === "absent" ? "border-destructive/30" : ""
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-foreground">{record.day}</p>
                          <p className="text-sm text-muted-foreground">{record.date}</p>
                        </div>
                        <span
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                            record.status === "present"
                              ? "bg-success text-success-foreground"
                              : "bg-destructive text-destructive-foreground"
                          }`}
                        >
                          {record.status === "present" ? t("studentDashboard.present") : t("studentDashboard.absent")}
                        </span>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </>
            )}
          </TabsContent>

          {/* Marks Tab */}
          <TabsContent value="marks" className="animate-fade-in">
            {!hasMarks && !hasExamResults ? (
              <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                <EmptyState
                  icon={BarChart3}
                  title={t("studentDashboard.noMarksTitle")}
                  description={t("studentDashboard.noMarksDesc")}
                />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Performance Trends Charts */}
                <PerformanceTrends
                  examResults={examResults}
                  attendanceData={attendanceData}
                  className="mb-4"
                />

                {/* Class Leaderboard */}
                <Leaderboard
                  classId={studentData?.classId || ""}
                  currentStudentId={studentData?.studentId}
                  className="mb-4 bg-card border-border"
                />

                {/* Homework Marks Section */}
                {hasMarks && (
                  <>
                    <FadeInView className="mb-6">
                      <h2 className="text-xl font-bold text-foreground mb-2">{t("studentDashboard.homeworkMarks")}</h2>
                      <p className="text-muted-foreground text-sm">{t("studentDashboard.homeworkMarksDesc")}</p>
                    </FadeInView>

                    <StaggerContainer className="grid sm:grid-cols-2 gap-4">
                      {marks.map((mark, index) => (
                        <StaggerItem key={index}>
                          <div className="bg-card rounded-xl p-5 shadow-card border border-border h-full">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold text-foreground">{mark.title}</h3>
                              <p className="text-sm text-muted-foreground">{mark.subject}</p>
                            </div>
                            <BarChart3 className="w-5 h-5 text-primary" />
                          </div>
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">{t("studentDashboard.score")}</span>
                              <span className="font-semibold text-primary">{mark.marks}/{mark.maxMarks}</span>
                            </div>
                            <Progress value={(mark.marks / mark.maxMarks) * 100} className="h-3" />
                          </div>
                          {mark.remarks && (
                            <p className="text-sm text-muted-foreground italic">"{mark.remarks}"</p>
                          )}
                        </div>
                        </StaggerItem>
                      ))}
                    </StaggerContainer>
                  </>
                )}

                {/* Exam Results Section */}
                {hasExamResults && (
                  <>
                    <FadeInView className="mb-6">
                      <h2 className="text-xl font-bold text-foreground mb-2">{t("studentDashboard.examResults")}</h2>
                      <p className="text-muted-foreground text-sm">{t("studentDashboard.examResultsDesc")}</p>
                    </FadeInView>

                    <StaggerContainer className="grid sm:grid-cols-2 gap-4">
                      {examResults.map((result) => (
                        <StaggerItem key={result.id}>
                          <div className="bg-card rounded-xl p-5 shadow-card border border-border h-full">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-foreground">{result.title}</h3>
                              <p className="text-sm text-muted-foreground">{result.subject}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${getExamTypeBadgeColor(result.examType)}`}>
                              {result.examType === 'weekly_daily' ? t("studentDashboard.weekly") : result.examType === 'monthly_midterm' ? t("studentDashboard.monthly") : t("studentDashboard.semester")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">{result.examDate}</p>
                          {result.isAbsent ? (
                            <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-lg text-sm">
                              {t("studentDashboard.absent")}
                            </div>
                          ) : result.marksObtained !== null ? (
                            <>
                              <div className="mb-3">
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-muted-foreground">{t("studentDashboard.score")}</span>
                                  <span className="font-semibold text-primary">{result.marksObtained}/{result.maxMarks}</span>
                                </div>
                                <Progress value={(result.marksObtained / result.maxMarks) * 100} className="h-3" />
                              </div>
                              {result.remarks && (
                                <p className="text-sm text-muted-foreground italic">"{result.remarks}"</p>
                              )}
                            </>
                          ) : (
                            <div className="bg-muted/50 text-muted-foreground px-3 py-2 rounded-lg text-sm">
                              {t("studentDashboard.notYetGraded")}
                            </div>
                          )}
                        </div>
                        </StaggerItem>
                      ))}
                    </StaggerContainer>
                  </>
                )}
              </div>
            )}
          </TabsContent>

          {/* Yearly Results Tab */}
          <TabsContent value="yearly" className="animate-fade-in">
            {!hasYearlyResults ? (
              <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                <EmptyState
                  icon={Award}
                  title={t("studentDashboard.noYearlyTitle")}
                  description={t("studentDashboard.noYearlyDesc")}
                />
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                {/* Print Button */}
                <div className="flex justify-end gap-2 mb-4 print:hidden">
                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                    className="gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    {t("studentDashboard.printResultCard")}
                  </Button>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => exportToPDF("result-card-content", `Result-Card-${studentData?.name || "Student"}`)}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {t("studentDashboard.downloadPDF")}
                  </Button>
                </div>
                {/* Mobile Result Cards (shown only on mobile) */}
                <div className="md:hidden space-y-4 print:hidden">
                  {semesterResults.length > 0 && (() => {
                    const graded = semesterResults.filter(r => r.marksObtained !== null && !r.isAbsent);
                    const totalObtained = graded.reduce((sum, r) => sum + (r.marksObtained || 0), 0);
                    const totalMax = graded.reduce((sum, r) => sum + r.maxMarks, 0);
                    const overallPct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
                    const overallGrade = overallPct >= 90 ? 'A+' : overallPct >= 80 ? 'A' : overallPct >= 70 ? 'B' : overallPct >= 60 ? 'C' : overallPct >= 50 ? 'D' : 'F';
                    return (
                      <MobileResultCards
                        type="semester"
                        results={semesterResults.map(r => {
                          const pct = r.marksObtained !== null ? (r.marksObtained / r.maxMarks) * 100 : null;
                          const grade = r.isAbsent ? 'Absent' : pct === null ? '-' : pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';
                          return { subject: r.subject, examTitle: r.title, maxMarks: r.maxMarks, obtainedMarks: r.marksObtained, percentage: pct, grade, isAbsent: r.isAbsent };
                        })}
                        totalObtained={totalObtained}
                        totalMax={totalMax}
                        overallPercentage={overallPct}
                        overallGrade={overallGrade}
                      />
                    );
                  })()}
                  {monthlyResults.length > 0 && (() => {
                    const graded = monthlyResults.filter(r => r.marksObtained !== null && !r.isAbsent);
                    const totalObtained = graded.reduce((sum, r) => sum + (r.marksObtained || 0), 0);
                    const totalMax = graded.reduce((sum, r) => sum + r.maxMarks, 0);
                    const overallPct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
                    const overallGrade = overallPct >= 90 ? 'A+' : overallPct >= 80 ? 'A' : overallPct >= 70 ? 'B' : overallPct >= 60 ? 'C' : overallPct >= 50 ? 'D' : 'F';
                    return (
                      <MobileResultCards
                        type="monthly"
                        results={monthlyResults.map(r => {
                          const pct = r.marksObtained !== null ? (r.marksObtained / r.maxMarks) * 100 : null;
                          const grade = r.isAbsent ? 'Absent' : pct === null ? '-' : pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';
                          return { subject: r.subject, examTitle: r.title, maxMarks: r.maxMarks, obtainedMarks: r.marksObtained, percentage: pct, grade, isAbsent: r.isAbsent };
                        })}
                        totalObtained={totalObtained}
                        totalMax={totalMax}
                        overallPercentage={overallPct}
                        overallGrade={overallGrade}
                      />
                    );
                  })()}
                </div>

                {/* Result Card / Certificate (hidden on mobile, visible for print) */}
                <div id="result-card-content" className="hidden md:block print:!block bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg shadow-xl border-4 border-double border-slate-300 overflow-hidden print:shadow-none print:border-2">
                  {/* Certificate Header */}
                  <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 text-white px-4 sm:px-8 py-5 sm:py-6 text-center relative">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10">
                      <div className="absolute top-2 left-2 w-12 sm:w-16 h-12 sm:h-16 border-2 border-white rounded-full"></div>
                      <div className="absolute top-2 right-2 w-12 sm:w-16 h-12 sm:h-16 border-2 border-white rounded-full"></div>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-16 sm:h-20 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="relative">
                      <div className="flex justify-center mb-3">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30">
                          <Award className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300" />
                        </div>
                      </div>
                      <h1 className="text-lg sm:text-2xl font-serif font-bold tracking-wide">{t("studentDashboard.academicResultCard")}</h1>
                      <p className="text-indigo-200 text-xs sm:text-sm mt-1">{t("studentDashboard.officialRecord")}</p>
                    </div>
                  </div>

                  {/* Student Info Section */}
                  <div className="px-4 sm:px-8 py-4 sm:py-6 border-b-2 border-dashed border-slate-300 bg-white/50">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">{t("studentDashboard.studentName")}</p>
                        <p className="font-semibold text-slate-800 text-sm sm:text-lg">{studentData?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">{t("studentDashboard.class")}</p>
                        <p className="font-semibold text-slate-800 text-sm sm:text-lg">{studentData?.className}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">{t("studentDashboard.studentId")}</p>
                        <p className="font-mono text-slate-700 text-sm">{studentData?.studentId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">{t("studentDashboard.academicYear")}</p>
                        <p className="font-mono text-slate-700 text-sm">{new Date().getFullYear()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Semester / Final Exams Section */}
                  {semesterResults.length > 0 && (
                    <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-200">
                      <div className="flex items-center gap-2 sm:gap-3 mb-4">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <h2 className="text-sm sm:text-lg font-bold text-slate-800 uppercase tracking-wide">{t("studentDashboard.semesterExams")}</h2>
                      </div>

                      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
                        <table className="w-full min-w-[560px]">
                          <thead>
                            <tr className="bg-purple-50 border-b border-purple-100">
                              <th className="text-left py-2.5 px-3 sm:py-3 sm:px-4 text-xs font-semibold text-purple-900 uppercase tracking-wide">{t("studentDashboard.subject")}</th>
                              <th className="text-left py-2.5 px-3 sm:py-3 sm:px-4 text-xs font-semibold text-purple-900 uppercase tracking-wide">{t("studentDashboard.exam")}</th>
                              <th className="text-center py-2.5 px-3 sm:py-3 sm:px-4 text-xs font-semibold text-purple-900 uppercase tracking-wide">{t("studentDashboard.max")}</th>
                              <th className="text-center py-2.5 px-3 sm:py-3 sm:px-4 text-xs font-semibold text-purple-900 uppercase tracking-wide">{t("studentDashboard.obtained")}</th>
                              <th className="text-center py-2.5 px-3 sm:py-3 sm:px-4 text-xs font-semibold text-purple-900 uppercase tracking-wide">%</th>
                              <th className="text-center py-2.5 px-3 sm:py-3 sm:px-4 text-xs font-semibold text-purple-900 uppercase tracking-wide">{t("studentDashboard.grade")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {semesterResults.map((result, index) => {
                              const percentage = result.marksObtained !== null ? (result.marksObtained / result.maxMarks) * 100 : null;
                              const grade = result.isAbsent ? 'AB' : percentage === null ? '-' : percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : 'F';
                              const gradeColor = grade === 'A+' || grade === 'A' ? 'text-green-600 bg-green-50' : grade === 'B' ? 'text-blue-600 bg-blue-50' : grade === 'C' ? 'text-yellow-600 bg-yellow-50' : grade === 'AB' ? 'text-gray-600 bg-gray-100' : grade === '-' ? 'text-gray-400 bg-gray-50' : 'text-red-600 bg-red-50';

                              return (
                                <tr key={result.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                  <td className="py-3 px-4 font-medium text-slate-800">{result.subject}</td>
                                  <td className="py-3 px-4 text-slate-600 text-sm">{result.title}</td>
                                  <td className="py-3 px-4 text-center text-slate-600">{result.maxMarks}</td>
                                  <td className="py-3 px-4 text-center font-semibold text-slate-800">
                                    {result.isAbsent ? <span className="text-red-500">{t("studentDashboard.absent")}</span> : result.marksObtained ?? '-'}
                                  </td>
                                  <td className="py-3 px-4 text-center text-slate-600">
                                    {percentage !== null ? `${percentage.toFixed(1)}%` : '-'}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`px-2 py-1 rounded font-bold text-sm ${gradeColor}`}>{grade}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          {semesterResults.filter(r => r.marksObtained !== null && !r.isAbsent).length > 0 && (
                            <tfoot>
                              <tr className="bg-purple-100 border-t-2 border-purple-200">
                                <td colSpan={2} className="py-3 px-4 font-bold text-purple-900">{t("studentDashboard.total")}</td>
                                <td className="py-3 px-4 text-center font-bold text-purple-900">
                                  {semesterResults.filter(r => r.marksObtained !== null && !r.isAbsent).reduce((sum, r) => sum + r.maxMarks, 0)}
                                </td>
                                <td className="py-3 px-4 text-center font-bold text-purple-900">
                                  {semesterResults.filter(r => r.marksObtained !== null && !r.isAbsent).reduce((sum, r) => sum + (r.marksObtained || 0), 0)}
                                </td>
                                <td className="py-3 px-4 text-center font-bold text-purple-900">
                                  {(() => {
                                    const graded = semesterResults.filter(r => r.marksObtained !== null && !r.isAbsent);
                                    if (graded.length === 0) return '-';
                                    const total = graded.reduce((sum, r) => sum + (r.marksObtained || 0), 0);
                                    const max = graded.reduce((sum, r) => sum + r.maxMarks, 0);
                                    return `${((total / max) * 100).toFixed(1)}%`;
                                  })()}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {(() => {
                                    const graded = semesterResults.filter(r => r.marksObtained !== null && !r.isAbsent);
                                    if (graded.length === 0) return '-';
                                    const total = graded.reduce((sum, r) => sum + (r.marksObtained || 0), 0);
                                    const max = graded.reduce((sum, r) => sum + r.maxMarks, 0);
                                    const pct = (total / max) * 100;
                                    const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';
                                    const gradeColor = grade === 'A+' || grade === 'A' ? 'text-green-600 bg-green-100' : grade === 'B' ? 'text-blue-600 bg-blue-100' : 'text-yellow-600 bg-yellow-100';
                                    return <span className={`px-2 py-1 rounded font-bold text-sm ${gradeColor}`}>{grade}</span>;
                                  })()}
                                </td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Monthly / Midterm Exams Section */}
                  {monthlyResults.length > 0 && (
                    <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-200">
                      <div className="flex items-center gap-2 sm:gap-3 mb-4">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <h2 className="text-sm sm:text-lg font-bold text-slate-800 uppercase tracking-wide">{t("studentDashboard.monthlyTests")}</h2>
                      </div>

                      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
                        <table className="w-full min-w-[560px]">
                          <thead>
                            <tr className="bg-amber-50 border-b border-amber-100">
                              <th className="text-left py-2.5 px-3 sm:py-3 sm:px-4 text-xs font-semibold text-amber-900 uppercase tracking-wide">{t("studentDashboard.subject")}</th>
                              <th className="text-left py-2.5 px-3 sm:py-3 sm:px-4 text-xs font-semibold text-amber-900 uppercase tracking-wide">{t("studentDashboard.exam")}</th>
                              <th className="text-center py-2.5 px-3 sm:py-3 sm:px-4 text-xs font-semibold text-amber-900 uppercase tracking-wide">{t("studentDashboard.max")}</th>
                              <th className="text-center py-2.5 px-3 sm:py-3 sm:px-4 text-xs font-semibold text-amber-900 uppercase tracking-wide">{t("studentDashboard.obtained")}</th>
                              <th className="text-center py-2.5 px-3 sm:py-3 sm:px-4 text-xs font-semibold text-amber-900 uppercase tracking-wide">%</th>
                              <th className="text-center py-2.5 px-3 sm:py-3 sm:px-4 text-xs font-semibold text-amber-900 uppercase tracking-wide">{t("studentDashboard.grade")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {monthlyResults.map((result, index) => {
                              const percentage = result.marksObtained !== null ? (result.marksObtained / result.maxMarks) * 100 : null;
                              const grade = result.isAbsent ? 'AB' : percentage === null ? '-' : percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : 'F';
                              const gradeColor = grade === 'A+' || grade === 'A' ? 'text-green-600 bg-green-50' : grade === 'B' ? 'text-blue-600 bg-blue-50' : grade === 'C' ? 'text-yellow-600 bg-yellow-50' : grade === 'AB' ? 'text-gray-600 bg-gray-100' : grade === '-' ? 'text-gray-400 bg-gray-50' : 'text-red-600 bg-red-50';

                              return (
                                <tr key={result.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                  <td className="py-3 px-4 font-medium text-slate-800">{result.subject}</td>
                                  <td className="py-3 px-4 text-slate-600 text-sm">{result.title}</td>
                                  <td className="py-3 px-4 text-center text-slate-600">{result.maxMarks}</td>
                                  <td className="py-3 px-4 text-center font-semibold text-slate-800">
                                    {result.isAbsent ? <span className="text-red-500">{t("studentDashboard.absent")}</span> : result.marksObtained ?? '-'}
                                  </td>
                                  <td className="py-3 px-4 text-center text-slate-600">
                                    {percentage !== null ? `${percentage.toFixed(1)}%` : '-'}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`px-2 py-1 rounded font-bold text-sm ${gradeColor}`}>{grade}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          {monthlyResults.filter(r => r.marksObtained !== null && !r.isAbsent).length > 0 && (
                            <tfoot>
                              <tr className="bg-amber-100 border-t-2 border-amber-200">
                                <td colSpan={2} className="py-3 px-4 font-bold text-amber-900">{t("studentDashboard.total")}</td>
                                <td className="py-3 px-4 text-center font-bold text-amber-900">
                                  {monthlyResults.filter(r => r.marksObtained !== null && !r.isAbsent).reduce((sum, r) => sum + r.maxMarks, 0)}
                                </td>
                                <td className="py-3 px-4 text-center font-bold text-amber-900">
                                  {monthlyResults.filter(r => r.marksObtained !== null && !r.isAbsent).reduce((sum, r) => sum + (r.marksObtained || 0), 0)}
                                </td>
                                <td className="py-3 px-4 text-center font-bold text-amber-900">
                                  {(() => {
                                    const graded = monthlyResults.filter(r => r.marksObtained !== null && !r.isAbsent);
                                    if (graded.length === 0) return '-';
                                    const total = graded.reduce((sum, r) => sum + (r.marksObtained || 0), 0);
                                    const max = graded.reduce((sum, r) => sum + r.maxMarks, 0);
                                    return `${((total / max) * 100).toFixed(1)}%`;
                                  })()}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {(() => {
                                    const graded = monthlyResults.filter(r => r.marksObtained !== null && !r.isAbsent);
                                    if (graded.length === 0) return '-';
                                    const total = graded.reduce((sum, r) => sum + (r.marksObtained || 0), 0);
                                    const max = graded.reduce((sum, r) => sum + r.maxMarks, 0);
                                    const pct = (total / max) * 100;
                                    const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';
                                    const gradeColor = grade === 'A+' || grade === 'A' ? 'text-green-600 bg-green-100' : grade === 'B' ? 'text-blue-600 bg-blue-100' : 'text-yellow-600 bg-yellow-100';
                                    return <span className={`px-2 py-1 rounded font-bold text-sm ${gradeColor}`}>{grade}</span>;
                                  })()}
                                </td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Grading Scale & Footer */}
                  <div className="px-4 sm:px-8 py-4 sm:py-6 bg-slate-100/50">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">{t("studentDashboard.gradingScale")}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">A+ (90-100%)</span>
                          <span className="px-2 py-1 bg-green-50 text-green-600 rounded">A (80-89%)</span>
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">B (70-79%)</span>
                          <span className="px-2 py-1 bg-yellow-50 text-yellow-600 rounded">C (60-69%)</span>
                          <span className="px-2 py-1 bg-orange-50 text-orange-600 rounded">D (50-59%)</span>
                          <span className="px-2 py-1 bg-red-50 text-red-600 rounded">F (Below 50%)</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t("studentDashboard.generatedOn")}</p>
                        <p className="text-sm text-slate-600">{new Date().toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-300 text-center">
                      <p className="text-xs text-slate-400">{t("studentDashboard.computerGenerated")}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Notices Tab */}
          <TabsContent value="notices" className="animate-fade-in">
            {!hasNotices ? (
              <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                <EmptyState
                  icon={Megaphone}
                  title={t("studentDashboard.noNoticesTitle")}
                  description={t("studentDashboard.noNoticesDesc")}
                />
              </div>
            ) : (
              <>
                <FadeInView className="mb-6">
                  <h2 className="text-xl font-bold text-foreground mb-2">{t("studentDashboard.schoolNotices")}</h2>
                  <p className="text-muted-foreground text-sm">{t("studentDashboard.noticesDesc")}</p>
                </FadeInView>

                <StaggerContainer className="space-y-4">
                  {notices.map((notice) => (
                    <StaggerItem key={notice.id}>
                      <div className="bg-card rounded-xl p-5 shadow-card border border-border">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-foreground">{notice.title}</h3>
                          <span className="text-xs text-muted-foreground">{notice.date}</span>
                        </div>
                        <p className="text-muted-foreground">{notice.content}</p>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </>
            )}
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-2">{t("common.accountSettings")}</h2>
                <p className="text-muted-foreground text-sm">{t("common.manageProfile")}</p>
              </div>
              <AccountSettings roleColor="bg-primary" />
            </div>
          </TabsContent>
          </SwipeableTabContent>
        </Tabs>
      </motion.main>

      <TourHelpButton onClick={startTour} />

      {/* Mobile Bottom Navigation */}
      <MobileNav
        data-tour="student-mobile-nav"
        items={[
          { id: "homework", label: t("studentDashboard.tabs.homework"), icon: BookOpen, badge: pendingHomework.length || undefined },
          { id: "attendance", label: t("studentDashboard.tabs.attendance"), icon: Calendar },
          { id: "marks", label: t("studentDashboard.tabs.marks"), icon: BarChart3 },
          { id: "yearly", label: t("studentDashboard.tabs.yearly"), icon: Award },
          { id: "notices", label: t("studentDashboard.tabs.notices"), icon: Megaphone },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accentColor="bg-primary"
      />
    </div>
  );
};

export default StudentDashboard;
