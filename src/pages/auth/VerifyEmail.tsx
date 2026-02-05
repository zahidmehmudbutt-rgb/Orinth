import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { FadeIn } from "@/components/ui/motion-wrapper";

const VerifyEmail = () => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verifyEmail = async () => {
      const errorDescription = searchParams.get("error_description");
      if (errorDescription) {
        setError(errorDescription);
        setIsVerifying(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
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
        setError("Could not verify your email. The link may have expired — request a new one.");
      }

      setIsVerifying(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        verifyEmail();
      }
    });

    verifyEmail();

    return () => subscription.unsubscribe();
  }, [searchParams, toast]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero relative overflow-hidden">
        <div className="floating-shapes"><div className="floating-shape" /><div className="floating-shape" /><div className="floating-shape" /></div>
        <div className="text-center relative z-10">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying your email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero relative overflow-hidden px-4">
      <div className="floating-shapes"><div className="floating-shape" /><div className="floating-shape" /><div className="floating-shape" /></div>
      <FadeIn className="w-full max-w-md relative z-10">
        <div className="bg-card rounded-2xl shadow-card-hover border border-border p-8 text-center">
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
                className="w-full bg-gradient-primary text-white shadow-button"
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
                className="w-full bg-gradient-primary text-white shadow-button"
              >
                Go to Home
              </Button>
            </>
          )}
        </div>
      </FadeIn>
    </div>
  );
};

export default VerifyEmail;
