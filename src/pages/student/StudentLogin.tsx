import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GraduationCap, User, Lock, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { hasRole, signIn } from "@/lib/auth";
import { validateStudentId, validatePassword, parseAuthError } from "@/lib/validation";

const StudentLogin = () => {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [studentIdError, setStudentIdError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleStudentIdChange = (value: string) => {
    setStudentId(value);
    setStudentIdError("");
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate student ID
    const studentIdValidation = validateStudentId(studentId);
    if (!studentIdValidation.valid) {
      setStudentIdError(studentIdValidation.error || "Invalid Student ID");
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.error || "Invalid password");
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
        if (import.meta.env.DEV) {
          console.error('Student lookup error:', studentError);
        }
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Unable to verify student credentials. Please try again.",
        });
        setIsLoading(false);
        return;
      }

      if (!studentData || !studentData.user_id) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Student ID not found. Please check your ID and try again.",
        });
        setIsLoading(false);
        return;
      }

      // Step 2: Get the profile to find the email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', studentData.user_id)
        .maybeSingle();

      if (profileError || !profileData?.email) {
        if (import.meta.env.DEV) {
          console.error('Profile lookup error:', profileError);
        }
        toast({
          variant: "destructive",
          title: "Account Error",
          description: "Student account not properly configured. Please contact school administration.",
        });
        setIsLoading(false);
        return;
      }

      // Step 3: Authenticate with email and password (uses centralized auth for login logging)
      const { data: authData, error: authError } = await signIn(
        profileData.email,
        password
      );

      if (authError) {
        if (import.meta.env.DEV) {
          console.error('Auth error:', authError);
        }
        const errorMessage = parseAuthError(authError);
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: errorMessage,
        });
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Unable to authenticate. Please try again.",
        });
        setIsLoading(false);
        return;
      }

      // Step 4: Verify the user has the 'student' role
      const isStudent = await hasRole(authData.user.id, 'student');

      if (!isStudent) {
        await supabase.auth.signOut();
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "This account does not have Student access. Please use the correct login portal for your role.",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Welcome Back!",
        description: "Redirecting to your dashboard...",
      });

      navigate("/student/dashboard");
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Login error:', error);
      }

      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Unable to connect to the server. Please check your internet connection.",
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
                    onChange={(e) => handleStudentIdChange(e.target.value)}
                    className={`pl-10 h-12 ${studentIdError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
                {studentIdError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {studentIdError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/auth/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your Password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className={`pl-10 h-12 ${passwordError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
                {passwordError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {passwordError}
                  </p>
                )}
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

            <p className="text-center text-sm text-muted-foreground mt-6">
              Forgot your password? Contact your class teacher to reset it.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentLogin;
