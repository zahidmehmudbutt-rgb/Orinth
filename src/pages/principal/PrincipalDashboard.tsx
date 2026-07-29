import { Helmet } from "react-helmet-async";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FadeInView, StaggerContainer, StaggerItem, HoverScale } from "@/components/ui/motion-wrapper";
import { DashboardSkeleton } from "@/components/ui/skeleton-loader";
import { MobileNav } from "@/components/ui/mobile-nav";
import { SwipeableTabContent } from "@/components/ui/swipeable-tabs";
import { Bell, LogOut, UserPlus, Users, Crown, BarChart3, Trash2, Settings, Sparkles, GraduationCap, School, Globe, BookOpen, MessageSquare, Megaphone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import AccountSettings from "@/components/account/AccountSettings";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { WelcomeBanner } from "@/components/onboarding/WelcomeBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { SchoolSettingsForm } from "@/components/school/SchoolSettingsForm";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "react-i18next";
import AnnouncementManager from "@/components/announcements/AnnouncementManager";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import ChangePassword from "@/components/account/ChangePassword";
import LoginHistory from "@/components/account/LoginHistory";
import TwoFactorAuth from "@/components/account/TwoFactorAuth";
import { supabase } from "@/integrations/supabase/client";
import { useTour } from "@/hooks/useTour";
import { TourHelpButton } from "@/components/onboarding/TourHelpButton";
import { getPrincipalTourSteps } from "@/components/onboarding/tour-configs";

interface PrincipalData {
  id: string;
  name: string;
  schoolId: string;
  schoolName: string;
}

interface SectionHead {
  id: string;
  name: string;
  email: string;
  section?: string;
}

interface ClassInfo {
  id: string;
  name: string;
  section: string;
  classTeacherId: string | null;
  classTeacherName: string | null;
  studentCount: number;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
}

const PrincipalDashboard = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("staff");
  const [loading, setLoading] = useState(true);
  const [principalData, setPrincipalData] = useState<PrincipalData | null>(null);
  const [sectionHeads, setSectionHeads] = useState<SectionHead[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schoolStats, setSchoolStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    avgAttendance: 0,
  });

  // Add coordinator form
  const [newCoordinatorName, setNewCoordinatorName] = useState("");
  const [newCoordinatorEmail, setNewCoordinatorEmail] = useState("");
  const [newCoordinatorPassword, setNewCoordinatorPassword] = useState("");
  const [newCoordinatorSection, setNewCoordinatorSection] = useState("");
  const [isSubmittingCoordinator, setIsSubmittingCoordinator] = useState(false);


  const navigate = useNavigate();
  const { toast } = useToast();
  const tourSteps = useMemo(() => getPrincipalTourSteps(), []);
  const { startTour, hasCompletedTour } = useTour("principal", tourSteps);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!loading && !hasCompletedTour) {
      const timer = setTimeout(() => startTour(), 800);
      return () => clearTimeout(timer);
    }
  }, [loading, hasCompletedTour, startTour]);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/principal/login");
        return;
      }

      // Get principal profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, school_id, schools(id, name)")
        .eq("id", user.id)
        .single();

      if (profile) {
        const school = profile.schools as { id: string; name: string } | null;
        setPrincipalData({
          id: profile.id,
          name: profile.full_name || "Principal",
          schoolId: profile.school_id || "",
          schoolName: school?.name || "School",
        });

        // Fetch all data in parallel
        await Promise.all([
          fetchCoordinators(profile.school_id),
          fetchClasses(profile.school_id),
          fetchTeachers(profile.school_id),
          fetchStats(profile.school_id),
        ]);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error:", error);
      toast({
        variant: "destructive",
        title: t("principalDashboard.toastError"),
        description: t("principalDashboard.toastLoadFailed"),
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCoordinators = async (schoolId: string) => {
    // Fetch coordinators - use separate query for profiles since FK may not exist
    const { data } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("school_id", schoolId)
      .eq("role", "coordinator")
      .eq("is_active", true);

    if (data && data.length > 0) {
      const userIds = data.map(d => d.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      setSectionHeads(
        (profiles || []).map((p) => ({
          id: p.id,
          name: p.full_name || "Unknown",
          email: p.email || "",
        }))
      );
    } else {
      setSectionHeads([]);
    }
  };

  const fetchClasses = async (schoolId: string) => {
    const { data } = await supabase
      .from("classes")
      .select("id, name, section, class_teacher_id")
      .eq("school_id", schoolId)
      .order("name");

    if (data) {
      // Get class teacher names separately
      const teacherIds = data.map(c => c.class_teacher_id).filter(Boolean);
      const { data: teacherProfiles } = teacherIds.length > 0 
        ? await supabase.from("profiles").select("id, full_name").in("id", teacherIds)
        : { data: [] };
      
      const teacherMap = new Map((teacherProfiles || []).map(p => [p.id, p.full_name]));

      // Batch fetch student counts for all classes
      const classIds = data.map(c => c.id);
      const { data: studentRows } = classIds.length > 0
        ? await supabase.from("students").select("class_id").in("class_id", classIds)
        : { data: [] };
      const studentCountMap = new Map<string, number>();
      (studentRows || []).forEach(s => studentCountMap.set(s.class_id, (studentCountMap.get(s.class_id) || 0) + 1));

      const classesWithCounts = data.map(cls => ({
        id: cls.id,
        name: cls.name,
        section: cls.section || "",
        classTeacherId: cls.class_teacher_id,
        classTeacherName: cls.class_teacher_id ? teacherMap.get(cls.class_teacher_id) || null : null,
        studentCount: studentCountMap.get(cls.id) || 0,
      }));
      setClasses(classesWithCounts);
    }
  };

  const fetchTeachers = async (schoolId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("school_id", schoolId)
      .in("role", ["teacher", "class_teacher"])
      .eq("is_active", true);

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(d => d.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      setTeachers((profiles || []).map(p => ({
        id: p.id,
        name: p.full_name || "Unknown",
        email: p.email || "",
      })));
    } else {
      setTeachers([]);
    }
  };

  const fetchStats = async (schoolId: string) => {
    // Count students
    const { count: studentCount } = await supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId);

    // Count teachers (unique)
    const { data: teacherData } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("school_id", schoolId)
      .in("role", ["teacher", "class_teacher"])
      .eq("is_active", true);

    const uniqueTeachers = new Set(teacherData?.map((t) => t.user_id) || []);

    // Count classes
    const { count: classCount } = await supabase
      .from("classes")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId);

    // Calculate average attendance (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: attendanceData } = await supabase
      .from("attendance")
      .select("is_present")
      .eq("school_id", schoolId)
      .gte("date", sevenDaysAgo.toISOString().split("T")[0]);

    let avgAttendance = 0;
    if (attendanceData && attendanceData.length > 0) {
      const presentCount = attendanceData.filter((a) => a.is_present).length;
      avgAttendance = Math.round((presentCount / attendanceData.length) * 100);
    }

    setSchoolStats({
      totalStudents: studentCount || 0,
      totalTeachers: uniqueTeachers.size,
      totalClasses: classCount || 0,
      avgAttendance,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleAddCoordinator = async () => {
    if (!newCoordinatorName.trim() || !newCoordinatorEmail.trim() || !newCoordinatorPassword.trim()) {
      toast({
        variant: "destructive",
        title: t("principalDashboard.toastMissingInfo"),
        description: t("principalDashboard.toastFillFields"),
      });
      return;
    }

    if (newCoordinatorPassword.length < 8) {
      toast({
        variant: "destructive",
        title: t("principalDashboard.toastPasswordTooShort"),
        description: t("principalDashboard.toastPasswordMin8"),
      });
      return;
    }

    if (!principalData) return;

    setIsSubmittingCoordinator(true);
    try {
      // Use direct fetch to call edge function for reliable error handling
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error("Not authenticated");
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(`${supabaseUrl}/functions/v1/create-school-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          email: newCoordinatorEmail.toLowerCase().trim(),
          password: newCoordinatorPassword,
          fullName: newCoordinatorName.trim(),
          role: 'coordinator',
          schoolId: principalData.schoolId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to create user (${res.status})`);
      }

      toast({
        title: t("principalDashboard.toastSectionHeadAdded"),
        description: t("principalDashboard.toastSectionHeadAddedDesc", { name: newCoordinatorName }),
      });

      // Reset form and refresh
      setNewCoordinatorName("");
      setNewCoordinatorEmail("");
      setNewCoordinatorPassword("");
      setNewCoordinatorSection("");
      await fetchCoordinators(principalData.schoolId);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error:", error);
      toast({
        variant: "destructive",
        title: t("principalDashboard.toastError"),
        description: error instanceof Error ? error.message : t("principalDashboard.toastSectionHeadAddFailed"),
      });
    } finally {
      setIsSubmittingCoordinator(false);
    }
  };

  const handleRemoveCoordinator = async (coordinatorId: string, name: string) => {
    if (!principalData) return;

    try {
      // Deactivate the role instead of deleting
      await supabase
        .from("user_roles")
        .update({ is_active: false })
        .eq("user_id", coordinatorId)
        .eq("school_id", principalData.schoolId)
        .eq("role", "coordinator");

      toast({
        title: t("principalDashboard.toastSectionHeadRemoved"),
        description: t("principalDashboard.toastSectionHeadRemovedDesc", { name: name }),
      });

      await fetchCoordinators(principalData.schoolId);
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("principalDashboard.toastError"),
        description: t("principalDashboard.toastSectionHeadRemoveFailed"),
      });
    }
  };


  // Onboarding checklist items
  const checklistItems = [
    {
      id: "profile",
      label: t("principalDashboard.completeProfile"),
      description: t("principalDashboard.addContactInfo"),
      completed: true,
      onClick: () => setActiveTab("account"),
    },
    {
      id: "coordinator",
      label: t("principalDashboard.addFirstSectionHead"),
      description: t("principalDashboard.assignCoordinators"),
      completed: sectionHeads.length > 0,
      onClick: () => setActiveTab("staff"),
    },
  ];

  if (loading) {
    return <DashboardSkeleton roleColor="bg-role-principal" />;
  }

  const showOnboarding = sectionHeads.length === 0 && classes.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Principal Dashboard — Orinth</title></Helmet>
      <header className="w-full bg-role-principal text-primary-foreground sticky top-0 z-50" data-tour="principal-header">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{t("principalDashboard.title")}</h1>
              <p className="text-xs opacity-80 truncate max-w-[150px] sm:max-w-none">{principalData?.schoolName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <LanguageToggle className="text-primary-foreground hover:bg-primary-foreground/20" />
            <ThemeToggle className="text-primary-foreground hover:bg-primary-foreground/20" />
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
              <Bell className="w-5 h-5" />
            </Button>
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
        {/* Welcome Banner for new principals */}
        {showOnboarding && (
          <WelcomeBanner
            icon={Sparkles}
            title={t("principalDashboard.welcomeTitle")}
            description={t("principalDashboard.welcomeDesc")}
            tips={[
              t("principalDashboard.welcomeTip1"),
              t("principalDashboard.welcomeTip2"),
              t("principalDashboard.welcomeTip3"),
            ]}
            accentColor="bg-role-principal"
            storageKey="principal-welcome-dismissed"
            className="mb-6"
          />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full max-w-4xl mx-auto hidden md:grid grid-cols-6 mb-8 bg-card shadow-card" data-tour="principal-tabs">
            <TabsTrigger value="staff" className="flex items-center gap-2 data-[state=active]:bg-role-principal data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4" />
              <span className="text-sm">{t("principalDashboard.tabs.staff")}</span>
            </TabsTrigger>
            <TabsTrigger value="classes" className="flex items-center gap-2 data-[state=active]:bg-role-principal data-[state=active]:text-primary-foreground">
              <School className="w-4 h-4" />
              <span className="text-sm">{t("principalDashboard.tabs.classes")}</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2 data-[state=active]:bg-role-principal data-[state=active]:text-primary-foreground">
              <Megaphone className="w-4 h-4" />
              <span className="text-sm">{t("principalDashboard.tabs.announce")}</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-role-principal data-[state=active]:text-primary-foreground" data-tour="principal-analytics">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">{t("principalDashboard.tabs.analytics")}</span>
            </TabsTrigger>
            <TabsTrigger value="school" className="flex items-center gap-2 data-[state=active]:bg-role-principal data-[state=active]:text-primary-foreground" data-tour="principal-school-settings">
              <Globe className="w-4 h-4" />
              <span className="text-sm">{t("principalDashboard.tabs.publicPage")}</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2 data-[state=active]:bg-role-principal data-[state=active]:text-primary-foreground">
              <Settings className="w-4 h-4" />
              <span className="text-sm">{t("principalDashboard.tabs.account")}</span>
            </TabsTrigger>
          </TabsList>

          {/* Mobile: quick-access for Announcements (not in bottom MobileNav) */}
          <div className="flex md:hidden gap-2 mb-6">
            <button
              onClick={() => setActiveTab("announcements")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "announcements"
                  ? "bg-role-principal text-primary-foreground"
                  : "bg-card text-muted-foreground border border-border"
              }`}
            >
              <Megaphone className="w-4 h-4" />
              {t("principalDashboard.tabs.announcements")}
            </button>
          </div>

          <SwipeableTabContent activeTab={activeTab} tabOrder={["staff", "classes", "announcements", "analytics", "school", "account"]} onTabChange={setActiveTab}>
          {/* Staff Tab */}
          <TabsContent value="staff" forceMount className="data-[state=inactive]:hidden animate-fade-in">
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Add Section Head Form */}
              <div className="bg-card rounded-xl p-6 shadow-card border border-border" data-tour="principal-add-coordinator">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-role-principal" />
                  {t("principalDashboard.addSectionHead")}
                </h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("principalDashboard.fullName")}</Label>
                    <Input
                      placeholder={t("principalDashboard.enterFullName")}
                      value={newCoordinatorName}
                      onChange={(e) => setNewCoordinatorName(e.target.value)}
                      disabled={isSubmittingCoordinator}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("principalDashboard.email")}</Label>
                    <Input
                      type="email"
                      placeholder={t("principalDashboard.enterEmail")}
                      value={newCoordinatorEmail}
                      onChange={(e) => setNewCoordinatorEmail(e.target.value)}
                      disabled={isSubmittingCoordinator}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("principalDashboard.password")}</Label>
                    <Input
                      type="password"
                      placeholder={t("principalDashboard.setInitialPassword")}
                      value={newCoordinatorPassword}
                      onChange={(e) => setNewCoordinatorPassword(e.target.value)}
                      disabled={isSubmittingCoordinator}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("principalDashboard.sectionOptional")}</Label>
                    <Input
                      placeholder={t("principalDashboard.sectionPlaceholder")}
                      value={newCoordinatorSection}
                      onChange={(e) => setNewCoordinatorSection(e.target.value)}
                      disabled={isSubmittingCoordinator}
                    />
                  </div>

                  <LoadingButton
                    className="w-full bg-role-principal text-primary-foreground hover:opacity-90"
                    onClick={handleAddCoordinator}
                    loading={isSubmittingCoordinator}
                    loadingText={t("principalDashboard.adding")}
                  >
                    {t("principalDashboard.addSectionHeadBtn")}
                  </LoadingButton>
                </div>
              </div>

              {/* Section Heads List */}
              <div>
                {showOnboarding ? (
                  <OnboardingChecklist
                    title={t("principalDashboard.gettingStarted")}
                    subtitle={t("principalDashboard.completeSteps")}
                    items={checklistItems}
                  />
                ) : (
                  <>
                    <FadeInView>
                      <h2 className="text-xl font-bold text-foreground mb-4">
                        {t("principalDashboard.sectionHeadsCount", { count: sectionHeads.length })}
                      </h2>
                    </FadeInView>
                    {sectionHeads.length > 0 ? (
                      <StaggerContainer className="space-y-3">
                        {sectionHeads.map((head) => (
                          <StaggerItem key={head.id}>
                            <div className="bg-card rounded-xl p-4 shadow-card border border-border">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-foreground">{head.name}</p>
                                <p className="text-sm text-muted-foreground">{head.email}</p>
                              </div>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t("principalDashboard.removeSectionHead")}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t("principalDashboard.removeSectionHeadConfirm", { name: head.name })}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t("principalDashboard.cancel")}</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground"
                                      onClick={() => handleRemoveCoordinator(head.id, head.name)}
                                    >
                                      {t("principalDashboard.remove")}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                          </StaggerItem>
                        ))}
                      </StaggerContainer>
                    ) : (
                      <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                        <EmptyState
                          illustration="no-students"
                          title={t("principalDashboard.noSectionHeadsYet")}
                          description={t("principalDashboard.noSectionHeadsYetDesc")}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Classes Tab - Read Only View */}
          <TabsContent value="classes" forceMount className="data-[state=inactive]:hidden animate-fade-in">
            <div className="max-w-4xl mx-auto">
              <div className="bg-card rounded-xl p-6 shadow-card border border-border mb-6">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <School className="w-5 h-5" />
                  <p className="text-sm">
                    {t("principalDashboard.classesReadOnlyInfo")}
                  </p>
                </div>
              </div>

              <FadeInView>
                <h2 className="text-xl font-bold text-foreground mb-4">
                  {t("principalDashboard.allClassesCount", { count: classes.length })}
                </h2>
              </FadeInView>
              {classes.length > 0 ? (
                <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classes.map((cls) => (
                    <StaggerItem key={cls.id}>
                      <HoverScale>
                        <div className="bg-card rounded-xl p-4 shadow-card border border-border h-full">
                      <div className="mb-3">
                        <p className="font-semibold text-foreground text-lg">
                          {cls.name}-{cls.section}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t("principalDashboard.studentsCount", { count: cls.studentCount })}
                        </p>
                      </div>
                      <div className="pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-1">{t("principalDashboard.classTeacherLabel")}</p>
                        <p className="text-sm font-medium text-foreground">
                          {cls.classTeacherName || t("principalDashboard.notAssigned")}
                        </p>
                      </div>
                    </div>
                      </HoverScale>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              ) : (
                <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                  <EmptyState
                    illustration="no-data"
                    title={t("principalDashboard.noClassesYet")}
                    description={t("principalDashboard.noClassesYetDesc")}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" forceMount className="data-[state=inactive]:hidden animate-fade-in">
            <div className="max-w-4xl mx-auto">
              {principalData?.schoolId && (
                <AnnouncementManager schoolId={principalData.schoolId} />
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" forceMount className="data-[state=inactive]:hidden animate-fade-in">
            <h2 className="text-xl font-bold text-foreground mb-6">{t("principalDashboard.schoolAnalytics")}</h2>
            {principalData?.schoolId && (
              <AnalyticsDashboard schoolId={principalData.schoolId} userRole="principal" />
            )}
          </TabsContent>

          {/* Notifications Tab - Hidden for now, enable when needed
          <TabsContent value="notifications" className="animate-fade-in">
            <div className="max-w-4xl mx-auto">
              {principalData?.schoolId && (
                <NotificationSettings schoolId={principalData.schoolId} />
              )}
            </div>
          </TabsContent>
          */}

          {/* School Public Page Tab */}
          <TabsContent value="school" forceMount className="data-[state=inactive]:hidden animate-fade-in">
            <div className="max-w-3xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-2">{t("principalDashboard.schoolPublicPage")}</h2>
                <p className="text-muted-foreground text-sm">{t("principalDashboard.schoolPublicPageDesc")}</p>
              </div>
              {principalData?.schoolId && (
                <SchoolSettingsForm schoolId={principalData.schoolId} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="account" forceMount className="data-[state=inactive]:hidden animate-fade-in">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-2">{t("common.accountSettings")}</h2>
                <p className="text-muted-foreground text-sm">{t("common.manageProfile")}</p>
              </div>
              <AccountSettings roleColor="bg-role-principal" />
              <ChangePassword />
              <TwoFactorAuth />
              <LoginHistory />
            </div>
          </TabsContent>
          </SwipeableTabContent>
        </Tabs>
      </motion.main>

      <TourHelpButton onClick={startTour} />

      {/* Mobile Bottom Navigation */}
      <MobileNav
        data-tour="principal-mobile-nav"
        items={[
          { id: "staff", label: t("principalDashboard.tabs.staff"), icon: Users },
          { id: "classes", label: t("principalDashboard.tabs.classes"), icon: School },
          { id: "analytics", label: t("principalDashboard.tabs.analytics"), icon: BarChart3 },
          { id: "school", label: t("principalDashboard.tabs.publicPage"), icon: Globe },
          { id: "account", label: t("principalDashboard.tabs.account"), icon: Settings },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accentColor="bg-role-principal"
      />
    </div>
  );
};

export default PrincipalDashboard;
