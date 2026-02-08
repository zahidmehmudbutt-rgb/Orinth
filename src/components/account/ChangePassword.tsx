import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { validateNewPassword } from "@/lib/validation";

export default function ChangePassword() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ current?: string; new?: string; confirm?: string }>({});
  const { toast } = useToast();

  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: "", color: "" };

    let score = 0;
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 20;
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^a-zA-Z0-9]/.test(password)) score += 15;

    if (score >= 80) return { score, label: t("changePassword.strong"), color: "bg-success" };
    if (score >= 50) return { score, label: t("changePassword.medium"), color: "bg-warning" };
    return { score, label: t("changePassword.weak"), color: "bg-destructive" };
  };

  const strength = getPasswordStrength(newPassword);

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!currentPassword) {
      newErrors.current = t("changePassword.currentRequired");
    }

    const passwordValidation = validateNewPassword(newPassword);
    if (!passwordValidation.valid) {
      newErrors.new = passwordValidation.error;
    }

    if (!confirmPassword) {
      newErrors.confirm = t("changePassword.confirmRequired");
    } else if (newPassword !== confirmPassword) {
      newErrors.confirm = t("changePassword.noMatch");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      // First verify current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("User not found");

      // Get the user's email to verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        setErrors({ current: t("changePassword.incorrectCurrent") });
        setLoading(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      toast({
        title: t("changePassword.success"),
        description: t("changePassword.successDesc"),
      });

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error changing password:", error);
      toast({
        variant: "destructive",
        title: t("changePassword.error"),
        description: t("changePassword.errorDesc"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          {t("changePassword.title")}
        </CardTitle>
        <CardDescription>
          {t("changePassword.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current-password">{t("changePassword.currentLabel")}</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setErrors({ ...errors, current: undefined });
                }}
                className={errors.current ? "border-destructive" : ""}
                placeholder={t("changePassword.currentPlaceholder")}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.current && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.current}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-password">{t("changePassword.newLabel")}</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrors({ ...errors, new: undefined });
                }}
                className={errors.new ? "border-destructive" : ""}
                placeholder={t("changePassword.newPlaceholder")}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPassword && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Progress value={strength.score} className="h-2 flex-1" />
                  <span className={`text-xs font-medium ${
                    strength.label === "Strong" ? "text-success" :
                    strength.label === "Medium" ? "text-warning" : "text-destructive"
                  }`}>
                    {strength.label}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="flex items-center gap-1">
                    {newPassword.length >= 8 ? (
                      <CheckCircle className="h-3 w-3 text-success" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-muted-foreground" />
                    )}
                    {t("changePassword.requirement8Chars")}
                  </p>
                  <p className="flex items-center gap-1">
                    {/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? (
                      <CheckCircle className="h-3 w-3 text-success" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-muted-foreground" />
                    )}
                    {t("changePassword.requirementCase")}
                  </p>
                  <p className="flex items-center gap-1">
                    {/[0-9]/.test(newPassword) ? (
                      <CheckCircle className="h-3 w-3 text-success" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-muted-foreground" />
                    )}
                    {t("changePassword.requirementNumber")}
                  </p>
                  <p className="flex items-center gap-1">
                    {/[^a-zA-Z0-9]/.test(newPassword) ? (
                      <CheckCircle className="h-3 w-3 text-success" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-muted-foreground" />
                    )}
                    {t("changePassword.requirementSpecial")}
                  </p>
                </div>
              </div>
            )}
            {errors.new && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.new}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t("changePassword.confirmLabel")}</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors({ ...errors, confirm: undefined });
              }}
              className={errors.confirm ? "border-destructive" : ""}
              placeholder={t("changePassword.confirmPlaceholder")}
            />
            {errors.confirm && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.confirm}
              </p>
            )}
            {confirmPassword && newPassword === confirmPassword && (
              <p className="text-sm text-success flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {t("changePassword.passwordsMatch")}
              </p>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("changePassword.changing")}
              </>
            ) : (
              t("changePassword.button")
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
