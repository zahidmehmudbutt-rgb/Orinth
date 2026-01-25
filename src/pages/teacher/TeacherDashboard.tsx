import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, BookOpen, Plus, Users, Settings, Sparkles, ClipboardList, FileText, ExternalLink, Check, X } from "lucide-react";
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

const TeacherDashboard = () => {
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

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchTeacherData();
  }, []);

  useEffect(() => {
    if (gradingHomeworkId) {
      fetchSubmissions();
    }
  }, [gradingHomeworkId]);

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

  const fetchHomework = async (teacherId: string) => {
    const { data: homework } = await supabase
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

    if (homework) {
      const homeworkWithCounts = await Promise.all(
        homework.map(async (hw) => {
          const classData = hw.classes as { id: string; name: string; section: string } | null;

          // Count submissions
          const { count: submittedCount } = await supabase
            .from("homework_submissions")
            .select("id", { count: "exact", head: true })
            .eq("homework_id", hw.id)
            .not("submitted_at", "is", null);

          // Count total students in class
          const { count: totalStudents } = await supabase
            .from("students")
            .select("id", { count: "exact", head: true })
            .eq("class_id", hw.class_id);

          return {
            id: hw.id,
            title: hw.title,
            description: hw.description || "",
            subject: hw.subject,
            className: classData ? `${classData.name}-${classData.section}` : "Unknown",
            classId: hw.class_id,
            dueDate: new Date(hw.due_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            submitted: submittedCount || 0,
            total: totalStudents || 0,
            createdAt: hw.created_at,
          };
        })
      );

      setRecentHomework(homeworkWithCounts);
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
        .select("id, student_id, submitted_at, file_url, file_name, marks, remarks")
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
      console.error("Error fetching submissions:", error);
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
        title: "Missing Information",
        description: "Please fill in all required fields.",
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
        title: "Homework Posted",
        description: "Students can now see the new homework assignment.",
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
      console.error("Error creating homework:", error);
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Could not post homework. Please try again.",
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
        title: "Invalid Marks",
        description: "Marks must be between 0 and 10.",
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
        title: "Grade Saved",
        description: `Grade saved for ${submission?.studentName || "student"}.`,
      });

      // Refresh submissions
      await fetchSubmissions();

    } catch (error) {
      console.error("Error saving grade:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save grade. Please try again.",
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

  const uniqueClasses = Array.from(
    new Map(classes.map(c => [c.id, c])).values()
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-role-teacher border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const hasClasses = classes.length > 0;
  const hasHomework = recentHomework.length > 0;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="w-full bg-role-teacher text-primary-foreground sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Teacher Dashboard</h1>
              <p className="text-xs opacity-80">Welcome, {teacherData?.name}</p>
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
        {!hasClasses && (
          <WelcomeBanner
            icon={Sparkles}
            title="Welcome to Your Teacher Dashboard!"
            description="Your Section Head will assign classes to you. Once assigned, you can start creating homework and entering marks."
            tips={[
              "Wait for your Section Head to assign you to classes",
              "Once assigned, create homework from the Homework tab",
              "Use the Enter Marks tab to grade student submissions",
            ]}
            accentColor="bg-role-teacher"
            storageKey="teacher-welcome-dismissed"
            className="mb-6"
          />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full max-w-lg mx-auto grid grid-cols-3 mb-8 bg-card shadow-card">
            <TabsTrigger value="homework" className="flex items-center gap-2 data-[state=active]:bg-role-teacher data-[state=active]:text-primary-foreground">
              <BookOpen className="w-4 h-4" />
              Homework
            </TabsTrigger>
            <TabsTrigger value="marks" className="flex items-center gap-2 data-[state=active]:bg-role-teacher data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4" />
              Enter Marks
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2 data-[state=active]:bg-role-teacher data-[state=active]:text-primary-foreground">
              <Settings className="w-4 h-4" />
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="homework" className="animate-fade-in">
            {!hasClasses ? (
              <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                <EmptyState
                  icon={BookOpen}
                  title="No Classes Assigned Yet"
                  description="Your Section Head needs to assign you to classes before you can create homework. Contact your Section Head if you believe this is an error."
                />
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Create Homework Form */}
                <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                  <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-role-teacher" />
                    Create New Homework
                  </h2>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Class</Label>
                      <Select
                        value={selectedClass}
                        onValueChange={(value) => {
                          setSelectedClass(value);
                          setSelectedSubject("");
                        }}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a class" />
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
                      <Label>Select Subject</Label>
                      <Select
                        value={selectedSubject}
                        onValueChange={setSelectedSubject}
                        disabled={isSubmitting || !selectedClass}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={selectedClass ? "Choose a subject" : "Select a class first"} />
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
                      <Label>Homework Title</Label>
                      <Input
                        placeholder="e.g., Chapter 6 Exercises"
                        value={homeworkTitle}
                        onChange={(e) => setHomeworkTitle(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description (Optional)</Label>
                      <Textarea
                        placeholder="Enter homework details..."
                        rows={4}
                        value={homeworkDescription}
                        onChange={(e) => setHomeworkDescription(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Due Date</Label>
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
                      loadingText="Posting..."
                    >
                      Post Homework
                    </LoadingButton>
                  </div>
                </div>

                {/* Recent Homework */}
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">Recent Homework ({recentHomework.length})</h2>
                  {hasHomework ? (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                      {recentHomework.map((hw) => (
                        <div key={hw.id} className="bg-card rounded-xl p-5 shadow-card border border-border">
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
                              {hw.submitted}/{hw.total} submitted
                            </span>
                            <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-role-teacher rounded-full transition-all"
                                style={{ width: `${hw.total > 0 ? (hw.submitted / hw.total) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                      <EmptyState
                        icon={ClipboardList}
                        title="No Homework Created Yet"
                        description="Use the form on the left to create your first homework assignment."
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
                  title="No Classes Assigned Yet"
                  description="You need to be assigned to classes before you can enter marks."
                />
              </div>
            ) : !hasHomework ? (
              <div className="bg-card rounded-xl p-6 shadow-card border border-border max-w-2xl mx-auto">
                <EmptyState
                  icon={ClipboardList}
                  title="No Homework to Mark"
                  description="Create homework first, then come back here to enter marks after students submit."
                  actionLabel="Create Homework"
                  onAction={() => setActiveTab("homework")}
                />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                  <h2 className="text-xl font-bold text-foreground mb-6">Enter Homework Marks</h2>

                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                      <Label>Select Class</Label>
                      <Select
                        value={gradingClassId}
                        onValueChange={(value) => {
                          setGradingClassId(value);
                          setGradingHomeworkId("");
                          setSubmissions([]);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a class" />
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
                      <Label>Select Homework</Label>
                      <Select
                        value={gradingHomeworkId}
                        onValueChange={setGradingHomeworkId}
                        disabled={!gradingClassId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={gradingClassId ? "Choose homework" : "Select a class first"} />
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
                      Select a class and homework to enter marks (out of 10)
                    </p>
                  )}
                </div>

                {/* Submissions List */}
                {gradingHomeworkId && (
                  <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Student Submissions ({submissions.filter(s => s.submittedAt).length}/{submissions.length} submitted)
                    </h3>

                    {loadingSubmissions ? (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 border-4 border-role-teacher border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-muted-foreground">Loading submissions...</p>
                      </div>
                    ) : submissions.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No students in this class.</p>
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
                                    Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                                    {submission.fileUrl && (
                                      <a
                                        href={submission.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-primary hover:underline ml-2"
                                      >
                                        <FileText className="w-3 h-3" />
                                        {submission.fileName || "View File"}
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <X className="w-4 h-4" />
                                    Not submitted
                                  </div>
                                )}
                              </div>

                              {/* Grading Inputs */}
                              <div className="flex items-center gap-3">
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
                                <div className="flex-1 min-w-[150px]">
                                  <Input
                                    placeholder="Remarks (optional)"
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
                                  className="bg-role-teacher"
                                >
                                  Save
                                </LoadingButton>
                              </div>
                            </div>

                            {submission.marks !== null && (
                              <div className="mt-2 pt-2 border-t border-border/50 text-sm">
                                <span className="text-muted-foreground">Current grade: </span>
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

          {/* Account Tab */}
          <TabsContent value="account" className="animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-2">Account Settings</h2>
                <p className="text-muted-foreground text-sm">Manage your profile and security settings</p>
              </div>
              <AccountSettings roleColor="bg-role-teacher" />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TeacherDashboard;
