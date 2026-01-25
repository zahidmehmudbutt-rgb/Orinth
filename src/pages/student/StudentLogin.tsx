import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GraduationCap, User, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { hasRole } from "@/lib/auth";

const StudentLogin = () => {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId.trim() || !password.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter both Student ID and Password",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Look up the student by student_id to get their user_id
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('user_id')
        .eq('student_id', studentId.trim())
        .maybeSingle();

      if (studentError) {
        console.error('Student lookup error:', studentError);
        throw new Error("Unable to verify student credentials");
      }

      if (!studentData || !studentData.user_id) {
        throw new Error("Invalid Student ID");
      }

      // Step 2: Get the profile to find the email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', studentData.user_id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile lookup error:', profileError);
        throw new Error("Unable to verify student credentials");
      }

      if (!profileData?.email) {
        throw new Error("Student account not properly configured");
      }

      // Step 3: Authenticate with email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password: password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw new Error("Invalid credentials");
      }

      if (!authData.user) {
        throw new Error("Authentication failed");
      }

      // Step 4: Verify the user has the 'student' role
      const isStudent = await hasRole(authData.user.id, 'student');

      if (!isStudent) {
        // Sign out if not a student
        await supabase.auth.signOut();
        throw new Error("Access denied");
      }

      toast({
        title: "Login Successful",
        description: "Welcome to your dashboard!",
      });

      navigate("/student/dashboard");
    } catch (error: any) {
      // Log detailed error in development only
      if (import.meta.env.DEV) {
        console.error('Login error:', error);
      }

      // Show generic error message to prevent information disclosure
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid Student ID or Password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header */}
      <header className="w-full bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">School Portal</h1>
              <p className="text-xs text-muted-foreground">Education Hub</p>
            </div>
          </Link>
        </div>
      </header>

      {/* Login Form */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="bg-card rounded-2xl shadow-card-hover p-8 border border-border">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-role-student rounded-xl flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Student Login</h2>
              <p className="text-muted-foreground mt-2">
                Enter your Student ID and Password
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="studentId"
                    type="text"
                    placeholder="Enter your Student ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="pl-10 h-12"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-primary text-primary-foreground font-medium shadow-button hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 space-y-2">
              <p className="text-center text-sm text-muted-foreground">
                First time? Your password is the same as your Student ID
              </p>
              <p className="text-center">
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot Password?
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentLogin;
