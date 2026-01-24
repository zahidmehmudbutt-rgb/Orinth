import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { signUp } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
import {
  ArrowLeft,
  Crown,
  Loader2,
  Plus,
  Power,
  User,
  Mail,
  Lock,
} from "lucide-react";

interface School {
  id: string;
  name: string;
  email: string | null;
  is_active: boolean;
}

interface Principal {
  id: string;
  user_id: string;
  is_active: boolean;
  profile: {
    full_name: string;
    email: string | null;
  } | null;
}

const ManagePrincipal = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const { isHost, loading } = useAuth();
  const { toast } = useToast();

  const [school, setSchool] = useState<School | null>(null);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [isLoadingSchool, setIsLoadingSchool] = useState(true);
  const [isLoadingPrincipal, setIsLoadingPrincipal] = useState(true);

  // New principal form
  const [showNewPrincipalForm, setShowNewPrincipalForm] = useState(false);
  const [newPrincipal, setNewPrincipal] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [isCreatingPrincipal, setIsCreatingPrincipal] = useState(false);

  useEffect(() => {
    if (!loading && !isHost) {
      navigate("/sys-admin-x7k9");
    }
  }, [loading, isHost, navigate]);

  useEffect(() => {
    if (isHost && schoolId) {
      fetchSchool();
      fetchPrincipal();
    }
  }, [isHost, schoolId]);

  const fetchSchool = async () => {
    if (!schoolId) return;

    setIsLoadingSchool(true);
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, email, is_active')
        .eq('id', schoolId)
        .single();

      if (error) throw error;
      setSchool(data as School);
    } catch (error) {
      console.error('Error fetching school:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load school details.",
      });
    } finally {
      setIsLoadingSchool(false);
    }
  };

  const fetchPrincipal = async () => {
    if (!schoolId) return;

    setIsLoadingPrincipal(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          is_active,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq('school_id', schoolId)
        .eq('role', 'principal')
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        // Handle the nested profile data
        const profileData = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
        setPrincipal({
          id: data.id,
          user_id: data.user_id,
          is_active: data.is_active,
          profile: profileData ? {
            full_name: profileData.full_name,
            email: profileData.email
          } : null
        });
      } else {
        setPrincipal(null);
      }
    } catch (error) {
      console.error('Error fetching principal:', error);
    } finally {
      setIsLoadingPrincipal(false);
    }
  };

  const handleCreatePrincipal = async () => {
    if (!schoolId) return;

    if (!newPrincipal.fullName.trim() || !newPrincipal.email.trim() || !newPrincipal.password.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "All fields are required.",
      });
      return;
    }

    if (newPrincipal.password.length < 8) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Password must be at least 8 characters.",
      });
      return;
    }

    setIsCreatingPrincipal(true);
    try {
      // Create auth user
      const { data: authData, error: authError } = await signUp(
        newPrincipal.email,
        newPrincipal.password,
        newPrincipal.fullName
      );

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // Update profile with school_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ school_id: schoolId })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // Assign principal role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          school_id: schoolId,
          role: 'principal',
          is_active: true,
        });

      if (roleError) {
        // Check if this is the single-principal constraint violation
        if (roleError.message?.includes('already has an active principal')) {
          toast({
            variant: "destructive",
            title: "Cannot Assign Principal",
            description: "This school already has an active principal. Please deactivate the current principal before assigning a new one.",
          });
          return;
        }
        throw roleError;
      }

      toast({
        title: "Success",
        description: "Principal assigned successfully.",
      });

      setNewPrincipal({ fullName: "", email: "", password: "" });
      setShowNewPrincipalForm(false);
      fetchPrincipal();
    } catch (error: any) {
      console.error('Error creating principal:', error);
      // Provide user-friendly error messages
      let errorMessage = error.message || "Failed to assign principal.";
      if (errorMessage.includes('already has an active principal')) {
        errorMessage = "This school already has an active principal. Deactivate the existing principal first.";
      } else if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
        errorMessage = "A user with this email already exists.";
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsCreatingPrincipal(false);
    }
  };

  const handleTogglePrincipalStatus = async () => {
    if (!principal) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: !principal.is_active })
        .eq('id', principal.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Principal ${principal.is_active ? "deactivated" : "activated"} successfully.`,
      });

      setPrincipal(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
    } catch (error: any) {
      console.error('Error toggling principal status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update principal status.",
      });
    }
  };

  if (loading || isLoadingSchool) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!isHost || !school) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/sys-admin-x7k9/dashboard")}
            className="text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* School Info */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">{school.name}</h1>
                <p className="text-slate-400 mt-1">Manage Principal Assignment</p>
              </div>
              <Badge
                variant={school.is_active ? "default" : "secondary"}
                className={school.is_active ? "bg-green-600" : "bg-slate-600"}
              >
                {school.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Current Principal */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              School Principal
            </CardTitle>
            <CardDescription className="text-slate-400">
              Each school can have only one active principal
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPrincipal ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : principal ? (
              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-600/20 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white">
                        {principal.profile?.full_name || "Unknown"}
                      </h3>
                      <Badge
                        variant={principal.is_active ? "default" : "secondary"}
                        className={principal.is_active ? "bg-green-600" : "bg-slate-600"}
                      >
                        {principal.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400">
                      {principal.profile?.email || "No email"}
                    </p>
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`border-slate-600 ${
                        principal.is_active
                          ? "text-red-400 hover:bg-red-500/10"
                          : "text-green-400 hover:bg-green-500/10"
                      }`}
                    >
                      <Power className="w-4 h-4 mr-1" />
                      {principal.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-slate-800 border-slate-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">
                        {principal.is_active ? "Deactivate" : "Activate"} Principal?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-400">
                        {principal.is_active
                          ? "This will remove principal access for this user. You can assign a new principal after deactivation."
                          : "This will restore principal access for this user."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-700">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleTogglePrincipalStatus}
                        className={principal.is_active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                      >
                        {principal.is_active ? "Deactivate" : "Activate"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : showNewPrincipalForm ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={newPrincipal.fullName}
                      onChange={(e) => setNewPrincipal(prev => ({ ...prev, fullName: e.target.value }))}
                      className="pl-10 bg-slate-700 border-slate-600 text-white"
                      placeholder="Enter principal's full name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="email"
                      value={newPrincipal.email}
                      onChange={(e) => setNewPrincipal(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10 bg-slate-700 border-slate-600 text-white"
                      placeholder="principal@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="password"
                      value={newPrincipal.password}
                      onChange={(e) => setNewPrincipal(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10 bg-slate-700 border-slate-600 text-white"
                      placeholder="Minimum 8 characters"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewPrincipalForm(false);
                      setNewPrincipal({ fullName: "", email: "", password: "" });
                    }}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreatePrincipal}
                    disabled={isCreatingPrincipal}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {isCreatingPrincipal ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Crown className="w-4 h-4 mr-2" />
                    )}
                    Assign Principal
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400 mb-4">No principal assigned to this school</p>
                <Button
                  onClick={() => setShowNewPrincipalForm(true)}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Assign Principal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ManagePrincipal;
