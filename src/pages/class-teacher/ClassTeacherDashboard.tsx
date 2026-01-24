import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, Calendar, UserPlus, Users, Trash2, Printer, Settings, Sparkles } from "lucide-react";
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
import AccountSettings from "@/components/account/AccountSettings";
import { WelcomeBanner } from "@/components/onboarding/WelcomeBanner";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingButton } from "@/components/ui/LoadingButton";

const classTeacherData = {
  name: "Ms. Ayesha Khan",
  class: "Grade 9-A",
};

// Mock empty state - in real app this comes from database
const students: Array<{ id: string; name: string; present: boolean }> = [];

const ClassTeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState("attendance");
  const [attendance, setAttendance] = useState(students);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    navigate("/");
  };

  const toggleAttendance = (studentId: string) => {
    setAttendance(prev =>
      prev.map(s => s.id === studentId ? { ...s, present: !s.present } : s)
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

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Student Added",
        description: `${newStudentName} (${newStudentId}) has been added successfully. Login ID and Password are the same as Student ID.`,
      });
      setNewStudentName("");
      setNewStudentId("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Could not add the student. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveStudent = (studentName: string) => {
    toast({
      title: "Student Removed",
      description: `${studentName} has been removed from the class.`,
    });
  };

  const handleSaveAttendance = async () => {
    setIsSavingAttendance(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Attendance Saved",
        description: "Today's attendance has been saved successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Could not save attendance. Please try again.",
      });
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const hasStudents = students.length > 0;

  // Onboarding checklist
  const checklistItems = [
    {
      id: "profile",
      label: "Complete your profile",
      description: "Add your phone and address",
      completed: true,
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
      completed: false,
    },
  ];

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
              <p className="text-xs opacity-80">{classTeacherData.name} • {classTeacherData.class}</p>
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
        {/* Welcome Banner */}
        {!hasStudents && (
          <WelcomeBanner
            icon={Sparkles}
            title="Welcome to Your Class Dashboard!"
            description="Get started by adding students to your class. Once added, you can mark daily attendance and manage your class roster."
            tips={[
              "Add students using their unique Student IDs",
              "Students will use their ID as both username and password initially",
              "Mark attendance daily - it can only be edited on the same day",
            ]}
            accentColor="bg-role-class-teacher"
            storageKey="class-teacher-welcome-dismissed"
            className="mb-6"
          />
        )}

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
                  <h2 className="text-xl font-bold text-foreground">Mark Attendance</h2>
                  <span className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  {attendance.map((student) => (
                    <div
                      key={student.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        student.present ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={student.present}
                          onCheckedChange={() => toggleAttendance(student.id)}
                        />
                        <div>
                          <p className="font-medium text-foreground">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.id}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        student.present ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
                      }`}>
                        {student.present ? 'Present' : 'Absent'}
                      </span>
                    </div>
                  ))}
                </div>

                <LoadingButton 
                  className="w-full bg-role-class-teacher text-primary-foreground hover:opacity-90"
                  onClick={handleSaveAttendance}
                  loading={isSavingAttendance}
                  loadingText="Saving..."
                >
                  Save Attendance
                </LoadingButton>
                
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Attendance can only be edited on the same day
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
                    📝 Login ID and Password will be set to the Student ID automatically.
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
                      <h2 className="text-xl font-bold text-foreground">Student List</h2>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Printer className="w-4 h-4" />
                        Print List
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {students.map((student) => (
                        <div key={student.id} className="bg-card rounded-xl p-4 shadow-card border border-border flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">{student.name}</p>
                            <p className="text-xs text-muted-foreground">ID: {student.id} • Password: {student.id}</p>
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
                                  Are you sure you want to remove {student.name} from the class? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-destructive text-destructive-foreground"
                                  onClick={() => handleRemoveStudent(student.name)}
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
