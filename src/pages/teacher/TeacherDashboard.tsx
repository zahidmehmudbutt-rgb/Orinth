import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, BookOpen, Plus, Users, Settings, Sparkles, ClipboardList } from "lucide-react";
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

const teacherData = {
  name: "Mr. Imran Ahmed",
  email: "imran@school.edu.pk",
};

// Mock data - in real app this comes from database
const classes: Array<{ id: string; name: string; students: number }> = [];
const recentHomework: Array<{ id: number; title: string; class: string; dueDate: string; submitted: number; total: number }> = [];

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState("homework");
  const [selectedClass, setSelectedClass] = useState("");
  const [homeworkTitle, setHomeworkTitle] = useState("");
  const [homeworkDescription, setHomeworkDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    navigate("/");
  };

  const handleCreateHomework = async () => {
    if (!selectedClass || !homeworkTitle.trim() || !dueDate) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select a class, enter a title, and set a due date.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Homework Posted",
        description: "Students have been notified about the new homework.",
      });
      setHomeworkTitle("");
      setHomeworkDescription("");
      setDueDate("");
      setSelectedClass("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Could not post homework. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <p className="text-xs opacity-80">Welcome, {teacherData.name}</p>
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
                      <Select value={selectedClass} onValueChange={setSelectedClass} disabled={isSubmitting}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
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
                      <Label>Description</Label>
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
                  <h2 className="text-xl font-bold text-foreground mb-4">Recent Homework</h2>
                  {hasHomework ? (
                    <div className="space-y-4">
                      {recentHomework.map((hw) => (
                        <div key={hw.id} className="bg-card rounded-xl p-5 shadow-card border border-border">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-foreground">{hw.title}</h3>
                              <p className="text-sm text-muted-foreground">{hw.class}</p>
                            </div>
                            <span className="text-xs text-muted-foreground">Due: {hw.dueDate}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {hw.submitted}/{hw.total} submitted
                            </span>
                            <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-role-teacher rounded-full"
                                style={{ width: `${(hw.submitted / hw.total) * 100}%` }}
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
              <div className="bg-card rounded-xl p-6 shadow-card border border-border max-w-2xl mx-auto">
                <h2 className="text-xl font-bold text-foreground mb-6">Enter Homework Marks</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="space-y-2">
                    <Label>Select Class</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Select Homework</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose homework" />
                      </SelectTrigger>
                      <SelectContent>
                        {recentHomework.map((hw) => (
                          <SelectItem key={hw.id} value={String(hw.id)}>{hw.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Select a class and homework to enter marks (out of 10)
                </p>
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
