import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, LogOut, BookOpen, Calendar, BarChart3, Megaphone, Clock, Upload, CheckCircle, AlertCircle, Settings, Sparkles, FileText, Download } from "lucide-react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import AccountSettings from "@/components/account/AccountSettings";
import { WelcomeBanner } from "@/components/onboarding/WelcomeBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { supabase } from "@/integrations/supabase/client";

interface StudentData {
  id: string;
  studentId: string;
  name: string;
  className: string;
  classId: string;
}

interface Subject {
  name: string;
  code: string;
  teacher: string;
  pending: number;
}

interface Homework {
  id: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  status: "pending" | "submitted" | "graded";
  marks?: number;
  remarks?: string;
  fileUrl?: string;
  fileName?: string;
}

interface AttendanceRecord {
  date: string;
  day: string;
  status: "present" | "absent";
}

interface Mark {
  subject: string;
  title: string;
  marks: number;
  maxMarks: number;
  remarks?: string;
}

interface Notice {
  id: string;
  title: string;
  date: string;
  content: string;
}

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState("homework");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [attendanceData, setAttendanceData] = useState({ present: 0, absent: 0, percentage: 0 });
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/student/login");
        return;
      }

      // Get student record
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select(`
          id,
          student_id,
          full_name,
          class_id,
          classes (
            id,
            name,
            section
          )
        `)
        .eq("user_id", user.id)
        .single();

      if (studentError || !student) {
        console.error("Error fetching student:", studentError);
        return;
      }

      const classInfo = student.classes as { id: string; name: string; section: string } | null;

      setStudentData({
        id: student.id,
        studentId: student.student_id,
        name: student.full_name,
        className: classInfo ? `${classInfo.name}-${classInfo.section}` : "Not Assigned",
        classId: student.class_id,
      });

      // Fetch all data in parallel
      await Promise.all([
        fetchSubjectsAndHomework(student.class_id, student.id),
        fetchAttendance(student.id),
        fetchNotices(student.class_id),
      ]);

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

  const fetchSubjectsAndHomework = async (classId: string, studentId: string) => {
    // Get teachers and subjects for this class
    const { data: teacherClasses } = await supabase
      .from("teacher_classes")
      .select(`
        subject,
        teacher_id,
        profiles!teacher_classes_teacher_id_fkey (full_name)
      `)
      .eq("class_id", classId);

    // Get homework for this class
    const { data: homeworkData } = await supabase
      .from("homework")
      .select(`
        id,
        title,
        description,
        subject,
        due_date,
        teacher_id,
        profiles!homework_teacher_id_fkey (full_name)
      `)
      .eq("class_id", classId)
      .order("due_date", { ascending: true });

    // Get student's submissions
    const { data: submissions } = await supabase
      .from("homework_submissions")
      .select("homework_id, submitted_at, marks, remarks, file_url, file_name")
      .eq("student_id", studentId);

    const submissionMap = new Map(
      submissions?.map(s => [s.homework_id, s]) || []
    );

    // Build subjects with pending count
    const subjectMap = new Map<string, Subject>();
    teacherClasses?.forEach(tc => {
      const profile = tc.profiles as { full_name: string } | null;
      if (!subjectMap.has(tc.subject)) {
        subjectMap.set(tc.subject, {
          name: tc.subject,
          code: tc.subject.substring(0, 3).toUpperCase(),
          teacher: profile?.full_name || "Unknown",
          pending: 0,
        });
      }
    });

    // Process homework
    const processedHomework: Homework[] = [];
    const marksData: Mark[] = [];

    homeworkData?.forEach(hw => {
      const submission = submissionMap.get(hw.id);
      const isPastDue = new Date(hw.due_date) < new Date();

      let status: "pending" | "submitted" | "graded" = "pending";
      if (submission?.marks !== null && submission?.marks !== undefined) {
        status = "graded";
      } else if (submission?.submitted_at) {
        status = "submitted";
      }

      processedHomework.push({
        id: hw.id,
        subject: hw.subject,
        title: hw.title,
        description: hw.description || "",
        dueDate: new Date(hw.due_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        status,
        marks: submission?.marks,
        remarks: submission?.remarks,
        fileUrl: submission?.file_url,
        fileName: submission?.file_name,
      });

      // Update pending count
      if (status === "pending" && !isPastDue) {
        const subject = subjectMap.get(hw.subject);
        if (subject) {
          subject.pending++;
        }
      }

      // Add to marks if graded
      if (status === "graded" && submission?.marks !== undefined) {
        marksData.push({
          subject: hw.subject,
          title: hw.title,
          marks: submission.marks,
          maxMarks: 10,
          remarks: submission.remarks,
        });
      }
    });

    setSubjects(Array.from(subjectMap.values()));
    setHomeworks(processedHomework);
    setMarks(marksData);
  };

  const fetchAttendance = async (studentId: string) => {
    const { data: attendanceRecords } = await supabase
      .from("attendance")
      .select("date, is_present")
      .eq("student_id", studentId)
      .order("date", { ascending: false })
      .limit(30);

    if (attendanceRecords && attendanceRecords.length > 0) {
      const present = attendanceRecords.filter(r => r.is_present).length;
      const absent = attendanceRecords.filter(r => !r.is_present).length;
      const total = present + absent;

      setAttendanceData({
        present,
        absent,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      });

      setRecentAttendance(
        attendanceRecords.slice(0, 14).map(r => ({
          date: new Date(r.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          day: new Date(r.date).toLocaleDateString("en-US", { weekday: "long" }),
          status: r.is_present ? "present" : "absent",
        }))
      );
    }
  };

  const fetchNotices = async (classId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get student's school_id
    const { data: student } = await supabase
      .from("students")
      .select("school_id")
      .eq("user_id", user.id)
      .single();

    if (!student) return;

    const { data: noticesData } = await supabase
      .from("notices")
      .select("id, title, content, created_at")
      .eq("school_id", student.school_id)
      .or(`target_class_id.is.null,target_class_id.eq.${classId}`)
      .or("target_role.is.null,target_role.eq.student")
      .order("created_at", { ascending: false })
      .limit(10);

    if (noticesData) {
      setNotices(
        noticesData.map(n => ({
          id: n.id,
          title: n.title,
          content: n.content,
          date: new Date(n.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        }))
      );
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleFileSelect = (homeworkId: string) => {
    const input = fileInputRefs.current[homeworkId];
    if (input) {
      input.click();
    }
  };

  const handleUpload = async (homeworkId: string, file: File) => {
    if (!studentData) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/gif", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Maximum file size is 10MB.",
      });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload PDF, Word, or image files only.",
      });
      return;
    }

    setUploadingId(homeworkId);

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${homeworkId}_${Date.now()}.${fileExt}`;
      const filePath = `${studentData.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("homework-files")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("homework-files")
        .getPublicUrl(filePath);

      // Check if submission exists
      const { data: existingSubmission } = await supabase
        .from("homework_submissions")
        .select("id")
        .eq("homework_id", homeworkId)
        .eq("student_id", studentData.id)
        .single();

      if (existingSubmission) {
        // Update existing submission
        const { error: updateError } = await supabase
          .from("homework_submissions")
          .update({
            file_url: urlData.publicUrl,
            file_name: file.name,
            submitted_at: new Date().toISOString(),
          })
          .eq("id", existingSubmission.id);

        if (updateError) throw updateError;
      } else {
        // Create new submission
        const { error: insertError } = await supabase
          .from("homework_submissions")
          .insert({
            homework_id: homeworkId,
            student_id: studentData.id,
            file_url: urlData.publicUrl,
            file_name: file.name,
            submitted_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }

      toast({
        title: "Homework Submitted",
        description: "Your homework has been submitted successfully.",
      });

      // Refresh homework list
      await fetchSubjectsAndHomework(studentData.classId, studentData.id);

    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Could not submit homework. Please try again.",
      });
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const hasSubjects = subjects.length > 0;
  const hasHomework = homeworks.length > 0;
  const hasAttendance = recentAttendance.length > 0;
  const hasMarks = marks.length > 0;
  const hasNotices = notices.length > 0;
  const pendingHomework = homeworks.filter(h => h.status === "pending");

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
              <p className="text-xs opacity-80">Welcome back, {studentData?.name}!</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm opacity-80">{studentData?.className}</span>
            <NotificationCenter className="text-primary-foreground hover:bg-primary-foreground/20" />
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
                          {subject.pending} homework pending
                        </div>
                      ) : (
                        <div className="bg-success/10 text-success px-3 py-1.5 rounded-lg text-sm font-medium">
                          All caught up!
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    All Homework ({homeworks.length})
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
                          {hw.status === "graded" ? (
                            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-lg text-xs font-medium">
                              <BarChart3 className="w-3 h-3" /> {hw.marks}/10
                            </span>
                          ) : hw.status === "submitted" ? (
                            <span className="inline-flex items-center gap-1 bg-success/10 text-success px-2 py-1 rounded-lg text-xs font-medium">
                              <CheckCircle className="w-3 h-3" /> Submitted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-warning/10 text-warning px-2 py-1 rounded-lg text-xs font-medium">
                              <AlertCircle className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </div>

                        {hw.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{hw.description}</p>
                        )}

                        <p className="text-sm text-muted-foreground mb-4">Due: {hw.dueDate}</p>

                        {hw.remarks && (
                          <p className="text-sm text-primary mb-3 italic">"{hw.remarks}"</p>
                        )}

                        {hw.fileName && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <FileText className="w-4 h-4" />
                            <span className="truncate">{hw.fileName}</span>
                          </div>
                        )}

                        {hw.status === "pending" && (
                          <>
                            <input
                              type="file"
                              ref={(el) => (fileInputRefs.current[hw.id] = el)}
                              className="hidden"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUpload(hw.id, file);
                              }}
                            />
                            <LoadingButton
                              className="w-full bg-gradient-primary text-primary-foreground shadow-button"
                              onClick={() => handleFileSelect(hw.id)}
                              loading={uploadingId === hw.id}
                              loadingText="Uploading..."
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Answer
                            </LoadingButton>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                    <EmptyState
                      icon={CheckCircle}
                      title="No Homework Yet"
                      description="Your teachers haven't assigned any homework yet."
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
                  {recentAttendance.map((record, index) => (
                    <div
                      key={index}
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
                        {record.status === "present" ? "Present" : "Absent"}
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
                  {marks.map((mark, index) => (
                    <div key={index} className="bg-card rounded-xl p-5 shadow-card border border-border">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-foreground">{mark.title}</h3>
                          <p className="text-sm text-muted-foreground">{mark.subject}</p>
                        </div>
                        <BarChart3 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Score</span>
                          <span className="font-semibold text-primary">{mark.marks}/{mark.maxMarks}</span>
                        </div>
                        <Progress value={(mark.marks / mark.maxMarks) * 100} className="h-3" />
                      </div>
                      {mark.remarks && (
                        <p className="text-sm text-muted-foreground italic">"{mark.remarks}"</p>
                      )}
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
