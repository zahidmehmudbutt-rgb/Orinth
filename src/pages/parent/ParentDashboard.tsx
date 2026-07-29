import { Helmet } from "react-helmet-async";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FadeInView, StaggerContainer, StaggerItem, HoverScale } from "@/components/ui/motion-wrapper";
import { DashboardSkeleton } from "@/components/ui/skeleton-loader";
import { MobileNav } from "@/components/ui/mobile-nav";
import { SwipeableTabContent } from "@/components/ui/swipeable-tabs";
import {
  Users,
  BookOpen,
  Calendar,
  Bell,
  LogOut,
  User,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Settings,
  Award,
  BarChart3,
  Printer,
  Download,
  MessageSquare
} from "lucide-react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { GroupChat } from "@/components/chat";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "react-i18next";
import { EmailPreferences } from "@/components/account/EmailPreferences";
import { PushNotificationToggle } from "@/components/notifications/PushNotificationToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MobileResultCards } from "@/components/ui/mobile-result-card";
import { DirectMessageButton } from "@/components/messaging/DirectMessageButton";
import type { ExamType, ExamResult } from "@/types/exam";
import { getExamTypeBadgeColor } from "@/utils/exam";
import { calculateGrade, getGradeColors, calculatePercentage, formatPercentage, calculateResultTotals, GRADING_SCALE } from "@/utils/grades";
import { useTour } from "@/hooks/useTour";
import { TourHelpButton } from "@/components/onboarding/TourHelpButton";
import { getParentTourSteps } from "@/components/onboarding/tour-configs";
import { PerformanceTrends } from "@/components/performance/PerformanceTrends";
import { getDateLocale } from "@/lib/utils/date-locale";
import { exportToPDF } from "@/lib/utils/pdf-export";

interface Child {
  id: string;
  full_name: string;
  student_id: string;
  class_id: string;
  class_name?: string;
  section?: string;
}

interface ParentStudentJoinResult {
  student_id: string;
  students: {
    id: string;
    full_name: string;
    student_id: string;
    class_id: string;
    classes: {
      name: string;
      section: string | null;
    } | null;
  };
}

interface TeacherInfo {
  id: string;
  name: string;
}

interface Homework {
  id: string;
  title: string;
  subject: string;
  due_date: string;
  description?: string;
  teacher?: TeacherInfo;
  submission?: {
    submitted_at: string | null;
    marks: number | null;
    remarks: string | null;
  };
}

interface AttendanceRecord {
  id: string;
  date: string;
  is_present: boolean;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

// Types imported from @/types/exam

const ParentDashboard = () => {
  const { t } = useTranslation();
  const dateLocale = getDateLocale();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();
  const tourSteps = useMemo(() => getParentTourSteps(), []);
  const { startTour, hasCompletedTour } = useTour("parent", tourSteps);

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("academics");

  useEffect(() => {
    if (!authLoading && !isLoading && !hasCompletedTour) {
      const timer = setTimeout(() => startTour(), 800);
      return () => clearTimeout(timer);
    }
  }, [authLoading, isLoading, hasCompletedTour, startTour]);

  // Fetch children linked to this parent
  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('parent_students')
          .select(`
            student_id,
            students:student_id (
              id,
              full_name,
              student_id,
              class_id,
              classes:class_id (
                name,
                section
              )
            )
          `)
          .eq('parent_id', user.id);

        if (error) throw error;

        const childrenData: Child[] = (data as ParentStudentJoinResult[] || [])
          .filter((item) => item.students != null)
          .map((item) => ({
            id: item.students.id,
            full_name: item.students.full_name,
            student_id: item.students.student_id,
            class_id: item.students.class_id,
            class_name: item.students.classes?.name,
            section: item.students.classes?.section,
          }));

        setChildren(childrenData);
        if (childrenData.length > 0) {
          setSelectedChild(childrenData[0]);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error fetching children:', error);
        toast({
          variant: "destructive",
          title: t("parentDashboard.error"),
          description: t("parentDashboard.loadError"),
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChildren();
  }, [user, toast]);

  // Fetch homework for selected child
  useEffect(() => {
    const fetchHomework = async () => {
      if (!selectedChild) return;

      try {
        const { data: homeworkData, error: homeworkError } = await supabase
          .from('homework')
          .select('id, title, subject, due_date, description, teacher_id')
          .eq('class_id', selectedChild.class_id)
          .order('due_date', { ascending: false })
          .limit(10);

        if (homeworkError) throw homeworkError;

        // Fetch submissions for this student
        const { data: submissions, error: submissionsError } = await supabase
          .from('homework_submissions')
          .select('homework_id, submitted_at, marks, remarks')
          .eq('student_id', selectedChild.id);

        if (submissionsError) throw submissionsError;

        // Fetch teacher profiles for homework
        const teacherIds = [...new Set((homeworkData || []).map(hw => hw.teacher_id).filter(Boolean))];
        const teacherMap = new Map<string, TeacherInfo>();
        if (teacherIds.length > 0) {
          const { data: teacherProfiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', teacherIds);

          (teacherProfiles || []).forEach(tp => {
            teacherMap.set(tp.id, { id: tp.id, name: tp.full_name });
          });
        }

        const submissionsMap = new Map(
          (submissions || []).map(s => [s.homework_id, s])
        );

        const homeworkWithSubmissions: Homework[] = (homeworkData || []).map(hw => ({
          ...hw,
          teacher: hw.teacher_id ? teacherMap.get(hw.teacher_id) : undefined,
          submission: submissionsMap.get(hw.id) || undefined,
        }));

        setHomework(homeworkWithSubmissions);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error fetching homework:', error);
      }
    };

    fetchHomework();
  }, [selectedChild]);

  // Fetch attendance for selected child
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedChild) return;

      try {
        const { data, error } = await supabase
          .from('attendance')
          .select('id, date, is_present')
          .eq('student_id', selectedChild.id)
          .order('date', { ascending: false })
          .limit(30);

        if (error) throw error;
        setAttendance(data || []);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error fetching attendance:', error);
      }
    };

    fetchAttendance();
  }, [selectedChild]);

  // Fetch notices
  useEffect(() => {
    const fetchNotices = async () => {
      if (!selectedChild) return;

      try {
        const { data, error } = await supabase
          .from('notices')
          .select('id, title, content, created_at')
          .or(`target_class_id.eq.${selectedChild.class_id},target_class_id.is.null`)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setNotices(data || []);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error fetching notices:', error);
      }
    };

    fetchNotices();
  }, [selectedChild]);

  // Fetch exam results for selected child
  useEffect(() => {
    const fetchExamResults = async () => {
      if (!selectedChild) return;

      try {
        // Get all exams for this class
        const { data: examsData, error: examsError } = await supabase
          .from('exam_results')
          .select('id, title, subject, exam_type, max_marks, exam_date')
          .eq('class_id', selectedChild.class_id)
          .order('exam_date', { ascending: false });

        if (examsError) {
          if (import.meta.env.DEV) console.error('Error fetching exams:', examsError);
          toast({
            variant: "destructive",
            title: t("parentDashboard.error"),
            description: t("parentDashboard.examLoadError"),
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
          .from('student_exam_marks')
          .select('id, exam_id, marks_obtained, remarks, is_absent')
          .eq('student_id', selectedChild.id)
          .in('exam_id', examIds);

        if (marksError) {
          if (import.meta.env.DEV) console.error('Error fetching marks:', marksError);
        }

        const marksMap = new Map(
          (marksData || []).map(m => [m.exam_id, m])
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
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            marksObtained: mark?.marks_obtained ?? null,
            maxMarks: exam.max_marks,
            remarks: mark?.remarks || null,
            isAbsent: mark?.is_absent || false,
          };
        });

        setExamResults(results);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error fetching exam results:', error);
        toast({
          variant: "destructive",
          title: t("parentDashboard.error"),
          description: t("parentDashboard.examProcessError"),
        });
      }
    };

    fetchExamResults();
  }, [selectedChild, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Calculate attendance stats
  const attendanceStats = {
    total: attendance.length,
    present: attendance.filter(a => a.is_present).length,
    absent: attendance.filter(a => !a.is_present).length,
    percentage: attendance.length > 0
      ? Math.round((attendance.filter(a => a.is_present).length / attendance.length) * 100)
      : 0,
  };

  // Filter exam results for yearly results tab (only monthly and semester exams)
  const hasExamResults = examResults.length > 0;
  const yearlyResults = examResults.filter(
    e => e.examType === 'monthly_midterm' || e.examType === 'semester_final'
  );
  const hasYearlyResults = yearlyResults.length > 0;

  // Group exam results by type
  const semesterResults = examResults.filter(e => e.examType === 'semester_final');
  const monthlyResults = examResults.filter(e => e.examType === 'monthly_midterm');

  // getExamTypeBadgeColor imported from @/utils/exam

  if (authLoading || isLoading) {
    return <DashboardSkeleton roleColor="bg-role-parent" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Parent Dashboard — School Management System</title></Helmet>
      {/* Header */}
      <header className="w-full bg-role-parent text-primary-foreground sticky top-0 z-50" data-tour="parent-header">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{t("parentDashboard.title")}</h1>
              <p className="text-xs text-primary-foreground/80 truncate max-w-[150px] sm:max-w-none">{t("parentDashboard.welcome")}, {profile?.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageToggle className="text-primary-foreground hover:bg-primary-foreground/20" />
            <ThemeToggle className="text-primary-foreground hover:bg-primary-foreground/20" />
            <GroupChat triggerClassName="text-primary-foreground hover:bg-primary-foreground/20" />
            <NotificationCenter className="text-primary-foreground hover:bg-primary-foreground/20" />
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <motion.main
        id="main-content"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="container mx-auto px-4 py-6 pb-24 md:pb-6">
        {children.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{t("parentDashboard.noChildrenTitle")}</h3>
              <p className="text-muted-foreground">
                {t("parentDashboard.noChildrenDesc")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Child Selector */}
            {children.length > 1 && (
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t("parentDashboard.selectChild")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap" data-tour="parent-child-selector">
                    {children.map(child => (
                      <Button
                        key={child.id}
                        variant={selectedChild?.id === child.id ? "default" : "outline"}
                        className={selectedChild?.id === child.id ? "bg-role-parent hover:opacity-90 text-white" : ""}
                        onClick={() => setSelectedChild(child)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        {child.full_name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selected Child Info */}
            {selectedChild && (
              <Card className="mb-6 bg-role-parent text-white">
                <CardContent className="py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <GraduationCap className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{selectedChild.full_name}</h2>
                      <p className="opacity-90">
                        {selectedChild.class_name} {selectedChild.section && `- ${t("parentDashboard.section", { section: selectedChild.section })}`}
                      </p>
                      <p className="opacity-70 text-sm">{t("parentDashboard.childId", { id: selectedChild.student_id })}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="hidden md:grid w-full grid-cols-5 mb-6" data-tour="parent-tabs">
                <TabsTrigger value="academics" className="flex items-center gap-2" data-tour="parent-academics">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("parentDashboard.tabs.academics")}</span>
                </TabsTrigger>
                <TabsTrigger value="yearly" className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("parentDashboard.tabs.yearly")}</span>
                </TabsTrigger>
                <TabsTrigger value="attendance" className="flex items-center gap-2" data-tour="parent-attendance">
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("parentDashboard.tabs.attendance")}</span>
                </TabsTrigger>
                <TabsTrigger value="notices" className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("parentDashboard.tabs.notices")}</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("parentDashboard.tabs.settings")}</span>
                </TabsTrigger>
              </TabsList>

              <SwipeableTabContent activeTab={activeTab} tabOrder={["academics", "yearly", "attendance", "notices", "settings"]} onTabChange={setActiveTab}>
              {/* Academics Tab */}
              <TabsContent value="academics" forceMount className="data-[state=inactive]:hidden">
                <div className="space-y-6">
                  {/* Performance Trends */}
                  <PerformanceTrends
                    examResults={examResults}
                    attendanceData={attendanceStats}
                  />

                  {/* Contact Teachers Section */}
                  {(() => {
                    const uniqueTeachers = new Map<string, TeacherInfo>();
                    homework.forEach(hw => {
                      if (hw.teacher && !uniqueTeachers.has(hw.teacher.id)) {
                        uniqueTeachers.set(hw.teacher.id, hw.teacher);
                      }
                    });
                    const teachers = Array.from(uniqueTeachers.values());
                    if (teachers.length === 0) return null;
                    return (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            {t("parentDashboard.contactTeachers")}
                          </CardTitle>
                          <CardDescription>{t("parentDashboard.contactTeachersDesc")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-3">
                            {teachers.map(teacher => (
                              <DirectMessageButton
                                key={teacher.id}
                                recipientId={teacher.id}
                                recipientName={teacher.name}
                                studentName={selectedChild?.full_name}
                                classId={selectedChild?.class_id || ""}
                                schoolId={profile?.school_id || ""}
                                senderRole="parent"
                                recipientRole="teacher"
                              />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}

                  {/* Homework Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("parentDashboard.homeworkTitle")}</CardTitle>
                      <CardDescription>{t("parentDashboard.homeworkDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {homework.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                          <p>{t("parentDashboard.noHomework")}</p>
                        </div>
                      ) : (
                        <StaggerContainer className="space-y-4">
                          {homework.map(hw => (
                            <StaggerItem key={hw.id}>
                              <div className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-semibold text-foreground">{hw.title}</h4>
                                  <p className="text-sm text-muted-foreground">{hw.subject}</p>
                                </div>
                                {hw.submission?.submitted_at ? (
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    {t("parentDashboard.submitted")}
                                  </Badge>
                                ) : new Date(hw.due_date) < new Date() ? (
                                  <Badge variant="destructive">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    {t("parentDashboard.overdue")}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {t("parentDashboard.pending")}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {t("parentDashboard.due", { date: new Date(hw.due_date).toLocaleDateString(dateLocale) })}
                              </p>
                              {hw.submission?.marks !== null && hw.submission?.marks !== undefined && (
                                <div className="mt-2 p-2 bg-muted rounded">
                                  <p className="text-sm">
                                    <span className="font-medium">{t("parentDashboard.marks")}</span>{" "}
                                    <span className={hw.submission.marks >= 7 ? "text-green-600 dark:text-green-400" : hw.submission.marks >= 5 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}>
                                      {hw.submission.marks}/10
                                    </span>
                                  </p>
                                  {hw.submission.remarks && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      <span className="font-medium">{t("parentDashboard.remarks")}</span> {hw.submission.remarks}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                            </StaggerItem>
                          ))}
                        </StaggerContainer>
                      )}
                    </CardContent>
                  </Card>

                  {/* Exam Results Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("parentDashboard.examResultsTitle")}</CardTitle>
                      <CardDescription>{t("parentDashboard.examResultsDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!hasExamResults ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Award className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                          <p>{t("parentDashboard.noExamResults")}</p>
                        </div>
                      ) : (
                        <StaggerContainer className="space-y-4">
                          {examResults.map(result => (
                            <StaggerItem key={result.id}>
                              <div className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-semibold text-foreground">{result.title}</h4>
                                  <p className="text-sm text-muted-foreground">{result.subject}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${getExamTypeBadgeColor(result.examType)}`}>
                                  {result.examType === 'weekly_daily' ? t("parentDashboard.weekly") : result.examType === 'monthly_midterm' ? t("parentDashboard.monthly") : t("parentDashboard.semester")}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{result.examDate}</p>
                              {result.isAbsent ? (
                                <div className="mt-2 p-2 bg-destructive/10 rounded">
                                  <p className="text-sm text-destructive">{t("parentDashboard.absent")}</p>
                                </div>
                              ) : result.marksObtained !== null ? (
                                <div className="mt-2 p-2 bg-muted rounded">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium">{t("parentDashboard.score")}</span>
                                    <span className={`font-semibold ${
                                      (result.marksObtained / result.maxMarks) >= 0.7 ? 'text-green-600 dark:text-green-400' :
                                      (result.marksObtained / result.maxMarks) >= 0.5 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                                    }`}>
                                      {result.marksObtained}/{result.maxMarks}
                                    </span>
                                  </div>
                                  <Progress value={(result.marksObtained / result.maxMarks) * 100} className="h-2" />
                                  {result.remarks && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                      <span className="font-medium">{t("parentDashboard.remarks")}</span> {result.remarks}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="mt-2 p-2 bg-muted rounded">
                                  <p className="text-sm text-muted-foreground">{t("parentDashboard.notYetGraded")}</p>
                                </div>
                              )}
                            </div>
                            </StaggerItem>
                          ))}
                        </StaggerContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Yearly Results Tab */}
              <TabsContent value="yearly" forceMount className="data-[state=inactive]:hidden">
                {!hasYearlyResults ? (
                  <Card>
                    <CardContent className="py-12">
                      <EmptyState
                        icon={Award}
                        title={t("parentDashboard.noYearlyTitle")}
                        description={t("parentDashboard.noYearlyDesc")}
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <div className="max-w-4xl mx-auto">
                    {/* Print Button */}
                    <div className="flex justify-end gap-2 mb-4 print:hidden">
                      <Button
                        variant="outline"
                        onClick={() => window.print()}
                        className="gap-2"
                        data-tour="parent-print-btn"
                      >
                        <Printer className="w-4 h-4" />
                        {t("parentDashboard.printResultCard")}
                      </Button>
                      <Button
                        variant="outline"
                        size="default"
                        onClick={() => exportToPDF("result-card-content", `Result-Card-${selectedChild?.full_name || "Student"}`)}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {t("parentDashboard.downloadPDF")}
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
                          <h1 className="text-lg sm:text-2xl font-serif font-bold tracking-wide">{t("parentDashboard.academicResultCard")}</h1>
                          <p className="text-indigo-200 text-xs sm:text-sm mt-1">{t("parentDashboard.officialRecord")}</p>
                        </div>
                      </div>

                      {/* Student Info Section */}
                      <div className="px-4 sm:px-8 py-4 sm:py-6 border-b-2 border-dashed border-slate-300 bg-white/50">
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">{t("parentDashboard.studentName")}</p>
                            <p className="font-semibold text-slate-800 text-sm sm:text-lg">{selectedChild?.full_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase tracking-wide">{t("parentDashboard.class")}</p>
                            <p className="font-semibold text-slate-800 text-sm sm:text-lg">{selectedChild?.class_name} {selectedChild?.section && `- ${selectedChild.section}`}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">{t("parentDashboard.studentId")}</p>
                            <p className="font-mono text-slate-700 text-sm">{selectedChild?.student_id}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase tracking-wide">{t("parentDashboard.academicYear")}</p>
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
                            <h2 className="text-sm sm:text-lg font-bold text-slate-800 uppercase tracking-wide">{t("parentDashboard.semesterExams")}</h2>
                          </div>

                          <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
                            <table className="w-full min-w-[560px]">
                              <thead>
                                <tr className="bg-purple-50 border-b border-purple-100">
                                  <th className="text-left py-2.5 px-3 sm:py-3 sm:px-4 text-xs font-semibold text-purple-900 uppercase tracking-wide">{t("parentDashboard.subject")}</th>
                                  <th className="text-left py-2.5 px-3 sm:py-3 sm:px-4 text-xs font-semibold text-purple-900 uppercase tracking-wide">{t("parentDashboard.exam")}</th>
                                  <th className="text-center py-2.5 px-3 sm:py-3 sm:px-4 text-xs font-semibold text-purple-900 uppercase tracking-wide">{t("parentDashboard.max")}</th>
                                  <th className="text-center py-2.5 px-3 sm:py-3 sm:px-4 text-xs font-semibold text-purple-900 uppercase tracking-wide">{t("parentDashboard.obtained")}</th>
                                  <th className="text-center py-2.5 px-3 sm:py-3 sm:px-4 text-xs font-semibold text-purple-900 uppercase tracking-wide">{t("parentDashboard.percentage")}</th>
                                  <th className="text-center py-2.5 px-3 sm:py-3 sm:px-4 text-xs font-semibold text-purple-900 uppercase tracking-wide">{t("parentDashboard.grade")}</th>
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
                                        {result.isAbsent ? <span className="text-red-500">{t("parentDashboard.absent")}</span> : result.marksObtained ?? '-'}
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
                                    <td colSpan={2} className="py-3 px-4 font-bold text-purple-900">{t("parentDashboard.total")}</td>
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
                            <h2 className="text-sm sm:text-lg font-bold text-slate-800 uppercase tracking-wide">{t("parentDashboard.monthlyTests")}</h2>
                          </div>

                          <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
                            <table className="w-full min-w-[560px]">
                              <thead>
                                <tr className="bg-amber-50 border-b border-amber-100">
                                  <th className="text-left py-2.5 px-3 sm:py-3 sm:px-4 text-xs font-semibold text-amber-900 uppercase tracking-wide">{t("parentDashboard.subject")}</th>
                                  <th className="text-left py-2.5 px-3 sm:py-3 sm:px-4 text-xs font-semibold text-amber-900 uppercase tracking-wide">{t("parentDashboard.test")}</th>
                                  <th className="text-center py-2.5 px-3 sm:py-3 sm:px-4 text-xs font-semibold text-amber-900 uppercase tracking-wide">{t("parentDashboard.max")}</th>
                                  <th className="text-center py-2.5 px-3 sm:py-3 sm:px-4 text-xs font-semibold text-amber-900 uppercase tracking-wide">{t("parentDashboard.obtained")}</th>
                                  <th className="text-center py-2.5 px-3 sm:py-3 sm:px-4 text-xs font-semibold text-amber-900 uppercase tracking-wide">{t("parentDashboard.percentage")}</th>
                                  <th className="text-center py-2.5 px-3 sm:py-3 sm:px-4 text-xs font-semibold text-amber-900 uppercase tracking-wide">{t("parentDashboard.grade")}</th>
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
                                        {result.isAbsent ? <span className="text-red-500">{t("parentDashboard.absent")}</span> : result.marksObtained ?? '-'}
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
                                    <td colSpan={2} className="py-3 px-4 font-bold text-amber-900">{t("parentDashboard.total")}</td>
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
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">{t("parentDashboard.gradingScale")}</p>
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
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t("parentDashboard.generatedOn")}</p>
                            <p className="text-sm text-slate-600">{new Date().toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-300 text-center">
                          <p className="text-xs text-slate-400">{t("parentDashboard.computerGenerated")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Attendance Tab */}
              <TabsContent value="attendance" forceMount className="data-[state=inactive]:hidden">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Attendance Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("parentDashboard.attendanceSummary")}</CardTitle>
                      <CardDescription>{t("parentDashboard.last30Days")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center mb-6">
                        <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              className="stroke-border"
                              strokeWidth="12"
                              fill="none"
                            />
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              stroke={attendanceStats.percentage >= 75 ? "#22c55e" : attendanceStats.percentage >= 50 ? "#eab308" : "#ef4444"}
                              strokeWidth="12"
                              fill="none"
                              strokeDasharray={`${attendanceStats.percentage * 3.52} 352`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold">{attendanceStats.percentage}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-foreground">{attendanceStats.total}</p>
                          <p className="text-sm text-muted-foreground">{t("parentDashboard.totalDays")}</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-success">{attendanceStats.present}</p>
                          <p className="text-sm text-muted-foreground">{t("parentDashboard.present")}</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-destructive">{attendanceStats.absent}</p>
                          <p className="text-sm text-muted-foreground">{t("parentDashboard.attendanceAbsent")}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Attendance */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("parentDashboard.recentAttendance")}</CardTitle>
                      <CardDescription>{t("parentDashboard.dayByDay")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {attendance.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                          <p>{t("parentDashboard.noAttendanceRecords")}</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {attendance.slice(0, 15).map(record => (
                            <div key={record.id} className="flex justify-between items-center py-2 border-b last:border-0">
                              <span className="text-sm text-muted-foreground">
                                {new Date(record.date).toLocaleDateString(dateLocale, {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                              {record.is_present ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{t("parentDashboard.present")}</Badge>
                              ) : (
                                <Badge variant="destructive">{t("parentDashboard.absent")}</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Notices Tab */}
              <TabsContent value="notices" forceMount className="data-[state=inactive]:hidden">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("parentDashboard.schoolNotices")}</CardTitle>
                    <CardDescription>{t("parentDashboard.announcementsUpdates")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {notices.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                        <p>{t("parentDashboard.noNotices")}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {notices.map(notice => (
                          <div key={notice.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-foreground">{notice.title}</h4>
                              <span className="text-xs text-muted-foreground">
                                {new Date(notice.created_at).toLocaleDateString(dateLocale)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{notice.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" forceMount className="data-[state=inactive]:hidden">
                <div className="max-w-2xl mx-auto space-y-6">
                  <EmailPreferences />
                  <PushNotificationToggle />
                </div>
              </TabsContent>
              </SwipeableTabContent>
            </Tabs>
          </>
        )}
      </motion.main>

      <TourHelpButton onClick={startTour} />

      {/* Mobile Bottom Navigation */}
      <MobileNav
        data-tour="parent-mobile-nav"
        items={[
          { id: "academics", label: t("parentDashboard.tabs.academics"), icon: BookOpen },
          { id: "yearly", label: t("parentDashboard.tabs.yearly"), icon: Award },
          { id: "attendance", label: t("parentDashboard.tabs.attendance"), icon: Calendar },
          { id: "notices", label: t("parentDashboard.tabs.notices"), icon: Bell },
          { id: "settings", label: t("parentDashboard.tabs.settings"), icon: Settings },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accentColor="bg-role-parent"
      />
    </div>
  );
};

export default ParentDashboard;
