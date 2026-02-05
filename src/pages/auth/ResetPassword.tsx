import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Lock, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user came from a valid reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      }
      setIsCheckingSession(false);
    };

    checkSession();

    // Listen for auth state changes (triggered by email link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all fields.",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Password must be at least 8 characters long.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Passwords do not match.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        // Log detailed error in development only
        if (import.meta.env.DEV) {
          console.error('Password update error:', error);
        }
        // Show generic message without exposing internal error details
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not update your password. The reset link may have expired — request a new one.",
        });
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });

      // Sign out and redirect to home after 2 seconds
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/");
      }, 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not connect to the server. Check your internet connection.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-card border border-border p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full mb-6">
              <Lock className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Invalid or Expired Link</h1>
            <p className="text-muted-foreground mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Button
              onClick={() => navigate("/auth/forgot-password")}
              className="w-full bg-gradient-primary text-primary-foreground"
            >
              Request New Link
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-card border border-border p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-6">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Password Updated!</h1>
            <p className="text-muted-foreground mb-6">
              Your password has been successfully updated. You will be redirected to the login page.
            </p>
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-hero">
      {/* Header */}
      <header className="w-full bg-gradient-primary text-primary-foreground py-4 px-6">
        <div className="container mx-auto flex items-center gap-3">
          <GraduationCap className="w-8 h-8" />
          <span className="text-xl font-bold">School Portal</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-card border border-border p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-xl mb-4">
                <Lock className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Reset Password</h1>
              <p className="text-muted-foreground text-sm">
                Enter your new password below.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-primary text-primary-foreground shadow-button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
