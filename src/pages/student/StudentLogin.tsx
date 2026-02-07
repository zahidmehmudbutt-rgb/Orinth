import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GraduationCap, User, Lock, ArrowLeft, Loader2, AlertCircle, BookOpen, Award, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { hasRole, signIn } from "@/lib/auth";
import { validateStudentId, validatePassword, parseAuthError } from "@/lib/validation";
import { FadeIn } from "@/components/ui/motion-wrapper";

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

    const studentIdValidation = validateStudentId(studentId);
    if (!studentIdValidation.valid) {
      setStudentIdError(studentIdValidation.error || "Invalid Student ID");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.error || "Invalid password");
      return;
    }

    setIsLoading(true);

    try {
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
          description: "Could not verify your Student ID. Check your connection and try again.",
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
          description: "Authentication failed. Check your connection and try again.",
        });
        setIsLoading(false);
        return;
      }

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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-role-student relative overflow-hidden items-center justify-center p-12">
        <div className="floating-shapes">
          <div className="floating-shape" />
          <div className="floating-shape" />
          <div className="floating-shape" />
        </div>
        <div className="relative z-10 text-white max-w-md">
          <FadeIn delay={0.2}>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Student Portal</h1>
            <p className="text-lg opacity-90 mb-8">
              Access your homework, attendance, marks, and school notices all in one place.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm opacity-80">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span>View homework & assignments</span>
              </div>
              <div className="flex items-center gap-3 text-sm opacity-80">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <span>Check your marks & results</span>
              </div>
              <div className="flex items-center gap-3 text-sm opacity-80">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span>Stay connected with teachers</span>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex flex-col bg-background">
        <header className="w-full bg-card/80 backdrop-blur-md border-b border-border lg:hidden">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">School Portal</h1>
                <p className="text-xs text-muted-foreground">Education Hub</p>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <FadeIn className="w-full max-w-md">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>

            <div>
              <div className="mb-8">
                <div className="w-14 h-14 bg-role-student rounded-xl flex items-center justify-center mb-4 lg:hidden">
                  <User className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Student Login</h2>
                <p className="text-muted-foreground mt-2">
                  Enter your Student ID and Password
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
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
                  className="w-full h-12 bg-role-student hover:opacity-90 text-white font-medium shadow-button"
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
          </FadeIn>
        </main>
      </div>
    </div>
  );
};

export default StudentLogin;
