import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, UserPlus, Users, Crown, BarChart3, Trash2, Settings, Sparkles, GraduationCap, School, Globe, BookOpen } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data.",
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

      const classesWithCounts = await Promise.all(
        data.map(async (cls) => {
          const { count } = await supabase
            .from("students")
            .select("id", { count: "exact", head: true })
            .eq("class_id", cls.id);

          return {
            id: cls.id,
            name: cls.name,
            section: cls.section || "",
            classTeacherId: cls.class_teacher_id,
            classTeacherName: cls.class_teacher_id ? teacherMap.get(cls.class_teacher_id) || null : null,
            studentCount: count || 0,
          };
        })
      );
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
        title: "Missing Information",
        description: "Please fill in the name, email, and password fields.",
      });
      return;
    }

    if (newCoordinatorPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Password Too Short",
        description: "Password must be at least 8 characters.",
      });
      return;
    }

    if (!principalData) return;

    setIsSubmittingCoordinator(true);
    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Call edge function to create user (uses service role, won't switch sessions)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-school-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email: newCoordinatorEmail.toLowerCase().trim(),
            password: newCoordinatorPassword,
            fullName: newCoordinatorName.trim(),
            role: "coordinator",
            schoolId: principalData.schoolId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create coordinator");
      }

      toast({
        title: "Section Head Added",
        description: `${newCoordinatorName} has been added successfully.`,
      });

      // Reset form and refresh
      setNewCoordinatorName("");
      setNewCoordinatorEmail("");
      setNewCoordinatorPassword("");
      setNewCoordinatorSection("");
      await fetchCoordinators(principalData.schoolId);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not add the section head.",
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
        title: "Section Head Removed",
        description: `${name} has been removed from the system.`,
      });

      await fetchCoordinators(principalData.schoolId);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not remove the section head.",
      });
    }
  };


  // Onboarding checklist items
  const checklistItems = [
    {
      id: "profile",
      label: "Complete your profile",
      description: "Add your contact information",
      completed: true,
      onClick: () => setActiveTab("account"),
    },
    {
      id: "coordinator",
      label: "Add your first Section Head",
      description: "Assign coordinators to manage teachers and classes",
      completed: sectionHeads.length > 0,
      onClick: () => setActiveTab("staff"),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-role-principal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const showOnboarding = sectionHeads.length === 0 && classes.length === 0;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="w-full bg-role-principal text-primary-foreground sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Principal Dashboard</h1>
              <p className="text-xs opacity-80">{principalData?.schoolName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Welcome Banner for new principals */}
        {showOnboarding && (
          <WelcomeBanner
            icon={Sparkles}
            title="Welcome to Your School Dashboard!"
            description="Let's get your school set up. Follow the checklist below to configure your school management system."
            tips={[
              "Start by creating classes for your school",
              "Add Section Heads who will manage teachers",
              "View analytics once data starts flowing in",
            ]}
            accentColor="bg-role-principal"
            storageKey="principal-welcome-dismissed"
            className="mb-6"
          />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full max-w-3xl mx-auto grid grid-cols-5 mb-8 bg-card shadow-card">
            <TabsTrigger value="staff" className="flex items-center gap-2 data-[state=active]:bg-role-principal data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Staff</span>
            </TabsTrigger>
            <TabsTrigger value="classes" className="flex items-center gap-2 data-[state=active]:bg-role-principal data-[state=active]:text-primary-foreground">
              <School className="w-4 h-4" />
              <span className="hidden sm:inline">Classes</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-role-principal data-[state=active]:text-primary-foreground">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="school" className="flex items-center gap-2 data-[state=active]:bg-role-principal data-[state=active]:text-primary-foreground">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Public Page</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2 data-[state=active]:bg-role-principal data-[state=active]:text-primary-foreground">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          {/* Staff Tab */}
          <TabsContent value="staff" className="animate-fade-in">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Add Section Head Form */}
              <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-role-principal" />
                  Add Section Head / Coordinator
                </h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      placeholder="Enter full name"
                      value={newCoordinatorName}
                      onChange={(e) => setNewCoordinatorName(e.target.value)}
                      disabled={isSubmittingCoordinator}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={newCoordinatorEmail}
                      onChange={(e) => setNewCoordinatorEmail(e.target.value)}
                      disabled={isSubmittingCoordinator}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      placeholder="Set initial password"
                      value={newCoordinatorPassword}
                      onChange={(e) => setNewCoordinatorPassword(e.target.value)}
                      disabled={isSubmittingCoordinator}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Section (Optional)</Label>
                    <Input
                      placeholder="e.g., Primary Section (1-5)"
                      value={newCoordinatorSection}
                      onChange={(e) => setNewCoordinatorSection(e.target.value)}
                      disabled={isSubmittingCoordinator}
                    />
                  </div>

                  <LoadingButton
                    className="w-full bg-role-principal text-primary-foreground hover:opacity-90"
                    onClick={handleAddCoordinator}
                    loading={isSubmittingCoordinator}
                    loadingText="Adding..."
                  >
                    Add Section Head
                  </LoadingButton>
                </div>
              </div>

              {/* Section Heads List */}
              <div>
                {showOnboarding ? (
                  <OnboardingChecklist
                    title="Getting Started"
                    subtitle="Complete these steps to set up your school"
                    items={checklistItems}
                  />
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-foreground mb-4">
                      Section Heads ({sectionHeads.length})
                    </h2>
                    {sectionHeads.length > 0 ? (
                      <div className="space-y-3">
                        {sectionHeads.map((head) => (
                          <div key={head.id} className="bg-card rounded-xl p-4 shadow-card border border-border">
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
                                    <AlertDialogTitle>Remove Section Head?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove {head.name}?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground"
                                      onClick={() => handleRemoveCoordinator(head.id, head.name)}
                                    >
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                        <EmptyState
                          icon={Users}
                          title="No Section Heads Yet"
                          description="Add your first section head to start organizing your school staff."
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Classes Tab - Read Only View */}
          <TabsContent value="classes" className="animate-fade-in">
            <div className="max-w-4xl mx-auto">
              <div className="bg-card rounded-xl p-6 shadow-card border border-border mb-6">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <School className="w-5 h-5" />
                  <p className="text-sm">
                    Classes are managed by Section Heads / Coordinators. This is a read-only overview.
                  </p>
                </div>
              </div>

              <h2 className="text-xl font-bold text-foreground mb-4">
                All Classes ({classes.length})
              </h2>
              {classes.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classes.map((cls) => (
                    <div key={cls.id} className="bg-card rounded-xl p-4 shadow-card border border-border">
                      <div className="mb-3">
                        <p className="font-semibold text-foreground text-lg">
                          {cls.name}-{cls.section}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {cls.studentCount} students
                        </p>
                      </div>
                      <div className="pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-1">Class Teacher</p>
                        <p className="text-sm font-medium text-foreground">
                          {cls.classTeacherName || "Not assigned"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                  <EmptyState
                    icon={School}
                    title="No Classes Yet"
                    description="Classes will appear here once your Section Heads create them."
                  />
                </div>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="animate-fade-in">
            <h2 className="text-xl font-bold text-foreground mb-6">School Analytics Overview</h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-card rounded-xl p-5 shadow-card border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                </div>
                <span className="text-3xl font-bold text-foreground">{schoolStats.totalStudents}</span>
              </div>

              <div className="bg-card rounded-xl p-5 shadow-card border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-role-teacher/10 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-role-teacher" />
                  </div>
                  <p className="text-sm text-muted-foreground">Total Teachers</p>
                </div>
                <span className="text-3xl font-bold text-foreground">{schoolStats.totalTeachers}</span>
              </div>

              <div className="bg-card rounded-xl p-5 shadow-card border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-role-principal/10 rounded-lg flex items-center justify-center">
                    <School className="w-5 h-5 text-role-principal" />
                  </div>
                  <p className="text-sm text-muted-foreground">Classes</p>
                </div>
                <span className="text-3xl font-bold text-foreground">{schoolStats.totalClasses}</span>
              </div>

              <div className="bg-card rounded-xl p-5 shadow-card border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-success" />
                  </div>
                  <p className="text-sm text-muted-foreground">Avg. Attendance</p>
                </div>
                <span className="text-3xl font-bold text-foreground">
                  {schoolStats.avgAttendance > 0 ? `${schoolStats.avgAttendance}%` : "-"}
                </span>
              </div>
            </div>

            {/* Charts placeholder */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                <h3 className="font-semibold text-foreground mb-4">Attendance Trend</h3>
                {schoolStats.avgAttendance > 0 ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    Chart visualization coming soon
                  </div>
                ) : (
                  <EmptyState
                    icon={BarChart3}
                    title="No Data Yet"
                    description="Attendance charts will appear here once teachers start marking daily attendance."
                  />
                )}
              </div>

              <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                <h3 className="font-semibold text-foreground mb-4">Homework Completion Rate</h3>
                <EmptyState
                  icon={BookOpen}
                  title="No Data Yet"
                  description="Homework statistics will appear here once teachers start assigning homework."
                />
              </div>
            </div>
          </TabsContent>

          {/* Account Tab */}
          {/* School Public Page Tab */}
          <TabsContent value="school" className="animate-fade-in">
            <div className="max-w-3xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-2">School Public Page</h2>
                <p className="text-muted-foreground text-sm">Customize your school's public homepage that visitors can see</p>
              </div>
              {principalData?.schoolId && (
                <SchoolSettingsForm schoolId={principalData.schoolId} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="account" className="animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-2">Account Settings</h2>
                <p className="text-muted-foreground text-sm">Manage your profile and security settings</p>
              </div>
              <AccountSettings roleColor="bg-role-principal" />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PrincipalDashboard;
