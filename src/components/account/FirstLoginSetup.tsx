import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, User, Phone, MapPin, MessageCircle, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

interface FirstLoginSetupProps {
  onComplete: () => void;
}

const FirstLoginSetup = ({ onComplete }: FirstLoginSetupProps) => {
  const { user, profile, refreshUserData } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [step, setStep] = useState(1);
  
  // Step 1: Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Step 2: Profile
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: t("firstLoginSetup.validationError"),
        description: t("firstLoginSetup.fillPassword"),
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: t("firstLoginSetup.validationError"),
        description: t("firstLoginSetup.passwordMin"),
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: t("firstLoginSetup.validationError"),
        description: t("firstLoginSetup.passwordsMismatch"),
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: t("firstLoginSetup.passwordSet"),
        description: t("firstLoginSetup.passwordSetDesc"),
      });

      setStep(2);
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("firstLoginSetup.error"),
        description: error instanceof Error ? error.message : "Failed to set password.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async () => {
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          phone: phone.trim() || null,
          whatsapp: whatsapp.trim() || null,
          address: address.trim() || null,
          first_login_complete: true,
        })
        .eq("id", user?.id);

      if (error) throw error;

      toast({
        title: t("firstLoginSetup.profileComplete"),
        description: t("firstLoginSetup.profileCompleteDesc"),
      });

      refreshUserData();
      onComplete();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: t("firstLoginSetup.error"),
        description: t("firstLoginSetup.errorSave"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-card border border-border p-8">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-16 h-1 rounded ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
          <p className="text-center text-xs text-muted-foreground mb-6">
            {t("firstLoginSetup.step", { step, label: step === 1 ? t("firstLoginSetup.setPassword") : t("firstLoginSetup.completeProfileLabel") })}
          </p>

          {step === 1 ? (
            <>
              {/* Step 1: Change Password */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-xl mb-4">
                  <Lock className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">{t("firstLoginSetup.welcome")}</h1>
                <p className="text-muted-foreground text-sm">
                  {t("firstLoginSetup.welcomeDesc")}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("firstLoginSetup.newPassword")}</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t("firstLoginSetup.newPasswordPlaceholder")}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="space-y-1 mt-1">
                    <p className={`text-xs flex items-center gap-1 ${newPassword.length >= 8 ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {newPassword.length >= 8 ? '✓' : '○'} {t("firstLoginSetup.requirement8")}
                    </p>
                    <p className={`text-xs flex items-center gap-1 ${newPassword && newPassword === confirmPassword ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {newPassword && newPassword === confirmPassword ? '✓' : '○'} {t("firstLoginSetup.requirementMatch")}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("firstLoginSetup.confirmPassword")}</Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("firstLoginSetup.confirmPasswordPlaceholder")}
                  />
                </div>

                <Button
                  onClick={handlePasswordSubmit}
                  disabled={isLoading}
                  className="w-full bg-gradient-primary text-primary-foreground shadow-button"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span className="sr-only">Loading...</span>
                    </>
                  ) : (
                    <>
                      {t("firstLoginSetup.continue")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Step 2: Complete Profile */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-xl mb-4">
                  <User className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">{t("firstLoginSetup.completeProfile")}</h1>
                <p className="text-muted-foreground text-sm">
                  {t("firstLoginSetup.completeProfileDesc")}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {t("firstLoginSetup.phoneLabel")}
                  </Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    {t("firstLoginSetup.whatsappLabel")}
                  </Label>
                  <Input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+92 300 1234567"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    {t("firstLoginSetup.addressLabel")}
                  </Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t("firstLoginSetup.addressPlaceholder")}
                  />
                </div>

                <Button
                  onClick={handleProfileSubmit}
                  disabled={isLoading}
                  className="w-full bg-gradient-primary text-primary-foreground shadow-button"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span className="sr-only">Loading...</span>
                    </>
                  ) : (
                    t("firstLoginSetup.completeButton")
                  )}
                </Button>

                <button
                  onClick={handleProfileSubmit}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("firstLoginSetup.skip")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FirstLoginSetup;
