import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, UserPlus, Users, Crown, BarChart3, Trash2, Settings, Sparkles, BookOpen, GraduationCap } from "lucide-react";
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
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { WelcomeBanner } from "@/components/onboarding/WelcomeBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingButton } from "@/components/ui/LoadingButton";

const principalData = {
  name: "Prof. Dr. Muhammad Arif",
};

// Mock empty state for demo - in real app this would come from database
const sectionHeads: Array<{ id: number; name: string; email: string; section: string }> = [];

const schoolStats = [
  { label: "Total Students", value: "0", change: "-" },
  { label: "Total Teachers", value: "0", change: "-" },
  { label: "Classes", value: "0", change: "-" },
  { label: "Average Attendance", value: "-", change: "-" },
];

const PrincipalDashboard = () => {
  const [activeTab, setActiveTab] = useState("staff");
  const [newCoordinatorName, setNewCoordinatorName] = useState("");
  const [newCoordinatorEmail, setNewCoordinatorEmail] = useState("");
  const [newCoordinatorPassword, setNewCoordinatorPassword] = useState("");
  const [newCoordinatorSection, setNewCoordinatorSection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Onboarding checklist items
  const checklistItems = [
    {
      id: "profile",
      label: "Complete your profile",
      description: "Add your contact information and photo",
      completed: true,
      onClick: () => setActiveTab("account"),
    },
    {
      id: "coordinator",
      label: "Add your first Section Head",
      description: "Assign coordinators to manage different sections",
      completed: sectionHeads.length > 0,
      onClick: () => setActiveTab("staff"),
    },
    {
      id: "review",
      label: "Review school settings",
      description: "Configure academic year and school details",
      completed: false,
    },
  ];

  const handleLogout = () => {
    navigate("/");
  };

  const handleAddCoordinator = async () => {
    if (!newCoordinatorName.trim() || !newCoordinatorEmail.trim() || !newCoordinatorPassword.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in the name, email, and password fields.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Section Head Added",
        description: `${newCoordinatorName} has been added successfully. They can now log in with the provided credentials.`,
      });
      setNewCoordinatorName("");
      setNewCoordinatorEmail("");
      setNewCoordinatorPassword("");
      setNewCoordinatorSection("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Could not add the section head. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCoordinator = (name: string) => {
    toast({
      title: "Section Head Removed",
      description: `${name} has been removed from the system.`,
    });
  };

  const showOnboarding = sectionHeads.length === 0;

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
        {/* Welcome Banner for new principals */}
        {showOnboarding && (
          <WelcomeBanner
            icon={Sparkles}
            title="Welcome to Your School Dashboard!"
            description="Let's get your school set up. Follow the checklist below to configure your school management system."
            tips={[
              "Start by adding Section Heads who will manage teachers",
              "Each Section Head can then add Teachers and Class Teachers",
              "You can view all school analytics once data starts flowing in",
            ]}
            accentColor="bg-role-principal"
            storageKey="principal-welcome-dismissed"
            className="mb-6"
          />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full max-w-lg mx-auto grid grid-cols-3 mb-8 bg-card shadow-card">
            <TabsTrigger value="staff" className="flex items-center gap-2 data-[state=active]:bg-role-principal data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4" />
              Staff Management
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-role-principal data-[state=active]:text-primary-foreground">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2 data-[state=active]:bg-role-principal data-[state=active]:text-primary-foreground">
              <Settings className="w-4 h-4" />
              Account
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
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={newCoordinatorEmail}
                      onChange={(e) => setNewCoordinatorEmail(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      placeholder="Set initial password"
                      value={newCoordinatorPassword}
                      onChange={(e) => setNewCoordinatorPassword(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Section</Label>
                    <Input
                      placeholder="e.g., Primary Section (1-5)"
                      value={newCoordinatorSection}
                      onChange={(e) => setNewCoordinatorSection(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <LoadingButton 
                    className="w-full bg-role-principal text-primary-foreground hover:opacity-90"
                    onClick={handleAddCoordinator}
                    loading={isSubmitting}
                    loadingText="Adding..."
                  >
                    Add Section Head
                  </LoadingButton>
                </div>
              </div>

              {/* Section Heads List or Onboarding */}
              <div>
                {showOnboarding ? (
                  <OnboardingChecklist
                    title="Getting Started"
                    subtitle="Complete these steps to set up your school"
                    items={checklistItems}
                  />
                ) : (
                  <>
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
                  </>
                )}

                {!showOnboarding && sectionHeads.length === 0 && (
                  <EmptyState
                    icon={Users}
                    title="No Section Heads Yet"
                    description="Add your first section head to start organizing your school staff hierarchy."
                    actionLabel="Add Section Head"
                    onAction={() => document.querySelector<HTMLInputElement>('input[placeholder="Enter full name"]')?.focus()}
                  />
                )}
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
                    <span className="text-sm text-muted-foreground mb-1">{stat.change}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty state for charts */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                <h3 className="font-semibold text-foreground mb-4">Attendance Trend</h3>
                <EmptyState
                  icon={BarChart3}
                  title="No Data Yet"
                  description="Attendance charts will appear here once teachers start marking daily attendance."
                />
              </div>
              
              <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                <h3 className="font-semibold text-foreground mb-4">Homework Completion Rate</h3>
                <EmptyState
                  icon={BookOpen}
                  title="No Data Yet"
                  description="Homework statistics will appear here once teachers start assigning homework."
                />
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
              <AccountSettings roleColor="bg-role-principal" />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PrincipalDashboard;
