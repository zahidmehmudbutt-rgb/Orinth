import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GraduationCap, Mail, Lock, ArrowLeft, BookMarked, Loader2, AlertCircle, Settings, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { signIn, signOut, hasRole } from "@/lib/auth";
import { validateEmail, validatePassword, parseAuthError } from "@/lib/validation";
import { FadeIn } from "@/components/ui/motion-wrapper";

const CoordinatorLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError("");
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.error || "Invalid email");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.error || "Invalid password");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await signIn(email.trim().toLowerCase(), password);

      if (error) {
        const errorMessage = parseAuthError(error);
        toast({
          variant: "destructive",
          title: t("login.loginFailed"),
          description: errorMessage,
        });
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        toast({
          variant: "destructive",
          title: t("login.loginFailed"),
          description: t("login.authFailed"),
        });
        setIsLoading(false);
        return;
      }

      const isCoordinator = await hasRole(data.user.id, 'coordinator');

      if (!isCoordinator) {
        await signOut();
        toast({
          variant: "destructive",
          title: t("login.accessDenied"),
          description: t("login.noCoordinatorAccess"),
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: t("common.welcomeBack"),
        description: t("common.redirecting"),
      });

      navigate("/coordinator/dashboard");
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Login error:', error);
      }

      toast({
        variant: "destructive",
        title: t("login.connectionError"),
        description: t("login.connectionErrorDesc"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel - Branding */}
      <div className="hidden md:flex md:w-1/2 bg-role-coordinator noise-overlay relative overflow-hidden items-center justify-center p-12">
        {/* Animated blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[400px] h-[400px] -top-24 -right-24 rounded-full bg-white/10 blur-[80px] animate-[blob-float_20s_ease-in-out_infinite]" />
          <div className="absolute w-[300px] h-[300px] -bottom-16 -left-16 rounded-full bg-white/10 blur-[80px] animate-[blob-float_25s_ease-in-out_infinite_-7s]" />
        </div>
        <div className="relative z-10 text-white max-w-md">
          <FadeIn delay={0.2}>
            <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              <BookMarked className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">{t("login.coordinatorPortal")}</h1>
            <p className="text-lg opacity-90 mb-8">
              {t("login.coordinatorDesc")}
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm opacity-90">
                <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span>{t("login.manageStaffAssignments")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm opacity-90">
                <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span>{t("login.viewSectionAnalytics")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm opacity-90">
                <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <span>{t("login.configureSectionSettings")}</span>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex flex-col bg-gradient-hero dark:bg-gradient-hero">
        <header className="w-full bg-card/80 dark:bg-card/70 backdrop-blur-md border-b border-border dark:border-white/[0.08] md:hidden">
          <div className="container mx-auto px-4 py-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">{t("login.schoolPortal")}</h1>
                <p className="text-xs text-muted-foreground">{t("login.educationHub")}</p>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <FadeIn className="w-full max-w-md">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {t("common.backToHome")}
            </Link>

            <div className="bg-card/80 dark:bg-card/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/[0.08] shadow-card-hover p-8">
              <div className="mb-8">
                <div className="w-14 h-14 bg-role-coordinator rounded-xl flex items-center justify-center mb-4 md:hidden shadow-lg">
                  <BookMarked className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">{t("login.coordinatorLogin")}</h2>
                <p className="text-muted-foreground mt-2">{t("login.coordinatorAccess")}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("common.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("login.enterEmail")}
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className={`pl-10 h-12 bg-background/50 dark:bg-background/30 ${emailError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                  {emailError && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {emailError}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t("common.password")}</Label>
                    <Link to="/auth/forgot-password" className="text-sm text-primary hover:underline">
                      {t("common.forgotPassword")}
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder={t("login.enterPassword")}
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      className={`pl-10 h-12 bg-background/50 dark:bg-background/30 ${passwordError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
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
                  className="w-full h-12 bg-role-coordinator text-white font-medium hover:opacity-90 hover:-translate-y-0.5 transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("common.signingIn")}
                    </>
                  ) : (
                    t("common.signIn")
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                {t("login.credentialsByPrincipal")}
              </p>
            </div>
          </FadeIn>
        </main>
      </div>
    </div>
  );
};

export default CoordinatorLogin;
