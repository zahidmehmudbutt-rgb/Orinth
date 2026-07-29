import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { getDateLocale } from "@/lib/utils/date-locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Shield, Smartphone, Key, Copy, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TwoFactorSettings {
  is_enabled: boolean;
  backup_codes: string[] | null;
  last_used_at: string | null;
}

export default function TwoFactorAuth() {
  const [settings, setSettings] = useState<TwoFactorSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupOpen, setSetupOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [setupStep, setSetupStep] = useState<"intro" | "verify" | "backup">("intro");
  const [generatedSecret, setGeneratedSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("two_factor_auth")
        .select("is_enabled, backup_codes, last_used_at")
        .eq("user_id", user.id)
        .single();

      // PGRST116 = no rows, 406/42P01 = table doesn't exist — all treated as "not set up"
      if (error) {
        setSettings({ is_enabled: false, backup_codes: null, last_used_at: null });
        return;
      }
      setSettings(data || { is_enabled: false, backup_codes: null, last_used_at: null });
    } catch {
      setSettings({ is_enabled: false, backup_codes: null, last_used_at: null });
    } finally {
      setLoading(false);
    }
  };

  const generateSecret = () => {
    const secret = new OTPAuth.Secret({ size: 20 });
    return secret.base32;
  };

  const generateBackupCodes = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const values = crypto.getRandomValues(new Uint8Array(8));
      const part1 = Array.from(values.slice(0, 4), (v) => chars[v % chars.length]).join("");
      const part2 = Array.from(values.slice(4, 8), (v) => chars[v % chars.length]).join("");
      codes.push(`${part1}-${part2}`);
    }
    return codes;
  };

  const startSetup = (showExistingCodes = false) => {
    if (showExistingCodes && settings?.backup_codes) {
      // Show existing backup codes without generating new secret
      setBackupCodes(settings.backup_codes);
      setSetupStep("backup");
      setSetupOpen(true);
      return;
    }

    const secret = generateSecret();
    setGeneratedSecret(secret);
    setSetupStep("intro");
    setSetupOpen(true);
    setVerificationCode("");

    const totp = new OTPAuth.TOTP({
      issuer: "School Management System",
      label: "School Management System",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
    const uri = totp.toString();
    QRCode.toDataURL(uri).then(url => setQrCodeUrl(url));
  };

  const verifyAndEnable = async () => {
    if (verificationCode.length !== 6) {
      toast({
        variant: "destructive",
        title: t("twoFactor.invalidCode"),
        description: t("twoFactor.invalidCodeDesc"),
      });
      return;
    }

    setProcessing(true);

    try {
      const totp = new OTPAuth.TOTP({
        issuer: "School Management System",
        label: "School Management System",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(generatedSecret),
      });
      const delta = totp.validate({ token: verificationCode, window: 1 });
      if (delta === null) {
        toast({
          variant: "destructive",
          title: t("twoFactor.invalidCode"),
          description: t("twoFactor.invalidCodeDesc"),
        });
        setProcessing(false);
        return;
      }

      const codes = generateBackupCodes();
      setBackupCodes(codes);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save 2FA settings
      const { error } = await supabase
        .from("two_factor_auth")
        .upsert({
          user_id: user.id,
          is_enabled: true,
          secret_key: generatedSecret,
          backup_codes: codes,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setSettings({ is_enabled: true, backup_codes: codes, last_used_at: null });
      setSetupStep("backup");

      toast({
        title: t("twoFactor.enabledSuccess"),
        description: t("twoFactor.enabledSuccessDesc"),
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error enabling 2FA:", error);
      toast({
        variant: "destructive",
        title: t("twoFactor.error"),
        description: t("twoFactor.enableError"),
      });
    } finally {
      setProcessing(false);
    }
  };

  const disable2FA = async () => {
    setProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("two_factor_auth")
        .update({
          is_enabled: false,
          secret_key: null,
          backup_codes: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setSettings({ is_enabled: false, backup_codes: null, last_used_at: null });
      setDisableOpen(false);

      toast({
        title: t("twoFactor.disabledSuccess"),
        description: t("twoFactor.disabledSuccessDesc"),
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error disabling 2FA:", error);
      toast({
        variant: "destructive",
        title: t("twoFactor.error"),
        description: t("twoFactor.disableError"),
      });
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Fallback for older browsers or restricted contexts
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t("twoFactor.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-10 bg-muted rounded w-1/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t("twoFactor.title")}
              </CardTitle>
              <CardDescription>
                {t("twoFactor.subtitle")}
              </CardDescription>
            </div>
            {settings?.is_enabled && (
              <Badge className="bg-success/10 text-success">
                <CheckCircle className="h-3 w-3 mr-1" />
                {t("twoFactor.enabled")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings?.is_enabled ? (
            <>
              <div className="flex items-start gap-3 p-4 bg-success/5 border border-success/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="font-medium text-success">{t("twoFactor.isEnabled")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("twoFactor.isEnabledDesc")}
                    {settings.last_used_at && (
                      <> {t("twoFactor.lastUsed", { date: new Date(settings.last_used_at).toLocaleDateString(getDateLocale()) })}</>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { startSetup(true); }}>
                  <Key className="h-4 w-4 mr-2" />
                  {t("twoFactor.viewBackupCodes")}
                </Button>
                <Button variant="destructive" onClick={() => setDisableOpen(true)}>
                  {t("twoFactor.disable")}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3 p-4 bg-warning/5 border border-warning/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <p className="font-medium">{t("twoFactor.notEnabled")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("twoFactor.notEnabledDesc")}
                  </p>
                </div>
              </div>

              <Button onClick={() => startSetup()}>
                <Shield className="h-4 w-4 mr-2" />
                {t("twoFactor.enable")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {setupStep === "backup" ? t("twoFactor.saveBackupCodes") : t("twoFactor.setUp")}
            </DialogTitle>
            <DialogDescription>
              {setupStep === "intro" && t("twoFactor.introDesc")}
              {setupStep === "verify" && t("twoFactor.verifyDesc")}
              {setupStep === "backup" && t("twoFactor.backupDesc")}
            </DialogDescription>
          </DialogHeader>

          {setupStep === "intro" && (
            <div className="space-y-4">
              {qrCodeUrl && (
                <div className="flex justify-center mb-4">
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 rounded-lg" loading="lazy" />
                </div>
              )}
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">{t("twoFactor.secretKey")}</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-lg font-mono tracking-wider">{generatedSecret}</code>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyToClipboard(generatedSecret)}
                  >
                    {copiedCode === generatedSecret ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <p className="font-medium">{t("twoFactor.instructions")}</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>{t("twoFactor.instruction1")}</li>
                  <li>{t("twoFactor.instruction2")}</li>
                  <li>{t("twoFactor.instruction3")}</li>
                  <li>{t("twoFactor.instruction4")}</li>
                </ol>
              </div>
            </div>
          )}

          {setupStep === "verify" && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={verificationCode}
                  onChange={setVerificationCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {t("twoFactor.enterCode")}
              </p>
            </div>
          )}

          {setupStep === "backup" && (
            <div className="space-y-4">
              <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
                <p className="text-sm text-warning flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {t("twoFactor.backupWarning")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded font-mono text-sm"
                  >
                    <span>{code}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(code)}
                    >
                      {copiedCode === code ? (
                        <CheckCircle className="h-3 w-3 text-success" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => copyToClipboard(backupCodes.join("\n"))}
              >
                <Copy className="h-4 w-4 mr-2" />
                {t("twoFactor.copyAll")}
              </Button>
            </div>
          )}

          <DialogFooter>
            {setupStep === "intro" && (
              <>
                <Button variant="outline" onClick={() => setSetupOpen(false)}>
                  {t("twoFactor.cancel")}
                </Button>
                <Button onClick={() => setSetupStep("verify")}>
                  {t("twoFactor.next")}
                </Button>
              </>
            )}
            {setupStep === "verify" && (
              <>
                <Button variant="outline" onClick={() => setSetupStep("intro")}>
                  {t("twoFactor.back")}
                </Button>
                <Button onClick={verifyAndEnable} disabled={processing}>
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("twoFactor.verifying")}
                    </>
                  ) : (
                    t("twoFactor.verifyEnable")
                  )}
                </Button>
              </>
            )}
            {setupStep === "backup" && (
              <Button onClick={() => setSetupOpen(false)} className="w-full">
                {t("twoFactor.savedCodes")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Confirmation Dialog */}
      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("twoFactor.disableTitle")}</DialogTitle>
            <DialogDescription>
              {t("twoFactor.disableDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableOpen(false)}>
              {t("twoFactor.cancel")}
            </Button>
            <Button variant="destructive" onClick={disable2FA} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("twoFactor.disabling")}
                </>
              ) : (
                t("twoFactor.disable")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
