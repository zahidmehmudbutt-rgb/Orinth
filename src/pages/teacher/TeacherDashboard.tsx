import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, BookOpen, Plus, Users, Settings, Sparkles, ClipboardList, FileText, ExternalLink, Check, X, Award, Calendar, Save, Pencil, Trash2 } from "lucide-react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { GroupChat } from "@/components/chat";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { FadeInView, StaggerContainer, StaggerItem, HoverScale } from "@/components/ui/motion-wrapper";
import { DashboardSkeleton } from "@/components/ui/skeleton-loader";
import { MobileNav } from "@/components/ui/mobile-nav";
import { SwipeableTabContent } from "@/components/ui/swipeable-tabs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import AccountSettings from "@/components/account/AccountSettings";
import { WelcomeBanner } from "@/components/onboarding/WelcomeBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { supabase } from "@/integrations/supabase/client";
import type { ExamType, ExamItem, StudentMarkEntry } from "@/types/exam";
import { EXAM_TYPE_LABELS } from "@/types/exam";
import { getExamTypeBadgeColor } from "@/utils/exam";
import { getDateLocale } from "@/lib/utils/date-locale";
import { useTour } from "@/hooks/useTour";
import { TourHelpButton } from "@/components/onboarding/TourHelpButton";

interface TeacherData {
  id: string;
  name: string;
  email: string;
  schoolId: string;
}

interface ClassInfo {
  id: string;
  name: string;
  section: string;
  subject: string;
  studentCount: number;
}

interface HomeworkItem {
  id: string;
  title: string;
  description: string;
  subject: string;
  className: string;
  classId: string;
  dueDate: string;
  submitted: number;
  total: number;
  createdAt: string;
}

interface StudentSubmission {
  studentId: string;
  studentName: string;
  studentCode: string;
  submittedAt: string | null;
  fileUrl: string | null;
  fileName: string | null;
  marks: number | null;
  remarks: string | null;
  submissionId: string | null;
}

// Types imported from @/types/exam

const TeacherDashboard = () => {
  const { t } = useTranslation();
  const dateLocale = getDateLocale();
  const [activeTab, setActiveTab] = useState("homework");
  const [loading, setLoading] = useState(true);
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [recentHomework, setRecentHomework] = useState<HomeworkItem[]>([]);

  // Create homework form
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [homeworkTitle, setHomeworkTitle] = useState("");
  const [homeworkDescription, setHomeworkDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Grading state
  const [gradingClassId, setGradingClassId] = useState("");
  const [gradingHomeworkId, setGradingHomeworkId] = useState("");
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [savingGrade, setSavingGrade] = useState<string | null>(null);
  const [grades, setGrades] = useState<{ [key: string]: { marks: string; remarks: string } }>({});

  // Results tab state
  const [resultsClassId, setResultsClassId] = useState("");
  const [resultsSubject, setResultsSubject] = useState("");
  const [examType, setExamType] = useState<ExamType>("weekly_daily");
  const [examTitle, setExamTitle] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");
  const [examDate, setExamDate] = useState("");
  const [recentExams, setRecentExams] = useState<ExamItem[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [studentMarks, setStudentMarks] = useState<StudentMarkEntry[]>([]);
  const [marksInput, setMarksInput] = useState<{ [key: string]: { marks: string; remarks: string; isAbsent: boolean } }>({});
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingStudentMarks, setLoadingStudentMarks] = useState(false);
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [savingMark, setSavingMark] = useState<string | null>(null);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null);
  const [isUpdatingExam, setIsUpdatingExam] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { startTour, hasCompletedTour } = useTour("teacher");

  useEffect(() => {
    fetchTeacherData();
  }, []);

  useEffect(() => {
    if (!loading && !hasCompletedTour) {
      const timer = setTimeout(() => startTour(), 800);
      return () => clearTimeout(timer);
    }
  }, [loading, hasCompletedTour, startTour]);

  useEffect(() => {
    if (gradingHomeworkId) {
      fetchSubmissions();
    }
  }, [gradingHomeworkId]);

  useEffect(() => {
    if (teacherData) {
      fetchExams();
    }
  }, [teacherData]);

  useEffect(() => {
    if (selectedExamId) {
      fetchStudentsForMarking(selectedExamId);
    }
  }, [selectedExamId]);

  const fetchTeacherData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/teacher/login");
        return;
      }

      // Get teacher profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, school_id")
        .eq("id", user.id)
        .single();

      if (profile) {
        setTeacherData({
          id: profile.id,
          name: profile.full_name || "Teacher",
          email: profile.email || "",
          schoolId: profile.school_id || "",
        });
      }

      // Get assigned classes with student counts
      const { data: teacherClasses } = await supabase
        .from("teacher_classes")
        .select(`
          subject,
          class_id,
          classes (
            id,
            name,
            section
          )
        `)
        .eq("teacher_id", user.id);

      if (teacherClasses) {
        // Get student counts for each class
        const classInfoPromises = teacherClasses.map(async (tc) => {
          const classData = tc.classes as { id: string; name: string; section: string } | null;
          if (!classData) return null;

          const { count } = await supabase
            .from("students")
            .select("id", { count: "exact", head: true })
            .eq("class_id", classData.id);

          return {
            id: classData.id,
            name: classData.name,
            section: classData.section,
            subject: tc.subject,
            studentCount: count || 0,
          };
        });

        const classInfoResults = await Promise.all(classInfoPromises);
        setClasses(classInfoResults.filter((c): c is ClassInfo => c !== null));
      }

      // Get homework
      await fetchHomework(user.id);

    } catch (error) {
      if (import.meta.env.DEV) console.error("Error:", error);
      toast({
        variant: "destructive",
        title: t("teacherDashboard.error"),
        description: t("teacherDashboard.loadError"),
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHomework = async (teacherId: string) => {
    try {
      const { data: homework, error: homeworkError } = await supabase
        .from("homework")
        .select(`
          id,
          title,
          description,
          subject,
          due_date,
          created_at,
          class_id,
          classes (
            id,
            name,
            section
          )
        `)
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (homeworkError) {
        if (import.meta.env.DEV) console.error("Error fetching homework:", homeworkError);
        return;
      }

      if (!homework || homework.length === 0) {
        setRecentHomework([]);
        return;
      }

      // Get unique class IDs for batch query
      const classIds = [...new Set(homework.map(hw => hw.class_id))];
      const homeworkIds = homework.map(hw => hw.id);

      // Batch query: Get all submissions for all homework at once
      const { data: allSubmissions } = await supabase
        .from("homework_submissions")
        .select("homework_id")
        .in("homework_id", homeworkIds)
        .not("submitted_at", "is", null);

      // Batch query: Get student counts for all classes at once
      const { data: studentCounts } = await supabase
        .from("students")
        .select("class_id")
        .in("class_id", classIds);

      // Count submissions per homework
      const submissionCounts = new Map<string, number>();
      allSubmissions?.forEach(s => {
        submissionCounts.set(s.homework_id, (submissionCounts.get(s.homework_id) || 0) + 1);
      });

      // Count students per class
      const classCounts = new Map<string, number>();
      studentCounts?.forEach(s => {
        classCounts.set(s.class_id, (classCounts.get(s.class_id) || 0) + 1);
      });

      const homeworkWithCounts = homework.map((hw) => {
        const classData = hw.classes as { id: string; name: string; section: string } | null;

        return {
          id: hw.id,
          title: hw.title,
          description: hw.description || "",
          subject: hw.subject,
          className: classData ? `${classData.name}-${classData.section}` : "Unknown",
          classId: hw.class_id,
          dueDate: new Date(hw.due_date).toLocaleDateString(dateLocale, {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          submitted: submissionCounts.get(hw.id) || 0,
          total: classCounts.get(hw.class_id) || 0,
          createdAt: hw.created_at,
        };
      });

      setRecentHomework(homeworkWithCounts);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error in fetchHomework:", error);
      toast({
        variant: "destructive",
        title: t("teacherDashboard.error"),
        description: t("teacherDashboard.homeworkLoadError"),
      });
    }
  };

  const fetchSubmissions = async () => {
    if (!gradingHomeworkId) return;

    setLoadingSubmissions(true);
    try {
      // Get all students in the class
      const homework = recentHomework.find(h => h.id === gradingHomeworkId);
      if (!homework) return;

      const { data: students } = await supabase
        .from("students")
        .select("id, full_name, student_id")
        .eq("class_id", homework.classId)
        .order("full_name");

      if (!students) return;

      // Get submissions for this homework
      const { data: submissionData } = await supabase
        .from("homework_submissions")
        .select("id, student_id, submitted_at, marks, remarks, file_url, file_name")
        .eq("homework_id", gradingHomeworkId);

      const submissionMap = new Map(
        submissionData?.map(s => [s.student_id, s]) || []
      );

      const studentSubmissions: StudentSubmission[] = students.map(student => {
        const submission = submissionMap.get(student.id);
        return {
          studentId: student.id,
          studentName: student.full_name,
          studentCode: student.student_id,
          submittedAt: submission?.submitted_at || null,
          fileUrl: submission?.file_url || null,
          fileName: submission?.file_name || null,
          marks: submission?.marks ?? null,
          remarks: submission?.remarks || null,
          submissionId: submission?.id || null,
        };
      });

      setSubmissions(studentSubmissions);

      // Initialize grades state
      const initialGrades: { [key: string]: { marks: string; remarks: string } } = {};
      studentSubmissions.forEach(s => {
        initialGrades[s.studentId] = {
          marks: s.marks !== null ? String(s.marks) : "",
          remarks: s.remarks || "",
        };
      });
      setGrades(initialGrades);

    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching submissions:", error);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleCreateHomework = async () => {
    if (!selectedClass || !selectedSubject || !homeworkTitle.trim() || !dueDate) {
      toast({
        variant: "destructive",
        title: t("teacherDashboard.missingInfo"),
        description: t("teacherDashboard.fillRequiredFields"),
      });
      return;
    }

    if (!teacherData) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("homework").insert({
        school_id: teacherData.schoolId,
        class_id: selectedClass,
        teacher_id: teacherData.id,
        title: homeworkTitle.trim(),
        description: homeworkDescription.trim() || null,
        subject: selectedSubject,
        due_date: dueDate,
      });

      if (error) throw error;

      toast({
        title: t("teacherDashboard.homeworkPosted"),
        description: t("teacherDashboard.homeworkPostedDesc"),
      });

      // Reset form
      setHomeworkTitle("");
      setHomeworkDescription("");
      setDueDate("");
      setSelectedClass("");
      setSelectedSubject("");

      // Refresh homework list
      await fetchHomework(teacherData.id);

    } catch (error) {
      if (import.meta.env.DEV) console.error("Error creating homework:", error);
      toast({
        variant: "destructive",
        title: t("teacherDashboard.homeworkNotPosted"),
        description: t("teacherDashboard.homeworkNotPostedDesc"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveGrade = async (studentId: string) => {
    const grade = grades[studentId];
    if (!grade) return;

    const marksNum = grade.marks ? parseInt(grade.marks) : null;
    if (grade.marks && (isNaN(marksNum!) || marksNum! < 0 || marksNum! > 10)) {
      toast({
        variant: "destructive",
        title: t("teacherDashboard.invalidMarks"),
        description: t("teacherDashboard.marksRange"),
      });
      return;
    }

    setSavingGrade(studentId);

    try {
      const submission = submissions.find(s => s.studentId === studentId);

      if (submission?.submissionId) {
        // Update existing submission
        const { error } = await supabase
          .from("homework_submissions")
          .update({
            marks: marksNum,
            remarks: grade.remarks || null,
          })
          .eq("id", submission.submissionId);

        if (error) throw error;
      } else {
        // Create new submission record for grading (even if student didn't submit file)
        const { error } = await supabase
          .from("homework_submissions")
          .insert({
            homework_id: gradingHomeworkId,
            student_id: studentId,
            marks: marksNum,
            remarks: grade.remarks || null,
          });

        if (error) throw error;
      }

      toast({
        title: t("teacherDashboard.gradeSaved"),
        description: t("teacherDashboard.gradeSavedDesc", { name: submission?.studentName || "student" }),
      });

      // Refresh submissions
      await fetchSubmissions();

    } catch (error) {
      if (import.meta.env.DEV) console.error("Error saving grade:", error);
      toast({
        variant: "destructive",
        title: t("teacherDashboard.error"),
        description: t("teacherDashboard.gradeError"),
      });
    } finally {
      setSavingGrade(null);
    }
  };

  const getSubjectsForClass = (classId: string) => {
    return classes.filter(c => c.id === classId).map(c => c.subject);
  };

  const getHomeworkForClass = (classId: string) => {
    return recentHomework.filter(h => h.classId === classId);
  };

  const fetchExams = async () => {
    if (!teacherData) return;

    setLoadingExams(true);
    try {
      const { data: examsData, error: examsError } = await supabase
        .from("exam_results")
        .select(`
          id,
          title,
          subject,
          exam_type,
          max_marks,
          exam_date,
          class_id,
          classes (
            id,
            name,
            section
          )
        `)
        .eq("teacher_id", teacherData.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (examsError) {
        if (import.meta.env.DEV) console.error("Error fetching exams:", examsError);
        toast({
          variant: "destructive",
          title: t("teacherDashboard.error"),
          description: t("teacherDashboard.examLoadError"),
        });
        return;
      }

      if (!examsData || examsData.length === 0) {
        setRecentExams([]);
        return;
      }

      // Get unique class IDs and exam IDs for batch queries
      const classIds = [...new Set(examsData.map(exam => exam.class_id))];
      const examIds = examsData.map(exam => exam.id);

      // Batch query: Get all marks for all exams at once
      const { data: allMarks } = await supabase
        .from("student_exam_marks")
        .select("exam_id")
        .in("exam_id", examIds)
        .not("marks_obtained", "is", null);

      // Batch query: Get student counts for all classes at once
      const { data: studentCounts } = await supabase
        .from("students")
        .select("class_id")
        .in("class_id", classIds);

      // Count marks per exam
      const markCounts = new Map<string, number>();
      allMarks?.forEach(m => {
        markCounts.set(m.exam_id, (markCounts.get(m.exam_id) || 0) + 1);
      });

      // Count students per class
      const classCounts = new Map<string, number>();
      studentCounts?.forEach(s => {
        classCounts.set(s.class_id, (classCounts.get(s.class_id) || 0) + 1);
      });

      const examsWithCounts = examsData.map((exam) => {
        const classData = exam.classes as { id: string; name: string; section: string } | null;

        return {
          id: exam.id,
          title: exam.title,
          subject: exam.subject,
          examType: exam.exam_type as ExamType,
          maxMarks: exam.max_marks,
          examDate: new Date(exam.exam_date).toLocaleDateString(dateLocale, {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          rawExamDate: exam.exam_date,
          className: classData ? `${classData.name}-${classData.section}` : "Unknown",
          classId: exam.class_id,
          markedCount: markCounts.get(exam.id) || 0,
          totalStudents: classCounts.get(exam.class_id) || 0,
        };
      });

      setRecentExams(examsWithCounts);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error in fetchExams:", error);
      toast({
        variant: "destructive",
        title: t("teacherDashboard.error"),
        description: t("teacherDashboard.examLoadError"),
      });
    } finally {
      setLoadingExams(false);
    }
  };

  const handleCreateExam = async () => {
    if (!resultsClassId || !resultsSubject || !examTitle.trim() || !examDate || !maxMarks) {
      toast({
        variant: "destructive",
        title: t("teacherDashboard.missingInfo"),
        description: t("teacherDashboard.fillRequiredFields"),
      });
      return;
    }

    const maxMarksNum = parseInt(maxMarks);
    if (isNaN(maxMarksNum) || maxMarksNum < 1 || maxMarksNum > 1000) {
      toast({
        variant: "destructive",
        title: t("teacherDashboard.invalidMaxMarks"),
        description: t("teacherDashboard.maxMarksRange"),
      });
      return;
    }

    if (!teacherData) return;

    setIsCreatingExam(true);
    try {
      const { error } = await supabase.from("exam_results").insert({
        school_id: teacherData.schoolId,
        class_id: resultsClassId,
        teacher_id: teacherData.id,
        title: examTitle.trim(),
        subject: resultsSubject,
        exam_type: examType,
        max_marks: maxMarksNum,
        exam_date: examDate,
      });

      if (error) throw error;

      toast({
        title: t("teacherDashboard.examCreated"),
        description: t("teacherDashboard.examCreatedDesc"),
      });

      // Reset form
      setExamTitle("");
      setMaxMarks("100");
      setExamDate("");
      setResultsClassId("");
      setResultsSubject("");
      setExamType("weekly_daily");

      // Refresh exams list
      await fetchExams();

    } catch (error) {
      if (import.meta.env.DEV) console.error("Error creating exam:", error);
      toast({
        variant: "destructive",
        title: t("teacherDashboard.examNotCreated"),
        description: t("teacherDashboard.examNotCreatedDesc"),
      });
    } finally {
      setIsCreatingExam(false);
    }
  };

  const fetchStudentsForMarking = async (examId: string) => {
    setLoadingStudentMarks(true);
    try {
      const exam = recentExams.find(e => e.id === examId);
      if (!exam) return;

      // Get all students in the class
      const { data: students } = await supabase
        .from("students")
        .select("id, full_name, student_id")
        .eq("class_id", exam.classId)
        .order("full_name");

      if (!students) return;

      // Get existing marks for this exam
      const { data: marksData } = await supabase
        .from("student_exam_marks")
        .select("id, student_id, marks_obtained, remarks, is_absent")
        .eq("exam_id", examId);

      const marksMap = new Map(
        marksData?.map(m => [m.student_id, m]) || []
      );

      const studentMarkEntries: StudentMarkEntry[] = students.map(student => {
        const mark = marksMap.get(student.id);
        return {
          studentId: student.id,
          studentName: student.full_name,
          studentCode: student.student_id,
          marksObtained: mark?.marks_obtained ?? null,
          remarks: mark?.remarks || null,
          isAbsent: mark?.is_absent || false,
          markId: mark?.id || null,
        };
      });

      setStudentMarks(studentMarkEntries);

      // Initialize marks input state
      const initialMarksInput: { [key: string]: { marks: string; remarks: string; isAbsent: boolean } } = {};
      studentMarkEntries.forEach(s => {
        initialMarksInput[s.studentId] = {
          marks: s.marksObtained !== null ? String(s.marksObtained) : "",
          remarks: s.remarks || "",
          isAbsent: s.isAbsent,
        };
      });
      setMarksInput(initialMarksInput);

    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching students for marking:", error);
    } finally {
      setLoadingStudentMarks(false);
    }
  };

  const handleSaveMark = async (studentId: string) => {
    const input = marksInput[studentId];
    if (!input) return;

    const exam = recentExams.find(e => e.id === selectedExamId);
    if (!exam) return;

    const student = studentMarks.find(s => s.studentId === studentId);
    if (!student) return;

    // Validate marks
    let marksNum: number | null = null;
    if (!input.isAbsent && input.marks) {
      marksNum = parseInt(input.marks);
      if (isNaN(marksNum) || marksNum < 0 || marksNum > exam.maxMarks) {
        toast({
          variant: "destructive",
          title: t("teacherDashboard.invalidMarks"),
          description: t("teacherDashboard.marksRangeMax", { max: exam.maxMarks }),
        });
        return;
      }
    }

    setSavingMark(studentId);

    try {
      if (student.markId) {
        // Update existing mark
        const { error } = await supabase
          .from("student_exam_marks")
          .update({
            marks_obtained: input.isAbsent ? null : marksNum,
            remarks: input.remarks || null,
            is_absent: input.isAbsent,
          })
          .eq("id", student.markId);

        if (error) throw error;
      } else {
        // Create new mark
        const { error } = await supabase
          .from("student_exam_marks")
          .insert({
            exam_id: selectedExamId,
            student_id: studentId,
            marks_obtained: input.isAbsent ? null : marksNum,
            remarks: input.remarks || null,
            is_absent: input.isAbsent,
          });

        if (error) throw error;
      }

      toast({
        title: t("teacherDashboard.markSaved"),
        description: t("teacherDashboard.markSavedDesc", { name: student.studentName }),
      });

      // Refresh student marks
      await fetchStudentsForMarking(selectedExamId);
      // Refresh exams to update marked count
      await fetchExams();

    } catch (error) {
      if (import.meta.env.DEV) console.error("Error saving mark:", error);
      toast({
        variant: "destructive",
        title: t("teacherDashboard.error"),
        description: t("teacherDashboard.markSaveError"),
      });
    } finally {
      setSavingMark(null);
    }
  };

  const handleBulkSaveMarks = async () => {
    if (!selectedExamId || studentMarks.length === 0) return;

    const exam = recentExams.find(e => e.id === selectedExamId);
    if (!exam) return;

    setIsBulkSaving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Prepare all marks data
      const marksToUpdate: Array<{
        studentId: string;
        markId: string | null;
        marksObtained: number | null;
        remarks: string | null;
        isAbsent: boolean;
      }> = [];

      for (const student of studentMarks) {
        const input = marksInput[student.studentId];
        if (!input) continue;

        // Validate marks
        let marksNum: number | null = null;
        if (!input.isAbsent && input.marks) {
          marksNum = parseInt(input.marks);
          if (isNaN(marksNum) || marksNum < 0 || marksNum > exam.maxMarks) {
            errorCount++;
            continue;
          }
        }

        marksToUpdate.push({
          studentId: student.studentId,
          markId: student.markId,
          marksObtained: input.isAbsent ? null : marksNum,
          remarks: input.remarks || null,
          isAbsent: input.isAbsent,
        });
      }

      // Separate inserts and updates
      const toInsert = marksToUpdate.filter(m => !m.markId);
      const toUpdate = marksToUpdate.filter(m => m.markId);

      // Bulk insert new marks
      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("student_exam_marks")
          .insert(
            toInsert.map(m => ({
              exam_id: selectedExamId,
              student_id: m.studentId,
              marks_obtained: m.marksObtained,
              remarks: m.remarks,
              is_absent: m.isAbsent,
            }))
          );

        if (insertError) {
          if (import.meta.env.DEV) console.error("Bulk insert error:", insertError);
          errorCount += toInsert.length;
        } else {
          successCount += toInsert.length;
        }
      }

      // Bulk update existing marks (unfortunately Supabase doesn't support bulk update with different values)
      // So we need to do individual updates, but we can run them in parallel
      if (toUpdate.length > 0) {
        const updatePromises = toUpdate.map(async (m) => {
          const { error } = await supabase
            .from("student_exam_marks")
            .update({
              marks_obtained: m.marksObtained,
              remarks: m.remarks,
              is_absent: m.isAbsent,
            })
            .eq("id", m.markId!);

          return { error, studentId: m.studentId };
        });

        const results = await Promise.all(updatePromises);
        results.forEach(r => {
          if (r.error) {
            if (import.meta.env.DEV) console.error("Update error for", r.studentId, r.error);
            errorCount++;
          } else {
            successCount++;
          }
        });
      }

      if (successCount > 0) {
        toast({
          title: t("teacherDashboard.marksSaved"),
          description: errorCount > 0
            ? t("teacherDashboard.marksSavedWithErrors", { success: successCount, errors: errorCount })
            : t("teacherDashboard.marksSavedDesc", { count: successCount }),
        });
        setHasUnsavedChanges(false);

        // SMS/WhatsApp notifications for low marks - disabled for now, enable when needed
        // if (teacherData?.schoolId) {
        //   const notificationStatus = await getSchoolNotificationStatus(teacherData.schoolId);
        //   if (notificationStatus.enabled) {
        //     const PASSING_THRESHOLD = 40;
        //     const lowMarksStudents = marksToUpdate.filter(m => {
        //       if (m.isAbsent || m.marksObtained === null) return false;
        //       const percentage = (m.marksObtained / exam.maxMarks) * 100;
        //       return percentage < PASSING_THRESHOLD;
        //     });
        //     let notificationsSent = 0;
        //     for (const lowStudent of lowMarksStudents) {
        //       const studentData = studentMarks.find(s => s.studentId === lowStudent.studentId);
        //       if (studentData) {
        //         const result = await sendLowMarksNotification(
        //           teacherData.schoolId, lowStudent.studentId, studentData.studentName,
        //           `${exam.className}${exam.classSection ? `-${exam.classSection}` : ''}`,
        //           exam.subject, exam.title, lowStudent.marksObtained || 0, exam.maxMarks
        //         );
        //         if (result.success) notificationsSent++;
        //       }
        //     }
        //     if (notificationsSent > 0) {
        //       toast({ title: "Parents Notified", description: `${notificationsSent} parent(s) notified about low marks.` });
        //     }
        //   }
        // }
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          variant: "destructive",
          title: t("teacherDashboard.saveFailed"),
          description: t("teacherDashboard.saveFailedDesc"),
        });
      }

      // Refresh data
      await fetchStudentsForMarking(selectedExamId);
      await fetchExams();

    } catch (error) {
      if (import.meta.env.DEV) console.error("Bulk save error:", error);
      toast({
        variant: "destructive",
        title: t("teacherDashboard.error"),
        description: t("teacherDashboard.bulkSaveError"),
      });
    } finally {
      setIsBulkSaving(false);
    }
  };

  // Track unsaved changes
  const handleMarksInputChange = (studentId: string, field: 'marks' | 'remarks' | 'isAbsent', value: string | boolean) => {
    setHasUnsavedChanges(true);
    setMarksInput((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
        ...(field === 'isAbsent' && value === true ? { marks: "" } : {}),
      },
    }));
  };

  const handleEditExam = (examId: string) => {
    const exam = recentExams.find(e => e.id === examId);
    if (!exam) return;

    // Populate form with exam data
    setResultsClassId(exam.classId);
    setResultsSubject(exam.subject);
    setExamType(exam.examType);
    setExamTitle(exam.title);
    setMaxMarks(String(exam.maxMarks));
    // Use raw date for the input field
    setExamDate(exam.rawExamDate);
    setEditingExamId(examId);
    setSelectedExamId("");
  };

  const handleUpdateExam = async () => {
    if (!editingExamId || !resultsClassId || !resultsSubject || !examTitle || !maxMarks || !examDate) {
      toast({
        variant: "destructive",
        title: t("teacherDashboard.missingFields"),
        description: t("teacherDashboard.fillRequiredFields"),
      });
      return;
    }

    const maxMarksNum = parseInt(maxMarks);
    if (isNaN(maxMarksNum) || maxMarksNum < 1 || maxMarksNum > 1000) {
      toast({
        variant: "destructive",
        title: t("teacherDashboard.invalidMaxMarks"),
        description: t("teacherDashboard.maxMarksRange"),
      });
      return;
    }

    setIsUpdatingExam(true);

    try {
      const { error } = await supabase
        .from("exam_results")
        .update({
          class_id: resultsClassId,
          subject: resultsSubject,
          exam_type: examType,
          title: examTitle,
          max_marks: maxMarksNum,
          exam_date: examDate,
        })
        .eq("id", editingExamId);

      if (error) throw error;

      toast({
        title: t("teacherDashboard.examUpdated"),
        description: t("teacherDashboard.examUpdatedDesc"),
      });

      // Reset form
      setEditingExamId(null);
      setExamTitle("");
      setMaxMarks("100");
      setExamDate("");
      setResultsClassId("");
      setResultsSubject("");
      setExamType("weekly_daily");

      await fetchExams();

    } catch (error) {
      if (import.meta.env.DEV) console.error("Error updating exam:", error);
      toast({
        variant: "destructive",
        title: t("teacherDashboard.error"),
        description: t("teacherDashboard.examUpdateError"),
      });
    } finally {
      setIsUpdatingExam(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingExamId(null);
    setExamTitle("");
    setMaxMarks("100");
    setExamDate("");
    setResultsClassId("");
    setResultsSubject("");
  };

  const handleDeleteExam = async (examId: string) => {
    setDeletingExamId(examId);

    try {
      // Delete exam (cascade will delete marks)
      const { error } = await supabase
        .from("exam_results")
        .delete()
        .eq("id", examId);

      if (error) throw error;

      toast({
        title: t("teacherDashboard.examDeleted"),
        description: t("teacherDashboard.examDeletedDesc"),
      });

      // Clear selection if deleted exam was selected
      if (selectedExamId === examId) {
        setSelectedExamId("");
      }

      await fetchExams();

    } catch (error) {
      if (import.meta.env.DEV) console.error("Error deleting exam:", error);
      toast({
        variant: "destructive",
        title: t("teacherDashboard.error"),
        description: t("teacherDashboard.examDeleteError"),
      });
    } finally {
      setDeletingExamId(null);
    }
  };

  // getExamTypeBadgeColor imported from @/utils/exam

  const uniqueClasses = Array.from(
    new Map(classes.map(c => [c.id, c])).values()
  );

  if (loading) {
    return <DashboardSkeleton roleColor="bg-role-teacher" />;
  }

  const hasClasses = classes.length > 0;
  const hasHomework = recentHomework.length > 0;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="w-full bg-role-teacher text-primary-foreground sticky top-0 z-50" data-tour="teacher-header">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{t("teacherDashboard.title")}</h1>
              <p className="text-xs opacity-80 truncate max-w-[150px] sm:max-w-none">{t("teacherDashboard.welcome")}, {teacherData?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
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
        {/* Welcome Banner */}
        {!hasClasses && (
          <WelcomeBanner
            icon={Sparkles}
            title={t("teacherDashboard.welcomeTitle")}
            description={t("teacherDashboard.welcomeDesc")}
            tips={[
              t("teacherDashboard.welcomeTip1"),
              t("teacherDashboard.welcomeTip2"),
              t("teacherDashboard.welcomeTip3"),
            ]}
            accentColor="bg-role-teacher"
            storageKey="teacher-welcome-dismissed"
            className="mb-6"
          />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full max-w-2xl mx-auto hidden md:grid grid-cols-4 mb-8 bg-card shadow-card" data-tour="teacher-tabs">
            <TabsTrigger value="homework" className="flex items-center gap-2 data-[state=active]:bg-role-teacher data-[state=active]:text-primary-foreground">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">{t("teacherDashboard.tabs.homework")}</span>
            </TabsTrigger>
            <TabsTrigger value="marks" className="flex items-center gap-2 data-[state=active]:bg-role-teacher data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">{t("teacherDashboard.tabs.enterMarks")}</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2 data-[state=active]:bg-role-teacher data-[state=active]:text-primary-foreground" data-tour="teacher-results-tab">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">{t("teacherDashboard.tabs.results")}</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2 data-[state=active]:bg-role-teacher data-[state=active]:text-primary-foreground">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">{t("teacherDashboard.tabs.account")}</span>
            </TabsTrigger>
          </TabsList>

          <SwipeableTabContent activeTab={activeTab} tabOrder={["homework", "marks", "results", "account"]} onTabChange={setActiveTab}>
          <TabsContent value="homework" className="animate-fade-in">
            {!hasClasses ? (
              <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                <EmptyState
                  icon={BookOpen}
                  title={t("teacherDashboard.noClassesTitle")}
                  description={t("teacherDashboard.noClassesDesc")}
                />
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Create Homework Form */}
                <div className="bg-card rounded-xl p-6 shadow-card border border-border" data-tour="teacher-create-hw">
                  <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-role-teacher" />
                    {t("teacherDashboard.createNewHomework")}
                  </h2>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t("teacherDashboard.selectClass")}</Label>
                      <Select
                        value={selectedClass}
                        onValueChange={(value) => {
                          setSelectedClass(value);
                          setSelectedSubject("");
                        }}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("teacherDashboard.chooseClass")} />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueClasses.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}-{cls.section} ({cls.studentCount} students)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("teacherDashboard.selectSubject")}</Label>
                      <Select
                        value={selectedSubject}
                        onValueChange={setSelectedSubject}
                        disabled={isSubmitting || !selectedClass}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={selectedClass ? t("teacherDashboard.chooseSubject") : t("teacherDashboard.selectClassFirst")} />
                        </SelectTrigger>
                        <SelectContent>
                          {getSubjectsForClass(selectedClass).map((subject) => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("teacherDashboard.homeworkTitle")}</Label>
                      <Input
                        placeholder={t("teacherDashboard.homeworkTitlePlaceholder")}
                        value={homeworkTitle}
                        onChange={(e) => setHomeworkTitle(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t("teacherDashboard.descriptionOptional")}</Label>
                      <Textarea
                        placeholder={t("teacherDashboard.descriptionPlaceholder")}
                        rows={4}
                        value={homeworkDescription}
                        onChange={(e) => setHomeworkDescription(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t("teacherDashboard.dueDate")}</Label>
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        disabled={isSubmitting}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>

                    <LoadingButton
                      className="w-full bg-role-teacher text-primary-foreground hover:opacity-90"
                      onClick={handleCreateHomework}
                      loading={isSubmitting}
                      loadingText={t("teacherDashboard.posting")}
                      data-tour="teacher-post-btn"
                    >
                      {t("teacherDashboard.postHomework")}
                    </LoadingButton>
                  </div>
                </div>

                {/* Recent Homework */}
                <div>
                  <FadeInView>
                    <h2 className="text-xl font-bold text-foreground mb-4" data-tour="teacher-recent-hw">{t("teacherDashboard.recentHomework", { count: recentHomework.length })}</h2>
                  </FadeInView>
                  {hasHomework ? (
                    <StaggerContainer className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                      {recentHomework.map((hw) => (
                        <StaggerItem key={hw.id}>
                          <HoverScale>
                            <div className="bg-card rounded-xl p-5 shadow-card border border-border">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-foreground">{hw.title}</h3>
                              <p className="text-sm text-muted-foreground">{hw.className} - {hw.subject}</p>
                            </div>
                            <span className="text-xs text-muted-foreground">Due: {hw.dueDate}</span>
                          </div>
                          {hw.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{hw.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {t("teacherDashboard.submittedCount", { submitted: hw.submitted, total: hw.total })}
                            </span>
                            <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-role-teacher rounded-full transition-all"
                                style={{ width: `${hw.total > 0 ? (hw.submitted / hw.total) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                          </HoverScale>
                        </StaggerItem>
                      ))}
                    </StaggerContainer>
                  ) : (
                    <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                      <EmptyState
                        icon={ClipboardList}
                        title={t("teacherDashboard.noHomeworkTitle")}
                        description={t("teacherDashboard.noHomeworkDesc")}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="marks" className="animate-fade-in">
            {!hasClasses ? (
              <div className="bg-card rounded-xl p-6 shadow-card border border-border max-w-2xl mx-auto">
                <EmptyState
                  icon={Users}
                  title={t("teacherDashboard.noClassesTitle")}
                  description={t("teacherDashboard.noClassesToMarkDesc")}
                />
              </div>
            ) : !hasHomework ? (
              <div className="bg-card rounded-xl p-6 shadow-card border border-border max-w-2xl mx-auto">
                <EmptyState
                  icon={ClipboardList}
                  title={t("teacherDashboard.noHomeworkToMark")}
                  description={t("teacherDashboard.noHomeworkToMarkDesc")}
                  actionLabel={t("teacherDashboard.createHomeworkAction")}
                  onAction={() => setActiveTab("homework")}
                />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                  <h2 className="text-xl font-bold text-foreground mb-6">{t("teacherDashboard.enterHomeworkMarks")}</h2>

                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                      <Label>{t("teacherDashboard.selectClass")}</Label>
                      <Select
                        value={gradingClassId}
                        onValueChange={(value) => {
                          setGradingClassId(value);
                          setGradingHomeworkId("");
                          setSubmissions([]);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("teacherDashboard.chooseClass")} />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueClasses.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}-{cls.section}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("teacherDashboard.selectHomework")}</Label>
                      <Select
                        value={gradingHomeworkId}
                        onValueChange={setGradingHomeworkId}
                        disabled={!gradingClassId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={gradingClassId ? t("teacherDashboard.chooseHomework") : t("teacherDashboard.selectClassFirst")} />
                        </SelectTrigger>
                        <SelectContent>
                          {getHomeworkForClass(gradingClassId).map((hw) => (
                            <SelectItem key={hw.id} value={hw.id}>
                              {hw.title} ({hw.subject})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {!gradingHomeworkId && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {t("teacherDashboard.selectClassAndHomework")}
                    </p>
                  )}
                </div>

                {/* Submissions List */}
                {gradingHomeworkId && (
                  <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      {t("teacherDashboard.studentSubmissions", { submitted: submissions.filter(s => s.submittedAt).length, total: submissions.length })}
                    </h3>

                    {loadingSubmissions ? (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 border-4 border-role-teacher border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-muted-foreground">{t("teacherDashboard.loadingSubmissions")}</p>
                      </div>
                    ) : submissions.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">{t("teacherDashboard.noStudents")}</p>
                    ) : (
                      <div className="space-y-4">
                        {submissions.map((submission) => (
                          <div
                            key={submission.studentId}
                            className={`border rounded-lg p-4 ${
                              submission.submittedAt
                                ? "border-success/30 bg-success/5"
                                : "border-border"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                              {/* Student Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-foreground">{submission.studentName}</span>
                                  <span className="text-xs text-muted-foreground">({submission.studentCode})</span>
                                </div>
                                {submission.submittedAt ? (
                                  <div className="flex items-center gap-2 text-sm text-success">
                                    <Check className="w-4 h-4" />
                                    {t("teacherDashboard.submittedDate", { date: new Date(submission.submittedAt).toLocaleDateString(dateLocale) })}
                                    {submission.fileUrl && (
                                      <a
                                        href={submission.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-primary hover:underline ml-2"
                                      >
                                        <FileText className="w-3 h-3" />
                                        {submission.fileName || t("teacherDashboard.viewFile")}
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <X className="w-4 h-4" />
                                    {t("teacherDashboard.notSubmitted")}
                                  </div>
                                )}
                              </div>

                              {/* Grading Inputs */}
                              <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
                                <div className="w-20">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="10"
                                    placeholder="0-10"
                                    value={grades[submission.studentId]?.marks || ""}
                                    onChange={(e) =>
                                      setGrades((prev) => ({
                                        ...prev,
                                        [submission.studentId]: {
                                          ...prev[submission.studentId],
                                          marks: e.target.value,
                                        },
                                      }))
                                    }
                                    className="text-center"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <Input
                                    placeholder={t("teacherDashboard.remarksOptional")}
                                    value={grades[submission.studentId]?.remarks || ""}
                                    onChange={(e) =>
                                      setGrades((prev) => ({
                                        ...prev,
                                        [submission.studentId]: {
                                          ...prev[submission.studentId],
                                          remarks: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </div>
                                <LoadingButton
                                  size="sm"
                                  onClick={() => handleSaveGrade(submission.studentId)}
                                  loading={savingGrade === submission.studentId}
                                  loadingText=""
                                  className="bg-role-teacher flex-shrink-0"
                                >
                                  {t("teacherDashboard.save")}
                                </LoadingButton>
                              </div>
                            </div>

                            {submission.marks !== null && (
                              <div className="mt-2 pt-2 border-t border-border/50 text-sm">
                                <span className="text-muted-foreground">{t("teacherDashboard.currentGrade")} </span>
                                <span className="font-semibold text-primary">{submission.marks}/10</span>
                                {submission.remarks && (
                                  <span className="text-muted-foreground ml-2">- "{submission.remarks}"</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="animate-fade-in">
            {!hasClasses ? (
              <div className="bg-card rounded-xl p-6 shadow-card border border-border max-w-2xl mx-auto">
                <EmptyState
                  icon={Award}
                  title={t("teacherDashboard.noClassesTitle")}
                  description={t("teacherDashboard.noClassesToResultsDesc")}
                />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Create/Edit Exam Form */}
                <div className={`bg-card rounded-xl p-6 shadow-card border ${editingExamId ? 'border-role-teacher ring-2 ring-role-teacher/20' : 'border-border'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      {editingExamId ? (
                        <>
                          <Pencil className="w-5 h-5 text-role-teacher" />
                          {t("teacherDashboard.editExam")}
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5 text-role-teacher" />
                          {t("teacherDashboard.createNewExam")}
                        </>
                      )}
                    </h2>
                    {editingExamId && (
                      <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                        <X className="w-4 h-4 mr-1" />
                        {t("teacherDashboard.cancel")}
                      </Button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{t("teacherDashboard.selectClass")}</Label>
                      <Select
                        value={resultsClassId}
                        onValueChange={(value) => {
                          setResultsClassId(value);
                          setResultsSubject("");
                        }}
                        disabled={isCreatingExam}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("teacherDashboard.chooseClass")} />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueClasses.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}-{cls.section}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("teacherDashboard.selectSubject")}</Label>
                      <Select
                        value={resultsSubject}
                        onValueChange={setResultsSubject}
                        disabled={isCreatingExam || !resultsClassId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={resultsClassId ? t("teacherDashboard.chooseSubject") : t("teacherDashboard.selectClassFirst")} />
                        </SelectTrigger>
                        <SelectContent>
                          {getSubjectsForClass(resultsClassId).map((subject) => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("teacherDashboard.testType")}</Label>
                      <Select
                        value={examType}
                        onValueChange={(value) => setExamType(value as ExamType)}
                        disabled={isCreatingExam}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly_daily">{t("teacherDashboard.weeklyDaily")}</SelectItem>
                          <SelectItem value="monthly_midterm">{t("teacherDashboard.monthlyMidterm")}</SelectItem>
                          <SelectItem value="semester_final">{t("teacherDashboard.semesterFinal")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("teacherDashboard.examTitle")}</Label>
                      <Input
                        placeholder={t("teacherDashboard.examTitlePlaceholder")}
                        value={examTitle}
                        onChange={(e) => setExamTitle(e.target.value)}
                        disabled={isCreatingExam}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t("teacherDashboard.maxMarks")}</Label>
                      <Input
                        type="number"
                        min="1"
                        max="1000"
                        placeholder="100"
                        value={maxMarks}
                        onChange={(e) => setMaxMarks(e.target.value)}
                        disabled={isCreatingExam}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t("teacherDashboard.examDate")}</Label>
                      <Input
                        type="date"
                        value={examDate}
                        onChange={(e) => setExamDate(e.target.value)}
                        disabled={isCreatingExam}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <LoadingButton
                      className="bg-role-teacher text-primary-foreground hover:opacity-90"
                      onClick={editingExamId ? handleUpdateExam : handleCreateExam}
                      loading={isCreatingExam || isUpdatingExam}
                      loadingText={editingExamId ? t("teacherDashboard.updating") : t("teacherDashboard.creating")}
                    >
                      {editingExamId ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          {t("teacherDashboard.updateExam")}
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          {t("teacherDashboard.createExam")}
                        </>
                      )}
                    </LoadingButton>
                    {editingExamId && (
                      <Button variant="outline" onClick={handleCancelEdit}>
                        {t("teacherDashboard.cancel")}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Recent Exams List */}
                <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                  <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-role-teacher" />
                    {t("teacherDashboard.recentExams", { count: recentExams.length })}
                  </h2>

                  {loadingExams ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-role-teacher border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-muted-foreground">{t("teacherDashboard.loadingExams")}</p>
                    </div>
                  ) : recentExams.length === 0 ? (
                    <EmptyState
                      icon={Award}
                      title={t("teacherDashboard.noExamsTitle")}
                      description={t("teacherDashboard.noExamsDesc")}
                    />
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recentExams.map((exam) => (
                        <div
                          key={exam.id}
                          className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                            selectedExamId === exam.id ? "border-role-teacher ring-2 ring-role-teacher/20" : "border-border"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3
                              className="font-semibold text-foreground cursor-pointer hover:text-role-teacher"
                              onClick={() => setSelectedExamId(exam.id)}
                            >
                              {exam.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${getExamTypeBadgeColor(exam.examType)}`}>
                                {exam.examType === 'weekly_daily' ? t("teacherDashboard.weekly") : exam.examType === 'monthly_midterm' ? t("teacherDashboard.monthly") : t("teacherDashboard.semester")}
                              </span>
                            </div>
                          </div>
                          <p
                            className="text-sm text-muted-foreground mb-1 cursor-pointer"
                            onClick={() => setSelectedExamId(exam.id)}
                          >
                            {exam.subject} - {exam.className}
                          </p>
                          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {exam.examDate}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {t("teacherDashboard.markedCount", { marked: exam.markedCount, total: exam.totalStudents })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {t("teacherDashboard.maxLabel", { max: exam.maxMarks })}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mt-2">
                            <div
                              className="h-full bg-role-teacher rounded-full transition-all"
                              style={{ width: `${exam.totalStudents > 0 ? (exam.markedCount / exam.totalStudents) * 100 : 0}%` }}
                            />
                          </div>
                          {/* Edit/Delete Actions */}
                          <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditExam(exam.id);
                              }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="w-4 h-4 mr-1" />
                              {t("teacherDashboard.edit")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(t("teacherDashboard.deleteConfirm", { title: exam.title }))) {
                                  handleDeleteExam(exam.id);
                                }
                              }}
                              disabled={deletingExamId === exam.id}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              {deletingExamId === exam.id ? (
                                <span className="animate-spin">⏳</span>
                              ) : (
                                <Trash2 className="w-4 h-4 mr-1" />
                              )}
                              {t("teacherDashboard.delete")}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Enter Marks Section */}
                {selectedExamId && (
                  <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                      <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2 flex-wrap">
                        <FileText className="w-5 h-5 text-role-teacher flex-shrink-0" />
                        <span>{t("teacherDashboard.enterMarksTitle", { title: recentExams.find(e => e.id === selectedExamId)?.title })}</span>
                        <span className="text-sm font-normal text-muted-foreground">
                          {t("teacherDashboard.maxMarksLabel", { max: recentExams.find(e => e.id === selectedExamId)?.maxMarks })}
                        </span>
                      </h2>
                      <LoadingButton
                        onClick={handleBulkSaveMarks}
                        loading={isBulkSaving}
                        loadingText={t("teacherDashboard.savingAll")}
                        className="bg-role-teacher flex-shrink-0 w-full sm:w-auto"
                        disabled={!hasUnsavedChanges && !studentMarks.some(s => !s.markId)}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {t("teacherDashboard.saveAllMarks")}
                      </LoadingButton>
                    </div>

                    {loadingStudentMarks ? (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 border-4 border-role-teacher border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-muted-foreground">{t("teacherDashboard.loadingStudents")}</p>
                      </div>
                    ) : studentMarks.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">{t("teacherDashboard.noStudents")}</p>
                    ) : (
                      <div className="space-y-4">
                        {studentMarks.map((student) => {
                          const exam = recentExams.find(e => e.id === selectedExamId);
                          const currentInput = marksInput[student.studentId] || { marks: "", remarks: "", isAbsent: false };

                          return (
                            <div
                              key={student.studentId}
                              className={`border rounded-lg p-4 ${
                                student.marksObtained !== null || student.isAbsent
                                  ? "border-success/30 bg-success/5"
                                  : "border-border"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                {/* Student Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-foreground">{student.studentName}</span>
                                    <span className="text-xs text-muted-foreground">({student.studentCode})</span>
                                  </div>
                                  {(student.marksObtained !== null || student.isAbsent) && (
                                    <div className="text-sm text-success flex items-center gap-1">
                                      <Check className="w-4 h-4" />
                                      {student.isAbsent ? t("teacherDashboard.markedAbsent") : `${student.marksObtained}/${exam?.maxMarks}`}
                                    </div>
                                  )}
                                </div>

                                {/* Inputs */}
                                <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
                                  <label className="flex items-center gap-2 text-sm flex-shrink-0">
                                    <input
                                      type="checkbox"
                                      checked={currentInput.isAbsent}
                                      onChange={(e) => handleMarksInputChange(student.studentId, 'isAbsent', e.target.checked)}
                                      className="rounded"
                                    />
                                    {t("teacherDashboard.absent")}
                                  </label>

                                  <div className="w-20 sm:w-24 flex-shrink-0">
                                    <Input
                                      type="number"
                                      min="0"
                                      max={exam?.maxMarks || 100}
                                      placeholder={`0-${exam?.maxMarks || 100}`}
                                      value={currentInput.marks}
                                      onChange={(e) => handleMarksInputChange(student.studentId, 'marks', e.target.value)}
                                      disabled={currentInput.isAbsent}
                                      className="text-center"
                                    />
                                  </div>

                                  <div className="flex-1 min-w-0 basis-full sm:basis-auto">
                                    <Input
                                      placeholder={t("teacherDashboard.remarksOptional")}
                                      value={currentInput.remarks}
                                      onChange={(e) => handleMarksInputChange(student.studentId, 'remarks', e.target.value)}
                                    />
                                  </div>

                                  <LoadingButton
                                    size="sm"
                                    onClick={() => handleSaveMark(student.studentId)}
                                    loading={savingMark === student.studentId}
                                    loadingText=""
                                    className="bg-role-teacher flex-shrink-0"
                                  >
                                    {t("teacherDashboard.save")}
                                  </LoadingButton>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-2">{t("common.accountSettings")}</h2>
                <p className="text-muted-foreground text-sm">{t("common.manageProfile")}</p>
              </div>
              <AccountSettings roleColor="bg-role-teacher" />
            </div>
          </TabsContent>
          </SwipeableTabContent>
        </Tabs>
      </motion.main>

      <TourHelpButton onClick={startTour} />

      {/* Mobile Bottom Navigation */}
      <MobileNav
        data-tour="teacher-mobile-nav"
        items={[
          { id: "homework", label: t("teacherDashboard.tabs.homework"), icon: BookOpen },
          { id: "marks", label: t("teacherDashboard.tabs.marks"), icon: Users },
          { id: "results", label: t("teacherDashboard.tabs.results"), icon: Award },
          { id: "account", label: t("teacherDashboard.tabs.account"), icon: Settings },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accentColor="bg-role-teacher"
      />
    </div>
  );
};

export default TeacherDashboard;
