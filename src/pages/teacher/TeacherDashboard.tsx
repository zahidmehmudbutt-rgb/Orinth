import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Bell, LogOut, BookOpen, Plus, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const teacherData = {
  name: "Mr. Imran Ahmed",
  email: "imran@school.edu.pk",
};

const classes = [
  { id: "9a", name: "Grade 9-A", students: 35 },
  { id: "9b", name: "Grade 9-B", students: 32 },
  { id: "10a", name: "Grade 10-A", students: 30 },
];

const recentHomework = [
  { id: 1, title: "Chapter 5 Exercises", class: "Grade 9-A", dueDate: "Jan 21", submitted: 28, total: 35 },
  { id: 2, title: "Algebra Practice", class: "Grade 9-B", dueDate: "Jan 22", submitted: 20, total: 32 },
  { id: 3, title: "Geometry Quiz Prep", class: "Grade 10-A", dueDate: "Jan 23", submitted: 15, total: 30 },
];

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState("homework");
  const [selectedClass, setSelectedClass] = useState("");
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 mb-8 bg-card shadow-card">
            <TabsTrigger value="homework" className="flex items-center gap-2 data-[state=active]:bg-role-teacher data-[state=active]:text-primary-foreground">
              <BookOpen className="w-4 h-4" />
              Homework
            </TabsTrigger>
            <TabsTrigger value="marks" className="flex items-center gap-2 data-[state=active]:bg-role-teacher data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4" />
              Enter Marks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="homework" className="animate-fade-in">
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
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
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
                    <Input placeholder="e.g., Chapter 6 Exercises" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea placeholder="Enter homework details..." rows={4} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input type="date" />
                  </div>
                  
                  <Button className="w-full bg-role-teacher text-primary-foreground hover:opacity-90">
                    Post Homework
                  </Button>
                </div>
              </div>

              {/* Recent Homework */}
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">Recent Homework</h2>
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
              </div>
            </div>
          </TabsContent>

          <TabsContent value="marks" className="animate-fade-in">
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
                      <SelectItem value="hw1">Chapter 5 Exercises</SelectItem>
                      <SelectItem value="hw2">Algebra Practice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Select a class and homework to enter marks (out of 10)
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TeacherDashboard;
