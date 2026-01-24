import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Bell, LogOut, BookOpen, Calendar, BarChart3, Megaphone, Clock, Upload, CheckCircle, AlertCircle, Settings, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import AccountSettings from "@/components/account/AccountSettings";
import { WelcomeBanner } from "@/components/onboarding/WelcomeBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingButton } from "@/components/ui/LoadingButton";

// Mock data - in real app this comes from database
const studentData = {
  name: "Ahmed Khan",
  id: "STU-2024-001",
  class: "Grade 9-A",
};

const subjects: Array<{ name: string; code: string; teacher: string; pending: number }> = [];
const homeworks: Array<{ id: number; subject: string; title: string; dueDate: string; status: string }> = [];
const attendanceData = {
  present: 0,
  absent: 0,
  percentage: 0,
};
const recentAttendance: Array<{ date: string; day: string; status: string }> = [];
const marks: Array<{ subject: string; homeworkMarks: number; maxMarks: number }> = [];
const notices: Array<{ id: number; title: string; date: string; content: string }> = [];

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState("homework");
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    navigate("/");
  };

  const handleUpload = async (homeworkId: number) => {
    setUploadingId(homeworkId);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: "Homework Submitted",
        description: "Your homework has been submitted successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Could not submit homework. Please try again.",
      });
    } finally {
      setUploadingId(null);
    }
  };

  const hasSubjects = subjects.length > 0;
  const hasHomework = homeworks.length > 0;
  const hasAttendance = recentAttendance.length > 0;
  const hasMarks = marks.length > 0;
  const hasNotices = notices.length > 0;

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="w-full bg-gradient-primary text-primary-foreground sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Student Dashboard</h1>
              <p className="text-xs opacity-80">Welcome back, {studentData.name}! 👋</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
              <Bell className="w-5 h-5" />
            </Button>
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
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Welcome Banner for new students */}
        {!hasSubjects && (
          <WelcomeBanner
            icon={Sparkles}
            title="Welcome to Your Student Portal!"
            description="Your class teacher will add you to subjects soon. Once enrolled, you'll see your homework, attendance, and marks here."
            tips={[
              "Check back regularly for homework assignments",
              "Your attendance will be marked daily by your class teacher",
              "View your marks after teachers grade your homework",
            ]}
            accentColor="bg-primary"
            storageKey="student-welcome-dismissed"
            className="mb-6"
          />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full max-w-xl mx-auto grid grid-cols-5 mb-8 bg-card shadow-card">
            <TabsTrigger value="homework" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Homework</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="marks" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Marks</span>
            </TabsTrigger>
            <TabsTrigger value="notices" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Megaphone className="w-4 h-4" />
              <span className="hidden sm:inline">Notices</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          {/* Homework Tab */}
          <TabsContent value="homework" className="animate-fade-in">
            {!hasSubjects ? (
              <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                <EmptyState
                  icon={BookOpen}
                  title="No Subjects Enrolled Yet"
                  description="Your class teacher will add you to subjects. Once enrolled, your homework assignments will appear here."
                />
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-foreground mb-2">Your Subjects</h2>
                  <p className="text-muted-foreground text-sm">{subjects.length} subjects enrolled</p>
                </div>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {subjects.map((subject) => (
                    <div key={subject.code} className="bg-card rounded-xl p-5 shadow-card border border-border hover:shadow-card-hover transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{subject.name}</h3>
                          <p className="text-xs text-muted-foreground">{subject.code}</p>
                        </div>
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">Teacher: {subject.teacher}</p>
                      {subject.pending > 0 ? (
                        <div className="bg-warning/10 text-warning px-3 py-1.5 rounded-lg text-sm font-medium">
                          ● {subject.pending} homework pending
                        </div>
                      ) : (
                        <div className="bg-success/10 text-success px-3 py-1.5 rounded-lg text-sm font-medium">
                          ✓ All caught up!
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Pending Homework
                  </h2>
                </div>

                {hasHomework ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {homeworks.map((hw) => (
                      <div key={hw.id} className="bg-card rounded-xl p-5 shadow-card border border-border">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground">{hw.title}</h3>
                            <p className="text-sm text-muted-foreground">{hw.subject}</p>
                          </div>
                          {hw.status === "submitted" ? (
                            <span className="inline-flex items-center gap-1 bg-success/10 text-success px-2 py-1 rounded-lg text-xs font-medium">
                              <CheckCircle className="w-3 h-3" /> Submitted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-warning/10 text-warning px-2 py-1 rounded-lg text-xs font-medium">
                              <AlertCircle className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">Due: {hw.dueDate}</p>
                        {hw.status === "pending" && (
                          <LoadingButton 
                            className="w-full bg-gradient-primary text-primary-foreground shadow-button"
                            onClick={() => handleUpload(hw.id)}
                            loading={uploadingId === hw.id}
                            loadingText="Uploading..."
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Answer
                          </LoadingButton>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                    <EmptyState
                      icon={CheckCircle}
                      title="All Caught Up!"
                      description="You have no pending homework. Keep up the great work!"
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
                  title="No Attendance Records Yet"
                  description="Your attendance will appear here once your class teacher starts marking daily attendance."
                />
              </div>
            ) : (
              <>
                <div className="bg-card rounded-xl p-6 shadow-card border border-border mb-8">
                  <h2 className="text-xl font-bold text-foreground mb-6">Attendance Overview</h2>
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="relative w-40 h-40">
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
                        <span className="text-3xl font-bold text-primary">{attendanceData.percentage}%</span>
                        <span className="text-xs text-muted-foreground">Attendance</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 bg-primary rounded-full"></span>
                          <span className="text-foreground">Present</span>
                        </div>
                        <span className="font-semibold text-foreground">{attendanceData.present} days</span>
                      </div>
                      <Progress value={(attendanceData.present / (attendanceData.present + attendanceData.absent)) * 100} className="h-2" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 bg-destructive rounded-full"></span>
                          <span className="text-foreground">Absent</span>
                        </div>
                        <span className="font-semibold text-foreground">{attendanceData.absent} days</span>
                      </div>
                      <Progress value={(attendanceData.absent / (attendanceData.present + attendanceData.absent)) * 100} className="h-2 [&>div]:bg-destructive" />
                    </div>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-foreground mb-4">Daily Attendance Record</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentAttendance.map((record) => (
                    <div
                      key={record.date}
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
                        {record.status === "present" ? "✓ Present" : "✗ Absent"}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Marks Tab */}
          <TabsContent value="marks" className="animate-fade-in">
            {!hasMarks ? (
              <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                <EmptyState
                  icon={BarChart3}
                  title="No Marks Available Yet"
                  description="Your homework marks will appear here after teachers grade your submitted work."
                />
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-foreground mb-2">Homework Marks</h2>
                  <p className="text-muted-foreground text-sm">Your marks for submitted homework (out of 10)</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {marks.map((mark) => (
                    <div key={mark.subject} className="bg-card rounded-xl p-5 shadow-card border border-border">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-foreground">{mark.subject}</h3>
                        <BarChart3 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Homework Marks</span>
                          <span className="font-semibold text-primary">{mark.homeworkMarks}/{mark.maxMarks}</span>
                        </div>
                        <Progress value={(mark.homeworkMarks / mark.maxMarks) * 100} className="h-3" />
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-foreground">{mark.homeworkMarks}</span>
                        <span className="text-muted-foreground text-sm">/{mark.maxMarks}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Notices Tab */}
          <TabsContent value="notices" className="animate-fade-in">
            {!hasNotices ? (
              <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                <EmptyState
                  icon={Megaphone}
                  title="No Notices Yet"
                  description="School announcements and important updates will appear here."
                />
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-foreground mb-2">School Notices</h2>
                  <p className="text-muted-foreground text-sm">Important announcements and updates</p>
                </div>

                <div className="space-y-4">
                  {notices.map((notice) => (
                    <div key={notice.id} className="bg-card rounded-xl p-5 shadow-card border border-border">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-foreground">{notice.title}</h3>
                        <span className="text-xs text-muted-foreground">{notice.date}</span>
                      </div>
                      <p className="text-muted-foreground">{notice.content}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-2">Account Settings</h2>
                <p className="text-muted-foreground text-sm">Manage your profile and security settings</p>
              </div>
              <AccountSettings roleColor="bg-primary" />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentDashboard;
