import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, UserPlus, Users, Trash2, Edit, BookMarked, Settings } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import AccountSettings from "@/components/account/AccountSettings";

const coordinatorData = {
  name: "Dr. Rashid Mahmood",
  section: "Middle Section (6-8)",
};

const staff = [
  { id: 1, name: "Mr. Imran Ahmed", email: "imran@school.edu.pk", role: "Teacher", subject: "Mathematics" },
  { id: 2, name: "Ms. Ayesha Khan", email: "ayesha@school.edu.pk", role: "Class Teacher", class: "Grade 9-A" },
  { id: 3, name: "Mr. Hassan Ali", email: "hassan@school.edu.pk", role: "Teacher", subject: "Physics" },
  { id: 4, name: "Ms. Fatima Zahra", email: "fatima@school.edu.pk", role: "Class Teacher", class: "Grade 8-B" },
];

const CoordinatorDashboard = () => {
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherEmail, setNewTeacherEmail] = useState("");
  const [newTeacherPassword, setNewTeacherPassword] = useState("");
  const [teacherType, setTeacherType] = useState("teacher");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    navigate("/");
  };

  const handleAddTeacher = () => {
    if (!newTeacherName.trim() || !newTeacherEmail.trim() || !newTeacherPassword.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill all required fields",
      });
      return;
    }
    
    toast({
      title: "Staff Added",
      description: `${newTeacherName} has been added successfully. They will be required to complete their profile on first login.`,
    });
    setNewTeacherName("");
    setNewTeacherEmail("");
    setNewTeacherPassword("");
  };

  const handleRemoveStaff = (staffName: string) => {
    toast({
      title: "Staff Removed",
      description: `${staffName} has been removed from the section.`,
    });
  };

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
              <p className="text-xs opacity-80">{coordinatorData.name} • {coordinatorData.section}</p>
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
        <Tabs defaultValue="staff" className="w-full">
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
                          onChange={() => setTeacherType("teacher")}
                          className="w-4 h-4"
                        />
                        <span className="text-foreground">Teacher</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="staffType"
                          value="class-teacher"
                          checked={teacherType === "class-teacher"}
                          onChange={() => setTeacherType("class-teacher")}
                          className="w-4 h-4"
                        />
                        <span className="text-foreground">Class Teacher</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      placeholder="Enter full name"
                      value={newTeacherName}
                      onChange={(e) => setNewTeacherName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={newTeacherEmail}
                      onChange={(e) => setNewTeacherEmail(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      placeholder="Set initial password"
                      value={newTeacherPassword}
                      onChange={(e) => setNewTeacherPassword(e.target.value)}
                    />
                  </div>
                  
                  <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                    📝 Staff will be required to complete their profile (address, phone, WhatsApp) on first login.
                  </p>
                  
                  <Button 
                    className="w-full bg-role-coordinator text-primary-foreground hover:opacity-90"
                    onClick={handleAddTeacher}
                  >
                    Add Staff
                  </Button>
                </div>
              </div>

              {/* Staff List */}
              <div>
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
                            <p className="font-semibold text-foreground">{member.name}</p>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              member.role === "Teacher" ? 'bg-role-teacher/10 text-role-teacher' : 'bg-role-class-teacher/10 text-role-class-teacher'
                            }`}>
                              {member.role}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {member.subject || member.class}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
                            <Edit className="w-4 h-4" />
                          </Button>
                          
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
                                  Are you sure you want to remove {member.name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-destructive text-destructive-foreground"
                                  onClick={() => handleRemoveStaff(member.name)}
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
