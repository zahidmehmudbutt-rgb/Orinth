import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Calendar, UserPlus, Users, Trash2, Printer, Settings, Sparkles, Loader2, RefreshCw, Check, X } from "lucide-react";
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

const ClassTeacherDashboard = () => {
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

  const today = new Date().toISOString().split('T')[0];

  // Redirect if not class teacher
  useEffect(() => {
    if (!loading && !isClassTeacher) {
      navigate("/");
    }
  }, [loading, isClassTeacher, navigate]);

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
      console.error('Error loading assigned class:', error);
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
      console.error('Error loading students:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load students.",
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
      console.error('Error loading attendance:', error);
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
        title: "Missing Information",
        description: "Please enter both the student's name and ID.",
      });
      return;
    }

    if (!assignedClass?.id || !profile?.school_id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Class information not found.",
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
          title: "Duplicate ID",
          description: "A student with this ID already exists.",
        });
        setIsSubmitting(false);
        return;
      }

      // Create auth user for the student
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `${newStudentId.trim().toLowerCase()}@student.school`,
        password: newStudentId.trim(),
        options: {
          data: {
            full_name: newStudentName.trim(),
          },
        },
      });

      if (authError) throw authError;

      // Create profile
      if (authData.user) {
        await supabase.from('profiles').insert({
          id: authData.user.id,
          full_name: newStudentName.trim(),
          school_id: profile.school_id,
          first_login_complete: false,
        });

        // Assign student role
        await supabase.from('user_roles').insert({
          user_id: authData.user.id,
          role: 'student',
          school_id: profile.school_id,
          is_active: true,
        });
      }

      // Create student record
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          student_id: newStudentId.trim(),
          full_name: newStudentName.trim(),
          class_id: assignedClass.id,
          school_id: profile.school_id,
          user_id: authData.user?.id || null,
        });

      if (studentError) throw studentError;

      toast({
        title: "Student Added",
        description: `${newStudentName} (${newStudentId}) has been added. Login: ID as both username and password.`,
      });

      setNewStudentName("");
      setNewStudentId("");
      loadStudents();
    } catch (error: any) {
      console.error('Error adding student:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not add the student. Please try again.",
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
        title: "Student Removed",
        description: `${student.full_name} has been removed from the class.`,
      });

      loadStudents();
    } catch (error: any) {
      console.error('Error removing student:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not remove the student.",
      });
    }
  };

  const handleSaveAttendance = async () => {
    if (!assignedClass?.id || !profile?.school_id || !user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Missing required information.",
      });
      return;
    }

    setIsSavingAttendance(true);
    try {
      if (attendanceExists) {
        // Update existing attendance records
        for (const record of attendance) {
          if (record.id) {
            await supabase
              .from('attendance')
              .update({ is_present: record.is_present })
              .eq('id', record.id);
          }
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
        title: "Attendance Saved",
        description: "Today's attendance has been saved successfully.",
      });

      loadTodayAttendance();
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not save attendance. Please try again.",
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
      label: "Complete your profile",
      description: "Add your phone and address",
      completed: profile?.first_login_complete || false,
      onClick: () => setActiveTab("account"),
    },
    {
      id: "students",
      label: "Add your first students",
      description: "Add students to your class",
      completed: hasStudents,
      onClick: () => setActiveTab("students"),
    },
    {
      id: "attendance",
      label: "Mark your first attendance",
      description: "Start tracking daily attendance",
      completed: attendanceExists,
      onClick: () => setActiveTab("attendance"),
    },
  ];

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-role-class-teacher" />
      </div>
    );
  }

  if (!assignedClass) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <header className="w-full bg-role-class-teacher text-primary-foreground sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Class Teacher Dashboard</h1>
                <p className="text-xs opacity-80">{profile?.full_name || "Class Teacher"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
            <h2 className="text-xl font-bold text-foreground mb-2">No Class Assigned</h2>
            <p className="text-muted-foreground">
              You haven't been assigned to any class yet. Please contact your coordinator or principal.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="w-full bg-role-class-teacher text-primary-foreground sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Class Teacher Dashboard</h1>
              <p className="text-xs opacity-80">
                {profile?.full_name || "Class Teacher"} - {assignedClass.name}{assignedClass.section ? ` (${assignedClass.section})` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { loadStudents(); loadTodayAttendance(); }}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
            <GroupChat triggerClassName="text-primary-foreground hover:bg-primary-foreground/20" />
            <NotificationCenter className="text-primary-foreground hover:bg-primary-foreground/20" />
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Welcome Banner */}
        {!hasStudents && (
          <WelcomeBanner
            icon={Sparkles}
            title="Welcome to Your Class Dashboard!"
            description="Get started by adding students to your class. Once added, you can mark daily attendance and manage your class roster."
            tips={[
              "Add students using their unique Student IDs",
              "Students will use their ID as both username and password initially",
              "Mark attendance daily - it can be edited on the same day",
            ]}
            accentColor="bg-role-class-teacher"
            storageKey="class-teacher-welcome-dismissed"
            className="mb-6"
          />
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl p-4 shadow-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{students.length}</p>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{presentCount}</p>
                <p className="text-sm text-muted-foreground">Present Today</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                <X className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{absentCount}</p>
                <p className="text-sm text-muted-foreground">Absent Today</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full max-w-lg mx-auto grid grid-cols-3 mb-8 bg-card shadow-card">
            <TabsTrigger value="attendance" className="flex items-center gap-2 data-[state=active]:bg-role-class-teacher data-[state=active]:text-primary-foreground">
              <Calendar className="w-4 h-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2 data-[state=active]:bg-role-class-teacher data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4" />
              Students
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2 data-[state=active]:bg-role-class-teacher data-[state=active]:text-primary-foreground">
              <Settings className="w-4 h-4" />
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="animate-fade-in">
            {!hasStudents ? (
              <div className="bg-card rounded-xl p-6 shadow-card border border-border max-w-2xl mx-auto">
                <EmptyState
                  icon={Calendar}
                  title="No Students to Mark Attendance"
                  description="Add students to your class first, then you can mark their daily attendance."
                  actionLabel="Add Students"
                  onAction={() => setActiveTab("students")}
                />
              </div>
            ) : (
              <div className="bg-card rounded-xl p-6 shadow-card border border-border max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Mark Attendance</h2>
                    {attendanceExists && (
                      <p className="text-xs text-success mt-1">Attendance already marked for today</p>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
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
                          {isPresent ? 'Present' : 'Absent'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <LoadingButton
                  className="w-full bg-role-class-teacher text-primary-foreground hover:opacity-90"
                  onClick={handleSaveAttendance}
                  loading={isSavingAttendance}
                  loadingText="Saving..."
                >
                  {attendanceExists ? 'Update Attendance' : 'Save Attendance'}
                </LoadingButton>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Attendance can be edited on the same day
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="students" className="animate-fade-in">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Add Student */}
              <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-role-class-teacher" />
                  Add New Student
                </h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Student Name</Label>
                    <Input
                      placeholder="Enter student name"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Student ID</Label>
                    <Input
                      placeholder="e.g., STU-006"
                      value={newStudentId}
                      onChange={(e) => setNewStudentId(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                    Login ID and Password will be set to the Student ID automatically.
                  </p>

                  <LoadingButton
                    className="w-full bg-role-class-teacher text-primary-foreground hover:opacity-90"
                    onClick={handleAddStudent}
                    loading={isSubmitting}
                    loadingText="Adding..."
                  >
                    Add Student
                  </LoadingButton>
                </div>
              </div>

              {/* Student List or Onboarding */}
              <div>
                {!hasStudents ? (
                  <OnboardingChecklist
                    title="Getting Started"
                    subtitle="Complete these steps to set up your class"
                    items={checklistItems}
                  />
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-foreground">Student List ({students.length})</h2>
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                        <Printer className="w-4 h-4" />
                        Print List
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {students.map((student) => (
                        <div key={student.id} className="bg-card rounded-xl p-4 shadow-card border border-border flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">{student.full_name}</p>
                            <p className="text-xs text-muted-foreground">ID: {student.student_id}</p>
                          </div>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Student?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {student.full_name} from the class? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground"
                                  onClick={() => handleRemoveStudent(student)}
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
              <AccountSettings roleColor="bg-role-class-teacher" />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ClassTeacherDashboard;
