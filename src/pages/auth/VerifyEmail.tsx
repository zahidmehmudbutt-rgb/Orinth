import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Mail, Loader2, CheckCircle, XCircle } from "lucide-react";

const VerifyEmail = () => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verifyEmail = async () => {
      // Check for error in URL params
      const errorDescription = searchParams.get("error_description");
      if (errorDescription) {
        setError(errorDescription);
        setIsVerifying(false);
        return;
      }

      // Check if user is authenticated (verification successful)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Update profile to mark email as verified
        await supabase
          .from("profiles")
          .update({ email_verified: true })
          .eq("id", session.user.id);

        setIsSuccess(true);
        toast({
          title: "Email Verified",
          description: "Your email has been successfully verified.",
        });
      } else {
        setError("Unable to verify email. Please try again.");
      }

      setIsVerifying(false);
    };

    // Wait for auth state to be ready
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        verifyEmail();
      }
    });

    // Also check immediately
    verifyEmail();

    return () => subscription.unsubscribe();
  }, [searchParams, toast]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying your email...</p>
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
          <div className="bg-card rounded-2xl shadow-card border border-border p-8 text-center">
            {isSuccess ? (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-6">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-3">Email Verified!</h1>
                <p className="text-muted-foreground mb-6">
                  Your email has been successfully verified. You can now access all features of your account.
                </p>
                <Button
                  onClick={() => navigate("/")}
                  className="w-full bg-gradient-primary text-primary-foreground"
                >
                  Go to Home
                </Button>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full mb-6">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-3">Verification Failed</h1>
                <p className="text-muted-foreground mb-6">
                  {error || "We couldn't verify your email. The link may have expired."}
                </p>
                <Button
                  onClick={() => navigate("/")}
                  className="w-full bg-gradient-primary text-primary-foreground"
                >
                  Go to Home
                </Button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default VerifyEmail;
