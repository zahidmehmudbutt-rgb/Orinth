import { Helmet } from "react-helmet-async";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FadeInView, StaggerContainer, StaggerItem, HoverScale } from "@/components/ui/motion-wrapper";
import { DashboardSkeleton } from "@/components/ui/skeleton-loader";
import { MobileNav } from "@/components/ui/mobile-nav";
import { SwipeableTabContent } from "@/components/ui/swipeable-tabs";
import { LogOut, Calendar, UserPlus, Users, Trash2, Printer, Settings, Sparkles, RefreshCw, Check, X, Megaphone, BarChart3 } from "lucide-react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { GroupChat } from "@/components/chat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import AccountSettings from "@/components/account/AccountSettings";
import { WelcomeBanner } from "@/components/onboarding/WelcomeBanner";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { sendBulkAbsenceNotifications, getSchoolNotificationStatus } from "@/lib/notifications";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "react-i18next";
import AnnouncementManager from "@/components/announcements/AnnouncementManager";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import { Leaderboard } from "@/components/leaderboard/Leaderboard";
import ChangePassword from "@/components/account/ChangePassword";
import LoginHistory from "@/components/account/LoginHistory";
import { useTour } from "@/hooks/useTour";
import { TourHelpButton } from "@/components/onboarding/TourHelpButton";
import { getClassTeacherTourSteps } from "@/components/onboarding/tour-configs";
import { getDateLocale } from "@/lib/utils/date-locale";
import { BulkStudentImport } from "@/components/import/BulkStudentImport";
import { List } from "react-window";
import type { CSSProperties, ReactElement } from "react";

interface Student {
  id: string;
  student_id: string;
  full_name: string;
  user_id: string | null;
}

interface AttendanceRecord {
  student_id: string;
  is_present: boolean;
  id?: string;
}

interface ClassInfo {
  id: string;
  name: string;
  section: string | null;
}

// Row component for virtualized attendance list (react-window v2 API)
interface AttendanceRowProps {
  students: Student[];
  attendance: AttendanceRecord[];
  toggleAttendance: (studentId: string) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

function AttendanceRow(props: { index: number; style: CSSProperties; ariaAttributes: unknown } & AttendanceRowProps): ReactElement {
  const { index, style, students, attendance, toggleAttendance, t } = props;
  const student = students[index];
  const attendanceRecord = attendance.find(a => a.student_id === student.id);
  const isPresent = attendanceRecord?.is_present ?? true;
  return (
    <div style={{ ...style, paddingBottom: 12 }}>
      <div
        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
          isPresent ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'
        }`}
      >
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isPresent}
            onCheckedChange={() => toggleAttendance(student.id)}
          />
          <div>
            <p className="font-medium text-foreground">{student.full_name}</p>
            <p className="text-xs text-muted-foreground">{student.student_id}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
          isPresent ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
        }`}>
          {isPresent ? t("classTeacherDashboard.present") : t("classTeacherDashboard.absent")}
        </span>
      </div>
    </div>
  );
}

// Row component for virtualized student list (react-window v2 API)
interface StudentListRowProps {
  students: Student[];
  handleRemoveStudent: (student: Student) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

function StudentListRow(props: { index: number; style: CSSProperties; ariaAttributes: unknown } & StudentListRowProps): ReactElement {
  const { index, style, students, handleRemoveStudent, t } = props;
  const student = students[index];
  return (
    <div style={{ ...style, paddingBottom: 12 }}>
      <div className="bg-card rounded-xl p-4 shadow-card border border-border flex items-center justify-between">
        <div>
          <p className="font-medium text-foreground">{student.full_name}</p>
          <p className="text-xs text-muted-foreground">{t("classTeacherDashboard.idPrefix", { id: student.student_id })}</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("classTeacherDashboard.removeStudent")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("classTeacherDashboard.removeStudentConfirm", { name: student.full_name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("classTeacherDashboard.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground"
                onClick={() => handleRemoveStudent(student)}
              >
                {t("classTeacherDashboard.remove")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

const ClassTeacherDashboard = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("attendance");
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceExists, setAttendanceExists] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [assignedClass, setAssignedClass] = useState<ClassInfo | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isClassTeacher, loading } = useAuth();
  const tourSteps = useMemo(() => getClassTeacherTourSteps(), []);
  const { startTour, hasCompletedTour } = useTour("class_teacher", tourSteps);

  const today = new Date().toISOString().split('T')[0];

  // Redirect if not class teacher
  useEffect(() => {
    if (!loading && !isClassTeacher) {
      navigate("/");
    }
  }, [loading, isClassTeacher, navigate]);

  useEffect(() => {
    if (!loading && !isLoading && !hasCompletedTour) {
      const timer = setTimeout(() => startTour(), 800);
      return () => clearTimeout(timer);
    }
  }, [loading, isLoading, hasCompletedTour, startTour]);

  // Load assigned class
  useEffect(() => {
    if (user?.id && profile?.school_id) {
      loadAssignedClass();
    }
  }, [user?.id, profile?.school_id]);

  // Load students when class is loaded
  useEffect(() => {
    if (assignedClass?.id) {
      loadStudents();
      loadTodayAttendance();
    }
  }, [assignedClass?.id]);

  const loadAssignedClass = async () => {
    if (!user?.id || !profile?.school_id) return;

    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, section')
        .eq('class_teacher_id', user.id)
        .eq('school_id', profile.school_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setAssignedClass(data || null);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading assigned class:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudents = async () => {
    if (!assignedClass?.id) return;

    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, student_id, full_name, user_id')
        .eq('class_id', assignedClass.id)
        .order('full_name');

      if (error) throw error;
      setStudents(data || []);

      // Initialize attendance for all students as present
      if (data) {
        setAttendance(data.map(s => ({ student_id: s.id, is_present: true })));
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading students:', error);
      toast({
        variant: "destructive",
        title: t("classTeacherDashboard.toastError"),
        description: t("classTeacherDashboard.toastLoadStudentsFailed"),
      });
    }
  };

  const loadTodayAttendance = async () => {
    if (!assignedClass?.id || !profile?.school_id) return;

    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('id, student_id, is_present')
        .eq('class_id', assignedClass.id)
        .eq('date', today);

      if (error) throw error;

      if (data && data.length > 0) {
        setAttendanceExists(true);
        setAttendance(data.map(a => ({
          student_id: a.student_id,
          is_present: a.is_present,
          id: a.id,
        })));
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading attendance:', error);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const toggleAttendance = (studentId: string) => {
    setAttendance(prev =>
      prev.map(a => a.student_id === studentId ? { ...a, is_present: !a.is_present } : a)
    );
  };

  const handleAddStudent = async () => {
    if (!newStudentName.trim() || !newStudentId.trim()) {
      toast({
        variant: "destructive",
        title: t("classTeacherDashboard.toastMissingInfo"),
        description: t("classTeacherDashboard.toastEnterNameAndId"),
      });
      return;
    }

    if (!assignedClass?.id || !profile?.school_id) {
      toast({
        variant: "destructive",
        title: t("classTeacherDashboard.toastError"),
        description: t("classTeacherDashboard.toastClassNotFound"),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if student ID already exists
      const { data: existing } = await supabase
        .from('students')
        .select('id')
        .eq('student_id', newStudentId.trim())
        .eq('school_id', profile.school_id)
        .single();

      if (existing) {
        toast({
          variant: "destructive",
          title: t("classTeacherDashboard.toastDuplicateId"),
          description: t("classTeacherDashboard.toastDuplicateIdDesc"),
        });
        setIsSubmitting(false);
        return;
      }

      // Use the edge function to create the user (preserves current session)
      const studentEmail = `${newStudentId.trim().toLowerCase()}@student.school`;
      // Ensure password is at least 8 characters (edge function requirement)
      const studentIdTrimmed = newStudentId.trim();
      const studentPassword = studentIdTrimmed.length >= 8
        ? studentIdTrimmed
        : studentIdTrimmed.padEnd(8, '0');

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Not authenticated");

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-school-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          email: studentEmail,
          password: studentPassword,
          fullName: newStudentName.trim(),
          role: 'student',
          schoolId: profile.school_id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to create student account (${res.status})`);
      }

      const userId = data.userId;

      // Create student record
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          student_id: newStudentId.trim(),
          full_name: newStudentName.trim(),
          class_id: assignedClass.id,
          school_id: profile.school_id,
          user_id: userId || null,
        });

      if (studentError) throw studentError;

      toast({
        title: t("classTeacherDashboard.toastStudentAdded"),
        description: t("classTeacherDashboard.toastStudentAddedDesc", { name: newStudentName, email: studentEmail, password: studentPassword }),
      });

      setNewStudentName("");
      setNewStudentId("");
      loadStudents();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error adding student:', error);
      toast({
        variant: "destructive",
        title: t("classTeacherDashboard.toastError"),
        description: error instanceof Error ? error.message : t("classTeacherDashboard.toastStudentAddFailed"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveStudent = async (student: Student) => {
    try {
      // Delete the student record
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', student.id);

      if (error) throw error;

      // Deactivate user role if exists
      if (student.user_id) {
        await supabase
          .from('user_roles')
          .update({ is_active: false })
          .eq('user_id', student.user_id)
          .eq('role', 'student');
      }

      toast({
        title: t("classTeacherDashboard.toastStudentRemoved"),
        description: t("classTeacherDashboard.toastStudentRemovedDesc", { name: student.full_name }),
      });

      loadStudents();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error removing student:', error);
      toast({
        variant: "destructive",
        title: t("classTeacherDashboard.toastError"),
        description: error instanceof Error ? error.message : t("classTeacherDashboard.toastStudentRemoveFailed"),
      });
    }
  };

  const handleSaveAttendance = async () => {
    if (!assignedClass?.id || !profile?.school_id || !user?.id) {
      toast({
        variant: "destructive",
        title: t("classTeacherDashboard.toastError"),
        description: t("classTeacherDashboard.toastMissingRequired"),
      });
      return;
    }

    setIsSavingAttendance(true);
    try {
      if (attendanceExists) {
        // Update existing attendance records
        const updates = attendance
          .filter(record => record.id)
          .map(record => ({
            id: record.id,
            is_present: record.is_present,
          }));

        for (const update of updates) {
          const { error: updateError } = await supabase
            .from('attendance')
            .update({ is_present: update.is_present })
            .eq('id', update.id);

          if (updateError) throw updateError;
        }
      } else {
        // Insert new attendance records
        const records = attendance.map(a => ({
          student_id: a.student_id,
          class_id: assignedClass.id,
          school_id: profile.school_id,
          date: today,
          is_present: a.is_present,
          marked_by: user.id,
        }));

        const { error } = await supabase
          .from('attendance')
          .insert(records);

        if (error) throw error;
        setAttendanceExists(true);
      }

      toast({
        title: t("classTeacherDashboard.toastAttendanceSaved"),
        description: t("classTeacherDashboard.toastAttendanceSavedDesc"),
      });

      // SMS/WhatsApp notifications - disabled for now, enable when needed
      // const notificationStatus = await getSchoolNotificationStatus(profile.school_id);
      // if (notificationStatus.enabled) {
      //   const absentStudents = attendance
      //     .filter(a => !a.is_present)
      //     .map(a => {
      //       const student = students.find(s => s.id === a.student_id);
      //       return {
      //         studentId: a.student_id,
      //         studentName: student?.full_name || "Student",
      //         className: `${assignedClass.name}${assignedClass.section ? `-${assignedClass.section}` : ""}`,
      //       };
      //     });
      //   if (absentStudents.length > 0) {
      //     const notifyResult = await sendBulkAbsenceNotifications(
      //       profile.school_id,
      //       absentStudents,
      //       today
      //     );
      //     if (notifyResult.sent > 0) {
      //       toast({
      //         title: "Parents Notified",
      //         description: `${notifyResult.sent} parent(s) notified about absent students.`,
      //       });
      //     }
      //   }
      // }

      loadTodayAttendance();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error saving attendance:', error);
      toast({
        variant: "destructive",
        title: t("classTeacherDashboard.toastError"),
        description: error instanceof Error ? error.message : t("classTeacherDashboard.toastAttendanceFailed"),
      });
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const hasStudents = students.length > 0;
  const presentCount = attendance.filter(a => a.is_present).length;
  const absentCount = attendance.filter(a => !a.is_present).length;

  // Onboarding checklist
  const checklistItems = [
    {
      id: "profile",
      label: t("classTeacherDashboard.completeProfile"),
      description: t("classTeacherDashboard.addPhoneAddress"),
      completed: profile?.first_login_complete || false,
      onClick: () => setActiveTab("account"),
    },
    {
      id: "students",
      label: t("classTeacherDashboard.addFirstStudents"),
      description: t("classTeacherDashboard.addStudentsToClass"),
      completed: hasStudents,
      onClick: () => setActiveTab("students"),
    },
    {
      id: "attendance",
      label: t("classTeacherDashboard.markFirstAttendance"),
      description: t("classTeacherDashboard.startTrackingAttendance"),
      completed: attendanceExists,
      onClick: () => setActiveTab("attendance"),
    },
  ];

  if (loading || isLoading) {
    return <DashboardSkeleton roleColor="bg-role-class-teacher" />;
  }

  if (!assignedClass) {
    return (
      <div className="min-h-screen bg-background">
        <header className="w-full bg-role-class-teacher text-primary-foreground sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold">{t("classTeacherDashboard.title")}</h1>
                <p className="text-xs opacity-80 truncate max-w-[150px] sm:max-w-none">{profile?.full_name || t("classTeacherDashboard.classTeacher")}</p>
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
        <main className="container mx-auto px-4 py-6">
          <div className="bg-card rounded-xl p-8 shadow-card border border-border max-w-md mx-auto text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">{t("classTeacherDashboard.noClassAssigned")}</h2>
            <p className="text-muted-foreground">
              {t("classTeacherDashboard.noClassAssignedDesc")}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Class Teacher Dashboard — School Management System</title></Helmet>
      <header className="w-full bg-role-class-teacher text-primary-foreground sticky top-0 z-50" data-tour="ct-header">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{t("classTeacherDashboard.title")}</h1>
              <p className="text-xs opacity-80 truncate max-w-[150px] sm:max-w-none">
                {profile?.full_name || t("classTeacherDashboard.classTeacher")} - {assignedClass.name}{assignedClass.section ? ` (${assignedClass.section})` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { loadStudents(); loadTodayAttendance(); }}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
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
        {!hasStudents && (
          <WelcomeBanner
            icon={Sparkles}
            title={t("classTeacherDashboard.welcomeTitle")}
            description={t("classTeacherDashboard.welcomeDesc")}
            tips={[
              t("classTeacherDashboard.welcomeTip1"),
              t("classTeacherDashboard.welcomeTip2"),
              t("classTeacherDashboard.welcomeTip3"),
            ]}
            accentColor="bg-role-class-teacher"
            storageKey="class-teacher-welcome-dismissed"
            className="mb-6"
          />
        )}

        {/* Stats Cards */}
        <div data-tour="ct-stats">
        <StaggerContainer className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
          <StaggerItem>
            <HoverScale>
              <div className="bg-card rounded-xl p-4 shadow-card border border-border h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{students.length}</p>
                    <p className="text-sm text-muted-foreground">{t("classTeacherDashboard.totalStudents")}</p>
                  </div>
                </div>
              </div>
            </HoverScale>
          </StaggerItem>
          <StaggerItem>
            <HoverScale>
              <div className="bg-card rounded-xl p-4 shadow-card border border-border h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                    <Check className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{presentCount}</p>
                    <p className="text-sm text-muted-foreground">{t("classTeacherDashboard.presentToday")}</p>
                  </div>
                </div>
              </div>
            </HoverScale>
          </StaggerItem>
          <StaggerItem>
            <HoverScale>
              <div className="bg-card rounded-xl p-4 shadow-card border border-border h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <X className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{absentCount}</p>
                    <p className="text-sm text-muted-foreground">{t("classTeacherDashboard.absentToday")}</p>
                  </div>
                </div>
              </div>
            </HoverScale>
          </StaggerItem>
        </StaggerContainer>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop tabs - hidden on mobile where MobileNav handles navigation */}
          <TabsList className="hidden md:grid w-full max-w-2xl mx-auto grid-cols-5 mb-8 bg-card shadow-card" data-tour="ct-tabs">
            <TabsTrigger value="attendance" className="flex items-center gap-2 data-[state=active]:bg-role-class-teacher data-[state=active]:text-primary-foreground">
              <Calendar className="w-4 h-4" />
              {t("classTeacherDashboard.tabs.attendance")}
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2 data-[state=active]:bg-role-class-teacher data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4" />
              {t("classTeacherDashboard.tabs.students")}
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2 data-[state=active]:bg-role-class-teacher data-[state=active]:text-primary-foreground">
              <Megaphone className="w-4 h-4" />
              {t("classTeacherDashboard.tabs.announce")}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-role-class-teacher data-[state=active]:text-primary-foreground">
              <BarChart3 className="w-4 h-4" />
              {t("classTeacherDashboard.tabs.analytics")}
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2 data-[state=active]:bg-role-class-teacher data-[state=active]:text-primary-foreground">
              <Settings className="w-4 h-4" />
              {t("classTeacherDashboard.tabs.account")}
            </TabsTrigger>
          </TabsList>

          <SwipeableTabContent activeTab={activeTab} tabOrder={["attendance", "students", "announcements", "analytics", "account"]} onTabChange={setActiveTab}>
          <TabsContent value="attendance" forceMount className="data-[state=inactive]:hidden animate-fade-in">
            {!hasStudents ? (
              <div className="bg-card rounded-xl p-6 shadow-card border border-border max-w-2xl mx-auto">
                <EmptyState
                  icon={Calendar}
                  title={t("classTeacherDashboard.noStudentsAttendance")}
                  description={t("classTeacherDashboard.noStudentsAttendanceDesc")}
                  actionLabel={t("classTeacherDashboard.addStudents")}
                  onAction={() => setActiveTab("students")}
                />
              </div>
            ) : (
              <div className="bg-card rounded-xl p-6 shadow-card border border-border max-w-2xl mx-auto" data-tour="ct-attendance">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{t("classTeacherDashboard.markAttendance")}</h2>
                    {attendanceExists && (
                      <p className="text-xs text-success mt-1">{t("classTeacherDashboard.attendanceMarkedToday")}</p>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString(getDateLocale(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>

                <div className="mb-6">
                  {students.length > 20 ? (
                    <div style={{ height: 400 }}>
                      <List<AttendanceRowProps>
                        rowCount={students.length}
                        rowHeight={72}
                        rowComponent={AttendanceRow}
                        rowProps={{ students, attendance, toggleAttendance, t }}
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {students.map((student) => {
                        const attendanceRecord = attendance.find(a => a.student_id === student.id);
                        const isPresent = attendanceRecord?.is_present ?? true;
                        return (
                          <div
                            key={student.id}
                            className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                              isPresent ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={isPresent}
                                onCheckedChange={() => toggleAttendance(student.id)}
                              />
                              <div>
                                <p className="font-medium text-foreground">{student.full_name}</p>
                                <p className="text-xs text-muted-foreground">{student.student_id}</p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                              isPresent ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
                            }`}>
                              {isPresent ? t("classTeacherDashboard.present") : t("classTeacherDashboard.absent")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <LoadingButton
                  className="w-full bg-role-class-teacher text-primary-foreground hover:opacity-90"
                  onClick={handleSaveAttendance}
                  loading={isSavingAttendance}
                  loadingText={t("classTeacherDashboard.saving")}
                  data-tour="ct-save-attendance"
                >
                  {attendanceExists ? t("classTeacherDashboard.updateAttendance") : t("classTeacherDashboard.saveAttendance")}
                </LoadingButton>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  {t("classTeacherDashboard.attendanceCanEdit")}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="students" forceMount className="data-[state=inactive]:hidden animate-fade-in">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Add Student */}
              <div className="bg-card rounded-xl p-6 shadow-card border border-border" data-tour="ct-add-student">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-role-class-teacher" />
                  {t("classTeacherDashboard.addNewStudent")}
                </h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("classTeacherDashboard.studentName")}</Label>
                    <Input
                      placeholder={t("classTeacherDashboard.enterStudentName")}
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("classTeacherDashboard.studentId")}</Label>
                    <Input
                      placeholder={t("classTeacherDashboard.studentIdPlaceholder")}
                      value={newStudentId}
                      onChange={(e) => setNewStudentId(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                    {t("classTeacherDashboard.loginCredentialsInfo")}
                  </p>

                  <LoadingButton
                    className="w-full bg-role-class-teacher text-primary-foreground hover:opacity-90"
                    onClick={handleAddStudent}
                    loading={isSubmitting}
                    loadingText={t("classTeacherDashboard.adding")}
                  >
                    {t("classTeacherDashboard.addStudent")}
                  </LoadingButton>
                </div>
              </div>

              {/* Student List or Onboarding */}
              <div>
                {!hasStudents ? (
                  <OnboardingChecklist
                    title={t("classTeacherDashboard.gettingStarted")}
                    subtitle={t("classTeacherDashboard.completeSteps")}
                    items={checklistItems}
                  />
                ) : (
                  <>
                    <FadeInView className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-foreground">{t("classTeacherDashboard.studentListCount", { count: students.length })}</h2>
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                        <Printer className="w-4 h-4" />
                        {t("classTeacherDashboard.printList")}
                      </Button>
                    </FadeInView>

                    {students.length > 20 ? (
                      <div style={{ height: 400 }}>
                        <List<StudentListRowProps>
                          rowCount={students.length}
                          rowHeight={72}
                          rowComponent={StudentListRow}
                          rowProps={{ students, handleRemoveStudent, t }}
                        />
                      </div>
                    ) : (
                      <StaggerContainer className="space-y-3">
                        {students.map((student) => (
                          <StaggerItem key={student.id}>
                            <div className="bg-card rounded-xl p-4 shadow-card border border-border flex items-center justify-between">
                              <div>
                                <p className="font-medium text-foreground">{student.full_name}</p>
                                <p className="text-xs text-muted-foreground">{t("classTeacherDashboard.idPrefix", { id: student.student_id })}</p>
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t("classTeacherDashboard.removeStudent")}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t("classTeacherDashboard.removeStudentConfirm", { name: student.full_name })}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t("classTeacherDashboard.cancel")}</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground"
                                      onClick={() => handleRemoveStudent(student)}
                                    >
                                      {t("classTeacherDashboard.remove")}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </StaggerItem>
                        ))}
                      </StaggerContainer>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Bulk CSV Import */}
            {profile?.school_id && assignedClass && (
              <div className="mt-8">
                <BulkStudentImport
                  classId={assignedClass.id}
                  schoolId={profile.school_id}
                  onImportComplete={loadStudents}
                />
              </div>
            )}
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" forceMount className="data-[state=inactive]:hidden animate-fade-in">
            <div className="max-w-4xl mx-auto">
              {profile?.school_id && (
                <AnnouncementManager schoolId={profile.school_id} />
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" forceMount className="data-[state=inactive]:hidden animate-fade-in">
            <h2 className="text-xl font-bold text-foreground mb-6">{t("classTeacherDashboard.classAnalytics")}</h2>
            {profile?.school_id && assignedClass && (
              <AnalyticsDashboard
                schoolId={profile.school_id}
                userRole="class_teacher"
                classId={assignedClass.id}
              />
            )}
            {assignedClass && (
              <Leaderboard classId={assignedClass.id} className="mt-6" />
            )}
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" forceMount className="data-[state=inactive]:hidden animate-fade-in">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-2">{t("common.accountSettings")}</h2>
                <p className="text-muted-foreground text-sm">{t("common.manageProfile")}</p>
              </div>
              <AccountSettings roleColor="bg-role-class-teacher" />
              <ChangePassword />
              <LoginHistory />
            </div>
          </TabsContent>
          </SwipeableTabContent>
        </Tabs>
      </motion.main>

      <TourHelpButton onClick={startTour} />

      {/* Mobile Bottom Navigation */}
      <MobileNav
        data-tour="ct-mobile-nav"
        items={[
          { id: "attendance", label: t("classTeacherDashboard.tabs.attendance"), icon: Calendar },
          { id: "students", label: t("classTeacherDashboard.tabs.students"), icon: Users },
          { id: "announcements", label: t("classTeacherDashboard.tabs.announce"), icon: Megaphone },
          { id: "analytics", label: t("classTeacherDashboard.tabs.analytics"), icon: BarChart3 },
          { id: "account", label: t("classTeacherDashboard.tabs.account"), icon: Settings },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accentColor="bg-role-class-teacher"
      />
    </div>
  );
};

export default ClassTeacherDashboard;
