import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { DashboardSkeleton } from "@/components/ui/skeleton-loader";
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
  Printer
} from "lucide-react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { GroupChat } from "@/components/chat";
import { ThemeToggle } from "@/components/ThemeToggle";
import { EmailPreferences } from "@/components/account/EmailPreferences";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ExamType, ExamResult } from "@/types/exam";
import { getExamTypeBadgeColor } from "@/utils/exam";
import { calculateGrade, getGradeColors, calculatePercentage, formatPercentage, calculateResultTotals, GRADING_SCALE } from "@/utils/grades";

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

interface Homework {
  id: string;
  title: string;
  subject: string;
  due_date: string;
  description?: string;
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("academics");

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
          title: "Error",
          description: "Could not load your children's data. Check your connection and refresh the page.",
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
          .select('id, title, subject, due_date, description')
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

        const submissionsMap = new Map(
          (submissions || []).map(s => [s.homework_id, s])
        );

        const homeworkWithSubmissions: Homework[] = (homeworkData || []).map(hw => ({
          ...hw,
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
            title: "Error",
            description: "Could not load exam results. Check your connection and try again.",
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
            examDate: new Date(exam.exam_date).toLocaleDateString('en-US', {
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
          title: "Error",
          description: "Could not process exam results. Refresh the page to try again.",
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
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="w-full bg-role-parent text-primary-foreground sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Parent Dashboard</h1>
              <p className="text-xs text-primary-foreground/80">Welcome, {profile?.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="container mx-auto px-4 py-6">
        {children.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Children Linked</h3>
              <p className="text-muted-foreground">
                No children have been linked to your account yet. Please contact the school administration.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Child Selector */}
            {children.length > 1 && (
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Select Child</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
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
                        {selectedChild.class_name} {selectedChild.section && `- Section ${selectedChild.section}`}
                      </p>
                      <p className="opacity-70 text-sm">ID: {selectedChild.student_id}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="academics" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Academics</span>
                </TabsTrigger>
                <TabsTrigger value="yearly" className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span className="hidden sm:inline">Yearly</span>
                </TabsTrigger>
                <TabsTrigger value="attendance" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Attendance</span>
                </TabsTrigger>
                <TabsTrigger value="notices" className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">Notices</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
              </TabsList>

              {/* Academics Tab */}
              <TabsContent value="academics">
                <div className="space-y-6">
                  {/* Homework Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Homework & Assignments</CardTitle>
                      <CardDescription>Recent homework and submission status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {homework.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                          <p>No homework assignments yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {homework.map(hw => (
                            <div key={hw.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-semibold text-foreground">{hw.title}</h4>
                                  <p className="text-sm text-muted-foreground">{hw.subject}</p>
                                </div>
                                {hw.submission?.submitted_at ? (
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Submitted
                                  </Badge>
                                ) : new Date(hw.due_date) < new Date() ? (
                                  <Badge variant="destructive">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Overdue
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Due: {new Date(hw.due_date).toLocaleDateString()}
                              </p>
                              {hw.submission?.marks !== null && hw.submission?.marks !== undefined && (
                                <div className="mt-2 p-2 bg-muted rounded">
                                  <p className="text-sm">
                                    <span className="font-medium">Marks:</span>{" "}
                                    <span className={hw.submission.marks >= 7 ? "text-green-600 dark:text-green-400" : hw.submission.marks >= 5 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}>
                                      {hw.submission.marks}/10
                                    </span>
                                  </p>
                                  {hw.submission.remarks && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      <span className="font-medium">Remarks:</span> {hw.submission.remarks}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Exam Results Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Test & Exam Results</CardTitle>
                      <CardDescription>All test and exam results</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!hasExamResults ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Award className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                          <p>No exam results yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {examResults.map(result => (
                            <div key={result.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-semibold text-foreground">{result.title}</h4>
                                  <p className="text-sm text-muted-foreground">{result.subject}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${getExamTypeBadgeColor(result.examType)}`}>
                                  {result.examType === 'weekly_daily' ? 'Weekly' : result.examType === 'monthly_midterm' ? 'Monthly' : 'Semester'}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{result.examDate}</p>
                              {result.isAbsent ? (
                                <div className="mt-2 p-2 bg-destructive/10 rounded">
                                  <p className="text-sm text-destructive">Absent</p>
                                </div>
                              ) : result.marksObtained !== null ? (
                                <div className="mt-2 p-2 bg-muted rounded">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium">Score:</span>
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
                                      <span className="font-medium">Remarks:</span> {result.remarks}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="mt-2 p-2 bg-muted rounded">
                                  <p className="text-sm text-muted-foreground">Not yet graded</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Yearly Results Tab */}
              <TabsContent value="yearly">
                {!hasYearlyResults ? (
                  <Card>
                    <CardContent className="py-12">
                      <EmptyState
                        icon={Award}
                        title="No Yearly Results Yet"
                        description="Semester exams and monthly test results will appear here."
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <div className="max-w-4xl mx-auto">
                    {/* Print Button */}
                    <div className="flex justify-end mb-4 print:hidden">
                      <Button
                        variant="outline"
                        onClick={() => window.print()}
                        className="gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        Print Result Card
                      </Button>
                    </div>
                    {/* Result Card / Certificate */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg shadow-xl border-4 border-double border-slate-300 overflow-hidden print:shadow-none print:border-2">
                      {/* Certificate Header */}
                      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 text-white px-8 py-6 text-center relative">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10">
                          <div className="absolute top-2 left-2 w-16 h-16 border-2 border-white rounded-full"></div>
                          <div className="absolute top-2 right-2 w-16 h-16 border-2 border-white rounded-full"></div>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-20 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="relative">
                          <div className="flex justify-center mb-3">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30">
                              <Award className="w-8 h-8 text-yellow-300" />
                            </div>
                          </div>
                          <h1 className="text-2xl font-serif font-bold tracking-wide">ACADEMIC RESULT CARD</h1>
                          <p className="text-indigo-200 text-sm mt-1">Official Academic Record</p>
                        </div>
                      </div>

                      {/* Student Info Section */}
                      <div className="px-8 py-6 border-b-2 border-dashed border-slate-300 bg-white/50">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Student Name</p>
                            <p className="font-semibold text-slate-800 text-lg">{selectedChild?.full_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Class</p>
                            <p className="font-semibold text-slate-800 text-lg">{selectedChild?.class_name} {selectedChild?.section && `- ${selectedChild.section}`}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Student ID</p>
                            <p className="font-mono text-slate-700">{selectedChild?.student_id}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Academic Year</p>
                            <p className="font-mono text-slate-700">{new Date().getFullYear()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Semester / Final Exams Section */}
                      {semesterResults.length > 0 && (
                        <div className="px-8 py-6 border-b border-slate-200">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                              <Award className="w-4 h-4 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Semester / Final Examinations</h2>
                          </div>

                          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-purple-50 border-b border-purple-100">
                                  <th className="text-left py-3 px-4 text-xs font-semibold text-purple-900 uppercase tracking-wide">Subject</th>
                                  <th className="text-left py-3 px-4 text-xs font-semibold text-purple-900 uppercase tracking-wide">Exam</th>
                                  <th className="text-center py-3 px-4 text-xs font-semibold text-purple-900 uppercase tracking-wide">Max Marks</th>
                                  <th className="text-center py-3 px-4 text-xs font-semibold text-purple-900 uppercase tracking-wide">Obtained</th>
                                  <th className="text-center py-3 px-4 text-xs font-semibold text-purple-900 uppercase tracking-wide">Percentage</th>
                                  <th className="text-center py-3 px-4 text-xs font-semibold text-purple-900 uppercase tracking-wide">Grade</th>
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
                                        {result.isAbsent ? <span className="text-red-500">Absent</span> : result.marksObtained ?? '-'}
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
                                    <td colSpan={2} className="py-3 px-4 font-bold text-purple-900">TOTAL</td>
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
                        <div className="px-8 py-6 border-b border-slate-200">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                              <BarChart3 className="w-4 h-4 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Monthly Tests / Midterms</h2>
                          </div>

                          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-amber-50 border-b border-amber-100">
                                  <th className="text-left py-3 px-4 text-xs font-semibold text-amber-900 uppercase tracking-wide">Subject</th>
                                  <th className="text-left py-3 px-4 text-xs font-semibold text-amber-900 uppercase tracking-wide">Test</th>
                                  <th className="text-center py-3 px-4 text-xs font-semibold text-amber-900 uppercase tracking-wide">Max Marks</th>
                                  <th className="text-center py-3 px-4 text-xs font-semibold text-amber-900 uppercase tracking-wide">Obtained</th>
                                  <th className="text-center py-3 px-4 text-xs font-semibold text-amber-900 uppercase tracking-wide">Percentage</th>
                                  <th className="text-center py-3 px-4 text-xs font-semibold text-amber-900 uppercase tracking-wide">Grade</th>
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
                                        {result.isAbsent ? <span className="text-red-500">Absent</span> : result.marksObtained ?? '-'}
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
                                    <td colSpan={2} className="py-3 px-4 font-bold text-amber-900">TOTAL</td>
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
                      <div className="px-8 py-6 bg-slate-100/50">
                        <div className="flex flex-wrap justify-between items-start gap-4">
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Grading Scale</p>
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
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Generated On</p>
                            <p className="text-sm text-slate-600">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-300 text-center">
                          <p className="text-xs text-slate-400">This is a computer-generated document. For official records, please contact the school administration.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Attendance Tab */}
              <TabsContent value="attendance">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Attendance Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Attendance Summary</CardTitle>
                      <CardDescription>Last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center mb-6">
                        <div className="relative w-32 h-32">
                          <svg className="w-full h-full transform -rotate-90">
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
                          <p className="text-sm text-muted-foreground">Total Days</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-success">{attendanceStats.present}</p>
                          <p className="text-sm text-muted-foreground">Present</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-destructive">{attendanceStats.absent}</p>
                          <p className="text-sm text-muted-foreground">Absent</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Attendance */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Attendance</CardTitle>
                      <CardDescription>Day by day record</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {attendance.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                          <p>No attendance records yet</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {attendance.slice(0, 15).map(record => (
                            <div key={record.id} className="flex justify-between items-center py-2 border-b last:border-0">
                              <span className="text-sm text-muted-foreground">
                                {new Date(record.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                              {record.is_present ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Present</Badge>
                              ) : (
                                <Badge variant="destructive">Absent</Badge>
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
              <TabsContent value="notices">
                <Card>
                  <CardHeader>
                    <CardTitle>School Notices</CardTitle>
                    <CardDescription>Announcements and updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {notices.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                        <p>No notices available</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {notices.map(notice => (
                          <div key={notice.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-foreground">{notice.title}</h4>
                              <span className="text-xs text-muted-foreground">
                                {new Date(notice.created_at).toLocaleDateString()}
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
              <TabsContent value="settings">
                <div className="max-w-2xl mx-auto">
                  <EmailPreferences />
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </motion.main>
    </div>
  );
};

export default ParentDashboard;
