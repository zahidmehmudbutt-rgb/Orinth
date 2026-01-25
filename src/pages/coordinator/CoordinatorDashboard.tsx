import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, UserPlus, Users, Trash2, Edit, BookMarked, Settings, Sparkles, Loader2, RefreshCw, GraduationCap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import AccountSettings from "@/components/account/AccountSettings";
import { WelcomeBanner } from "@/components/onboarding/WelcomeBanner";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingButton } from "@/components/ui/LoadingButton";

interface StaffMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  role: "teacher" | "class_teacher";
  phone: string | null;
  is_active: boolean;
}

interface ClassInfo {
  id: string;
  name: string;
  section: string | null;
}

const CoordinatorDashboard = () => {
  const [activeTab, setActiveTab] = useState("staff");
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherEmail, setNewTeacherEmail] = useState("");
  const [newTeacherPassword, setNewTeacherPassword] = useState("");
  const [teacherType, setTeacherType] = useState<"teacher" | "class_teacher">("teacher");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isCoordinator, loading } = useAuth();

  // Redirect if not coordinator
  useEffect(() => {
    if (!loading && !isCoordinator) {
      navigate("/");
    }
  }, [loading, isCoordinator, navigate]);

  // Load staff and classes
  useEffect(() => {
    if (profile?.school_id) {
      loadStaff();
      loadClasses();
    }
  }, [profile?.school_id]);

  const loadStaff = async () => {
    if (!profile?.school_id) return;

    setIsLoading(true);
    try {
      // Get all teachers and class_teachers in this school
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('id, user_id, role, is_active, school_id')
        .eq('school_id', profile.school_id)
        .in('role', ['teacher', 'class_teacher']);

      if (roleError) throw roleError;

      if (!roleData || roleData.length === 0) {
        setStaff([]);
        setIsLoading(false);
        return;
      }

      // Get profile info for these users
      const userIds = roleData.map(r => r.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .in('id', userIds);

      if (profileError) throw profileError;

      // Combine role and profile data
      const staffList: StaffMember[] = roleData.map(role => {
        const userProfile = profileData?.find(p => p.id === role.user_id);
        return {
          id: role.id,
          user_id: role.user_id,
          full_name: userProfile?.full_name || 'Unknown',
          email: userProfile?.email || null,
          role: role.role as "teacher" | "class_teacher",
          phone: userProfile?.phone || null,
          is_active: role.is_active,
        };
      });

      setStaff(staffList.filter(s => s.is_active));
    } catch (error) {
      console.error('Error loading staff:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load staff members.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadClasses = async () => {
    if (!profile?.school_id) return;

    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, section')
        .eq('school_id', profile.school_id)
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleAddTeacher = async () => {
    if (!newTeacherName.trim() || !newTeacherEmail.trim() || !newTeacherPassword.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields: name, email, and password.",
      });
      return;
    }

    if (teacherType === "class_teacher" && !selectedClassId) {
      toast({
        variant: "destructive",
        title: "Missing Class",
        description: "Please select a class for the class teacher.",
      });
      return;
    }

    if (!profile?.school_id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "School information not found.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Sign up the new user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newTeacherEmail.trim(),
        password: newTeacherPassword,
        options: {
          data: {
            full_name: newTeacherName.trim(),
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      // Create profile for the new user
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: newTeacherName.trim(),
          email: newTeacherEmail.trim(),
          school_id: profile.school_id,
          first_login_complete: false,
        });

      if (profileError) throw profileError;

      // Assign the role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: teacherType,
          school_id: profile.school_id,
          is_active: true,
        });

      if (roleError) throw roleError;

      // If class teacher, assign to the class
      if (teacherType === "class_teacher" && selectedClassId) {
        const { error: classError } = await supabase
          .from('classes')
          .update({ class_teacher_id: authData.user.id })
          .eq('id', selectedClassId);

        if (classError) {
          console.error('Error assigning class teacher to class:', classError);
        }
      }

      toast({
        title: "Staff Added",
        description: `${newTeacherName} has been added as a ${teacherType === "class_teacher" ? "Class Teacher" : "Teacher"}. They will receive an email to verify their account.`,
      });

      // Clear form and refresh staff list
      setNewTeacherName("");
      setNewTeacherEmail("");
      setNewTeacherPassword("");
      setSelectedClassId("");
      loadStaff();
    } catch (error: any) {
      console.error('Error adding staff:', error);
      toast({
        variant: "destructive",
        title: "Error Adding Staff",
        description: error.message || "Could not add staff member. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveStaff = async (staffMember: StaffMember) => {
    try {
      // Deactivate the user role (soft delete)
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('id', staffMember.id);

      if (error) throw error;

      // If class teacher, remove from class assignment
      if (staffMember.role === "class_teacher") {
        await supabase
          .from('classes')
          .update({ class_teacher_id: null })
          .eq('class_teacher_id', staffMember.user_id);
      }

      toast({
        title: "Staff Removed",
        description: `${staffMember.full_name} has been removed from your section.`,
      });

      loadStaff();
    } catch (error: any) {
      console.error('Error removing staff:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not remove staff member.",
      });
    }
  };

  const hasStaff = staff.length > 0;
  const teacherCount = staff.filter(s => s.role === "teacher").length;
  const classTeacherCount = staff.filter(s => s.role === "class_teacher").length;

  // Onboarding checklist
  const checklistItems = [
    {
      id: "profile",
      label: "Complete your profile",
      description: "Add your contact information",
      completed: profile?.first_login_complete || false,
      onClick: () => setActiveTab("account"),
    },
    {
      id: "teacher",
      label: "Add your first teacher",
      description: "Add teachers to your section",
      completed: teacherCount > 0,
      onClick: () => setActiveTab("staff"),
    },
    {
      id: "class-teacher",
      label: "Assign a class teacher",
      description: "Add class teachers to manage classes",
      completed: classTeacherCount > 0,
      onClick: () => setActiveTab("staff"),
    },
  ];

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-role-coordinator" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="w-full bg-role-coordinator text-primary-foreground sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
              <BookMarked className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Section Head Dashboard</h1>
              <p className="text-xs opacity-80">{profile?.full_name || "Coordinator"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={loadStaff}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
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
        {/* Welcome Banner */}
        {!hasStaff && (
          <WelcomeBanner
            icon={Sparkles}
            title="Welcome to Your Section Dashboard!"
            description="As a Section Head, you manage teachers and class teachers in your section. Start by adding staff members who will handle classes and students."
            tips={[
              "Add Teachers who will create homework and grade students",
              "Add Class Teachers who will manage student attendance",
              "You cannot manage principals or students directly",
            ]}
            accentColor="bg-role-coordinator"
            storageKey="coordinator-welcome-dismissed"
            className="mb-6"
          />
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl p-4 shadow-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-role-teacher/10 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-role-teacher" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{teacherCount}</p>
                <p className="text-sm text-muted-foreground">Teachers</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-role-class-teacher/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-role-class-teacher" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{classTeacherCount}</p>
                <p className="text-sm text-muted-foreground">Class Teachers</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <BookMarked className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{classes.length}</p>
                <p className="text-sm text-muted-foreground">Classes</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 mb-8 bg-card shadow-card">
            <TabsTrigger value="staff" className="flex items-center gap-2 data-[state=active]:bg-role-coordinator data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4" />
              Staff Management
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2 data-[state=active]:bg-role-coordinator data-[state=active]:text-primary-foreground">
              <Settings className="w-4 h-4" />
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="staff" className="animate-fade-in">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Add Staff Form */}
              <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-role-coordinator" />
                  Add New Staff
                </h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Staff Type</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="staffType"
                          value="teacher"
                          checked={teacherType === "teacher"}
                          onChange={() => {
                            setTeacherType("teacher");
                            setSelectedClassId("");
                          }}
                          className="w-4 h-4"
                          disabled={isSubmitting}
                        />
                        <span className="text-foreground">Teacher</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="staffType"
                          value="class_teacher"
                          checked={teacherType === "class_teacher"}
                          onChange={() => setTeacherType("class_teacher")}
                          className="w-4 h-4"
                          disabled={isSubmitting}
                        />
                        <span className="text-foreground">Class Teacher</span>
                      </label>
                    </div>
                  </div>

                  {teacherType === "class_teacher" && (
                    <div className="space-y-2">
                      <Label>Assign to Class</Label>
                      <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={isSubmitting}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}{cls.section ? ` - ${cls.section}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {classes.length === 0 && (
                        <p className="text-xs text-muted-foreground">No classes available. Ask your principal to create classes first.</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      placeholder="Enter full name"
                      value={newTeacherName}
                      onChange={(e) => setNewTeacherName(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={newTeacherEmail}
                      onChange={(e) => setNewTeacherEmail(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      placeholder="Set initial password"
                      value={newTeacherPassword}
                      onChange={(e) => setNewTeacherPassword(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                    Staff will be required to complete their profile (address, phone, WhatsApp) on first login.
                  </p>

                  <LoadingButton
                    className="w-full bg-role-coordinator text-primary-foreground hover:opacity-90"
                    onClick={handleAddTeacher}
                    loading={isSubmitting}
                    loadingText="Adding..."
                  >
                    Add Staff
                  </LoadingButton>
                </div>
              </div>

              {/* Staff List or Onboarding */}
              <div>
                {!hasStaff ? (
                  <OnboardingChecklist
                    title="Getting Started"
                    subtitle="Complete these steps to set up your section"
                    items={checklistItems}
                  />
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-role-coordinator" />
                      Section Staff ({staff.length})
                    </h2>

                    <div className="space-y-3">
                      {staff.map((member) => (
                        <div key={member.id} className="bg-card rounded-xl p-4 shadow-card border border-border">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-foreground">{member.full_name}</p>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  member.role === "teacher" ? 'bg-role-teacher/10 text-role-teacher' : 'bg-role-class-teacher/10 text-role-class-teacher'
                                }`}>
                                  {member.role === "teacher" ? "Teacher" : "Class Teacher"}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{member.email || 'No email'}</p>
                              {member.phone && (
                                <p className="text-xs text-muted-foreground mt-1">{member.phone}</p>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Staff Member?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove {member.full_name}? This action will deactivate their account.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground"
                                      onClick={() => handleRemoveStaff(member)}
                                    >
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-2">Account Settings</h2>
                <p className="text-muted-foreground text-sm">Manage your profile and security settings</p>
              </div>
              <AccountSettings roleColor="bg-role-coordinator" />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CoordinatorDashboard;
