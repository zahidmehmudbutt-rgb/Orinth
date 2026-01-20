import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, UserPlus, Users, Crown, BarChart3, Trash2 } from "lucide-react";
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

const principalData = {
  name: "Prof. Dr. Muhammad Arif",
};

const sectionHeads = [
  { id: 1, name: "Dr. Rashid Mahmood", email: "rashid@school.edu.pk", section: "Middle Section (6-8)" },
  { id: 2, name: "Ms. Saima Noor", email: "saima@school.edu.pk", section: "Primary Section (1-5)" },
  { id: 3, name: "Mr. Khalid Mehmood", email: "khalid@school.edu.pk", section: "Secondary Section (9-10)" },
];

const schoolStats = [
  { label: "Total Students", value: "5,234", change: "+12%" },
  { label: "Total Teachers", value: "187", change: "+5%" },
  { label: "Classes", value: "120", change: "+8%" },
  { label: "Average Attendance", value: "92%", change: "+2%" },
];

const PrincipalDashboard = () => {
  const [activeTab, setActiveTab] = useState("staff");
  const [newCoordinatorName, setNewCoordinatorName] = useState("");
  const [newCoordinatorEmail, setNewCoordinatorEmail] = useState("");
  const [newCoordinatorPassword, setNewCoordinatorPassword] = useState("");
  const [newCoordinatorSection, setNewCoordinatorSection] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    navigate("/");
  };

  const handleAddCoordinator = () => {
    if (!newCoordinatorName.trim() || !newCoordinatorEmail.trim() || !newCoordinatorPassword.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill all required fields",
      });
      return;
    }
    
    toast({
      title: "Section Head Added",
      description: `${newCoordinatorName} has been added as Section Head.`,
    });
    setNewCoordinatorName("");
    setNewCoordinatorEmail("");
    setNewCoordinatorPassword("");
    setNewCoordinatorSection("");
  };

  const handleRemoveCoordinator = (name: string) => {
    toast({
      title: "Section Head Removed",
      description: `${name} has been removed.`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="w-full bg-role-principal text-primary-foreground sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Principal Dashboard</h1>
              <p className="text-xs opacity-80">{principalData.name}</p>
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
            <TabsTrigger value="staff" className="flex items-center gap-2 data-[state=active]:bg-role-principal data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4" />
              Staff Management
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-role-principal data-[state=active]:text-primary-foreground">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="staff" className="animate-fade-in">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Add Section Head Form */}
              <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-role-principal" />
                  Add Section Head / Coordinator
                </h2>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      placeholder="Enter full name"
                      value={newCoordinatorName}
                      onChange={(e) => setNewCoordinatorName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={newCoordinatorEmail}
                      onChange={(e) => setNewCoordinatorEmail(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      placeholder="Set initial password"
                      value={newCoordinatorPassword}
                      onChange={(e) => setNewCoordinatorPassword(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Section</Label>
                    <Input
                      placeholder="e.g., Primary Section (1-5)"
                      value={newCoordinatorSection}
                      onChange={(e) => setNewCoordinatorSection(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    className="w-full bg-role-principal text-primary-foreground hover:opacity-90"
                    onClick={handleAddCoordinator}
                  >
                    Add Section Head
                  </Button>
                </div>
              </div>

              {/* Section Heads List */}
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">Section Heads</h2>
                
                <div className="space-y-3">
                  {sectionHeads.map((head) => (
                    <div key={head.id} className="bg-card rounded-xl p-4 shadow-card border border-border">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{head.name}</p>
                          <p className="text-sm text-muted-foreground">{head.email}</p>
                          <p className="text-xs text-primary mt-1">{head.section}</p>
                        </div>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Section Head?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove {head.name}? This is a critical action and cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-destructive text-destructive-foreground"
                                onClick={() => handleRemoveCoordinator(head.name)}
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="animate-fade-in">
            <h2 className="text-xl font-bold text-foreground mb-6">School Analytics Overview</h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {schoolStats.map((stat) => (
                <div key={stat.label} className="bg-card rounded-xl p-5 shadow-card border border-border">
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-foreground">{stat.value}</span>
                    <span className="text-sm text-success mb-1">{stat.change}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Simple Charts Placeholder */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                <h3 className="font-semibold text-foreground mb-4">Attendance Trend</h3>
                <div className="h-48 flex items-center justify-center text-muted-foreground bg-secondary/30 rounded-lg">
                  <BarChart3 className="w-12 h-12 opacity-50" />
                </div>
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Detailed charts will be available after backend integration
                </p>
              </div>
              
              <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                <h3 className="font-semibold text-foreground mb-4">Homework Completion Rate</h3>
                <div className="h-48 flex items-center justify-center text-muted-foreground bg-secondary/30 rounded-lg">
                  <BarChart3 className="w-12 h-12 opacity-50" />
                </div>
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Detailed charts will be available after backend integration
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PrincipalDashboard;
