import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Lock, Loader2, CheckCircle, Eye, EyeOff, ArrowLeft, KeyRound, Shield } from "lucide-react";
import { FadeIn } from "@/components/ui/motion-wrapper";

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
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      }
      setIsCheckingSession(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please fill in all fields." });
      return;
    }

    if (password.length < 8) {
      toast({ variant: "destructive", title: "Validation Error", description: "Password must be at least 8 characters long." });
      return;
    }

    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Validation Error", description: "Passwords do not match." });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        if (import.meta.env.DEV) console.error('Password update error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not update your password. The reset link may have expired — request a new one.",
        });
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      toast({ title: "Password Updated", description: "Your password has been successfully updated." });

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
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Verifying your link...</p>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero relative overflow-hidden px-4">
        <div className="floating-shapes"><div className="floating-shape" /><div className="floating-shape" /><div className="floating-shape" /></div>
        <FadeIn className="w-full max-w-md relative z-10">
          <div className="bg-card rounded-2xl shadow-card-hover border border-border p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full mb-6">
              <Lock className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Invalid or Expired Link</h1>
            <p className="text-muted-foreground mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Button onClick={() => navigate("/auth/forgot-password")} className="w-full bg-gradient-primary text-white shadow-button">
              Request New Link
            </Button>
          </div>
        </FadeIn>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero relative overflow-hidden px-4">
        <div className="floating-shapes"><div className="floating-shape" /><div className="floating-shape" /><div className="floating-shape" /></div>
        <FadeIn className="w-full max-w-md relative z-10">
          <div className="bg-card rounded-2xl shadow-card-hover border border-border p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-6">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Password Updated!</h1>
            <p className="text-muted-foreground mb-6">
              Your password has been successfully updated. Redirecting you now...
            </p>
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
          </div>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-primary relative overflow-hidden items-center justify-center p-12">
        <div className="floating-shapes"><div className="floating-shape" /><div className="floating-shape" /><div className="floating-shape" /></div>
        <div className="relative z-10 text-white max-w-md">
          <FadeIn delay={0.2}>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm">
              <KeyRound className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Create New Password</h1>
            <p className="text-lg opacity-90 mb-8">
              Choose a strong password to keep your account secure.
            </p>
            <div className="flex items-center gap-3 text-sm opacity-80">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <span>Use at least 8 characters for security</span>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex flex-col bg-background">
        <header className="w-full bg-card/80 backdrop-blur-md border-b border-border lg:hidden">
          <div className="container mx-auto px-4 py-4">
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
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>

            <div>
              <div className="mb-8">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 lg:hidden">
                  <Lock className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Reset Password</h2>
                <p className="text-muted-foreground mt-2 text-sm">Enter your new password below.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12"
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
                      className="pl-10 h-12"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-primary text-white shadow-button hover:opacity-90"
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
          </FadeIn>
        </main>
      </div>
    </div>
  );
};

export default ResetPassword;
