import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GraduationCap, Mail, ArrowLeft, Users, Loader2, AlertCircle, Eye, Bell, TrendingUp } from "lucide-react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { DemoCredentialField } from "@/components/DemoCredentialField";
import { DEMO_CREDENTIALS } from "@/lib/demo-credentials";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { signIn, signOut, hasRole } from "@/lib/auth";
import { validateEmail, validatePassword, parseAuthError } from "@/lib/validation";
import { FadeIn } from "@/components/ui/motion-wrapper";
import { useLoginRateLimit } from "@/hooks/useLoginRateLimit";

const ParentLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isLocked, remainingSeconds, recordFailure, recordSuccess, checkLocked } = useLoginRateLimit();

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError("");
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError("");
  };

  const demo = DEMO_CREDENTIALS.parent;
  const fillDemoCredentials = () => {
    setEmail(demo.identifier);
    setPassword(demo.password);
    setEmailError("");
    setPasswordError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (checkLocked()) {
      toast({
        variant: "destructive",
        title: t("login.tooManyAttempts"),
        description: `Try again in ${remainingSeconds}s`,
      });
      return;
    }

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
        recordFailure();
        toast({
          variant: "destructive",
          title: t("login.loginFailed"),
          description: errorMessage,
        });
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        recordFailure();
        toast({
          variant: "destructive",
          title: t("login.loginFailed"),
          description: t("login.authFailed"),
        });
        setIsLoading(false);
        return;
      }

      const isParent = await hasRole(data.user.id, 'parent');

      if (!isParent) {
        await signOut();
        recordFailure();
        toast({
          variant: "destructive",
          title: t("login.accessDenied"),
          description: t("login.noParentAccess"),
        });
        setIsLoading(false);
        return;
      }

      recordSuccess();
      toast({
        title: t("common.welcomeBack"),
        description: t("common.redirecting"),
      });

      navigate("/parent/dashboard");
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Login error:', error);
      }

      recordFailure();
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
      <Helmet><title>Parent Login — School Management System</title></Helmet>
      {/* Left panel - Branding */}
      <div className="hidden md:flex md:w-1/2 bg-role-parent relative overflow-hidden items-center justify-center p-12">
        <div className="relative z-10 text-white max-w-md">
          <FadeIn delay={0.2}>
            <div className="w-16 h-16 bg-white/15 rounded-xl flex items-center justify-center mb-8">
              <Users className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">{t("login.parentPortal")}</h1>
            <p className="text-lg opacity-90 mb-8">
              {t("login.parentDesc")}
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm opacity-90">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <span>{t("login.monitorAttendance")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm opacity-90">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span>{t("login.trackAcademicPerformance")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm opacity-90">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <span>{t("login.receiveNotifications")}</span>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex flex-col bg-background">
        <header className="w-full bg-card border-b border-border md:hidden">
          <div className="container mx-auto px-4 py-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
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
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("common.backToHome")}
            </Link>

            <div className="bg-card rounded-xl border border-border p-8">
              <div className="mb-8">
                <div className="w-14 h-14 bg-role-parent rounded-xl flex items-center justify-center mb-4 shadow-lg md:hidden">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">{t("login.parentLogin")}</h2>
                <p className="text-muted-foreground mt-2">
                  {t("login.monitorProgress")}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("common.email")}</Label>
                  <DemoCredentialField credential={demo} onFill={fillDemoCredentials}>
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
                  </DemoCredentialField>
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
                    <Link
                      to="/auth/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      {t("common.forgotPassword")}
                    </Link>
                  </div>
                  <DemoCredentialField credential={demo} onFill={fillDemoCredentials}>

                    <PasswordInput
                    id="password"
                    placeholder={t("login.enterPassword")}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    error={passwordError}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />

                  </DemoCredentialField>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-role-parent text-white font-medium hover:opacity-90 shadow-button hover:-translate-y-0.5 transition-all"
                  disabled={isLocked || isLoading}
                >
                  {isLocked ? (
                    `Try again in ${remainingSeconds}s`
                  ) : isLoading ? (
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
                {t("login.credentialsByAdmin")}
              </p>
            </div>
          </FadeIn>
        </main>
      </div>
    </div>
  );
};

export default ParentLogin;
