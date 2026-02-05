import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Mail, ArrowLeft, Loader2, CheckCircle, KeyRound, Shield } from "lucide-react";
import { FadeIn } from "@/components/ui/motion-wrapper";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter your email address.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        if (import.meta.env.DEV) {
          console.error('Password reset error:', error);
        }
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not send the reset link. Verify your email address and try again.",
        });
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      toast({
        title: "Reset Link Sent",
        description: "Please check your email for the password reset link.",
      });
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

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero relative overflow-hidden px-4">
        <div className="floating-shapes">
          <div className="floating-shape" />
          <div className="floating-shape" />
          <div className="floating-shape" />
        </div>
        <FadeIn className="w-full max-w-md relative z-10">
          <div className="bg-card rounded-2xl shadow-card-hover border border-border p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-6">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Check Your Email</h1>
            <p className="text-muted-foreground mb-6">
              We've sent a password reset link to <strong className="text-foreground">{email}</strong>.
              Please check your inbox and follow the instructions.
            </p>
            <Link to="/">
              <Button className="w-full bg-gradient-primary text-white shadow-button">
                Back to Home
              </Button>
            </Link>
          </div>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-primary relative overflow-hidden items-center justify-center p-12">
        <div className="floating-shapes">
          <div className="floating-shape" />
          <div className="floating-shape" />
          <div className="floating-shape" />
        </div>
        <div className="relative z-10 text-white max-w-md">
          <FadeIn delay={0.2}>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm">
              <KeyRound className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Reset Your Password</h1>
            <p className="text-lg opacity-90 mb-8">
              Don't worry, it happens to everyone. We'll send you a secure link to reset your password.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm opacity-80">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <span>Receive a secure reset link via email</span>
              </div>
              <div className="flex items-center gap-3 text-sm opacity-80">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <span>Your account stays protected</span>
              </div>
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
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Forgot Password</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12"
                      placeholder="Enter your email"
                      autoComplete="email"
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
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
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

export default ForgotPassword;
