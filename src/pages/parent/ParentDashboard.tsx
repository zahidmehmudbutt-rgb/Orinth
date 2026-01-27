import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  BookOpen,
  Calendar,
  Bell,
  LogOut,
  User,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Loader2,
  Settings
} from "lucide-react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { GroupChat } from "@/components/chat";
import { EmailPreferences } from "@/components/account/EmailPreferences";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Child {
  id: string;
  full_name: string;
  student_id: string;
  class_id: string;
  class_name?: string;
  section?: string;
}

interface Homework {
  id: string;
  title: string;
  subject: string;
  due_date: string;
  description?: string;
  submission?: {
    submitted_at: string | null;
    marks: number | null;
    remarks: string | null;
  };
}

interface AttendanceRecord {
  id: string;
  date: string;
  is_present: boolean;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

const ParentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("academics");

  // Fetch children linked to this parent
  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('parent_students')
          .select(`
            student_id,
            students:student_id (
              id,
              full_name,
              student_id,
              class_id,
              classes:class_id (
                name,
                section
              )
            )
          `)
          .eq('parent_id', user.id);

        if (error) throw error;

        const childrenData: Child[] = (data || []).map((item: any) => ({
          id: item.students.id,
          full_name: item.students.full_name,
          student_id: item.students.student_id,
          class_id: item.students.class_id,
          class_name: item.students.classes?.name,
          section: item.students.classes?.section,
        }));

        setChildren(childrenData);
        if (childrenData.length > 0) {
          setSelectedChild(childrenData[0]);
        }
      } catch (error) {
        console.error('Error fetching children:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load children data",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChildren();
  }, [user]);

  // Fetch homework for selected child
  useEffect(() => {
    const fetchHomework = async () => {
      if (!selectedChild) return;

      try {
        const { data: homeworkData, error: homeworkError } = await supabase
          .from('homework')
          .select('id, title, subject, due_date, description')
          .eq('class_id', selectedChild.class_id)
          .order('due_date', { ascending: false })
          .limit(10);

        if (homeworkError) throw homeworkError;

        // Fetch submissions for this student
        const { data: submissions, error: submissionsError } = await supabase
          .from('homework_submissions')
          .select('homework_id, submitted_at, marks, remarks')
          .eq('student_id', selectedChild.id);

        if (submissionsError) throw submissionsError;

        const submissionsMap = new Map(
          (submissions || []).map(s => [s.homework_id, s])
        );

        const homeworkWithSubmissions: Homework[] = (homeworkData || []).map(hw => ({
          ...hw,
          submission: submissionsMap.get(hw.id) || undefined,
        }));

        setHomework(homeworkWithSubmissions);
      } catch (error) {
        console.error('Error fetching homework:', error);
      }
    };

    fetchHomework();
  }, [selectedChild]);

  // Fetch attendance for selected child
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedChild) return;

      try {
        const { data, error } = await supabase
          .from('attendance')
          .select('id, date, is_present')
          .eq('student_id', selectedChild.id)
          .order('date', { ascending: false })
          .limit(30);

        if (error) throw error;
        setAttendance(data || []);
      } catch (error) {
        console.error('Error fetching attendance:', error);
      }
    };

    fetchAttendance();
  }, [selectedChild]);

  // Fetch notices
  useEffect(() => {
    const fetchNotices = async () => {
      if (!selectedChild) return;

      try {
        const { data, error } = await supabase
          .from('notices')
          .select('id, title, content, created_at')
          .or(`target_class_id.eq.${selectedChild.class_id},target_class_id.is.null`)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setNotices(data || []);
      } catch (error) {
        console.error('Error fetching notices:', error);
      }
    };

    fetchNotices();
  }, [selectedChild]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Calculate attendance stats
  const attendanceStats = {
    total: attendance.length,
    present: attendance.filter(a => a.is_present).length,
    absent: attendance.filter(a => !a.is_present).length,
    percentage: attendance.length > 0
      ? Math.round((attendance.filter(a => a.is_present).length / attendance.length) * 100)
      : 0,
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Parent Dashboard</h1>
              <p className="text-xs text-gray-500">Welcome, {profile?.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GroupChat />
            <NotificationCenter />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {children.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Children Linked</h3>
              <p className="text-gray-500">
                No children have been linked to your account yet. Please contact the school administration.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Child Selector */}
            {children.length > 1 && (
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Select Child</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {children.map(child => (
                      <Button
                        key={child.id}
                        variant={selectedChild?.id === child.id ? "default" : "outline"}
                        className={selectedChild?.id === child.id ? "bg-purple-600 hover:bg-purple-700" : ""}
                        onClick={() => setSelectedChild(child)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        {child.full_name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selected Child Info */}
            {selectedChild && (
              <Card className="mb-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                <CardContent className="py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <GraduationCap className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{selectedChild.full_name}</h2>
                      <p className="text-purple-100">
                        {selectedChild.class_name} {selectedChild.section && `- Section ${selectedChild.section}`}
                      </p>
                      <p className="text-purple-200 text-sm">ID: {selectedChild.student_id}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="academics" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Academics
                </TabsTrigger>
                <TabsTrigger value="attendance" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Attendance
                </TabsTrigger>
                <TabsTrigger value="notices" className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notices
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              {/* Academics Tab */}
              <TabsContent value="academics">
                <Card>
                  <CardHeader>
                    <CardTitle>Homework & Assignments</CardTitle>
                    <CardDescription>Recent homework and submission status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {homework.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No homework assignments yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {homework.map(hw => (
                          <div key={hw.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-900">{hw.title}</h4>
                                <p className="text-sm text-gray-500">{hw.subject}</p>
                              </div>
                              {hw.submission?.submitted_at ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Submitted
                                </Badge>
                              ) : new Date(hw.due_date) < new Date() ? (
                                <Badge variant="destructive">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Overdue
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              Due: {new Date(hw.due_date).toLocaleDateString()}
                            </p>
                            {hw.submission?.marks !== null && hw.submission?.marks !== undefined && (
                              <div className="mt-2 p-2 bg-gray-50 rounded">
                                <p className="text-sm">
                                  <span className="font-medium">Marks:</span>{" "}
                                  <span className={hw.submission.marks >= 7 ? "text-green-600" : hw.submission.marks >= 5 ? "text-yellow-600" : "text-red-600"}>
                                    {hw.submission.marks}/10
                                  </span>
                                </p>
                                {hw.submission.remarks && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    <span className="font-medium">Remarks:</span> {hw.submission.remarks}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Attendance Tab */}
              <TabsContent value="attendance">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Attendance Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Attendance Summary</CardTitle>
                      <CardDescription>Last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center mb-6">
                        <div className="relative w-32 h-32">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              stroke="#e5e7eb"
                              strokeWidth="12"
                              fill="none"
                            />
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              stroke={attendanceStats.percentage >= 75 ? "#22c55e" : attendanceStats.percentage >= 50 ? "#eab308" : "#ef4444"}
                              strokeWidth="12"
                              fill="none"
                              strokeDasharray={`${attendanceStats.percentage * 3.52} 352`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold">{attendanceStats.percentage}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{attendanceStats.total}</p>
                          <p className="text-sm text-gray-500">Total Days</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
                          <p className="text-sm text-gray-500">Present</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
                          <p className="text-sm text-gray-500">Absent</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Attendance */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Attendance</CardTitle>
                      <CardDescription>Day by day record</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {attendance.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No attendance records yet</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {attendance.slice(0, 15).map(record => (
                            <div key={record.id} className="flex justify-between items-center py-2 border-b last:border-0">
                              <span className="text-sm text-gray-600">
                                {new Date(record.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                              {record.is_present ? (
                                <Badge className="bg-green-100 text-green-800">Present</Badge>
                              ) : (
                                <Badge variant="destructive">Absent</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Notices Tab */}
              <TabsContent value="notices">
                <Card>
                  <CardHeader>
                    <CardTitle>School Notices</CardTitle>
                    <CardDescription>Announcements and updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {notices.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No notices available</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {notices.map(notice => (
                          <div key={notice.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-gray-900">{notice.title}</h4>
                              <span className="text-xs text-gray-500">
                                {new Date(notice.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{notice.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings">
                <div className="max-w-2xl mx-auto">
                  <EmailPreferences />
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
};

export default ParentDashboard;
