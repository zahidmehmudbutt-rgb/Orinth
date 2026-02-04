import { useState, useEffect } from "react";
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
  const { toast } = useToast();

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

      if (error && error.code !== "PGRST116") throw error;
      setSettings(data || { is_enabled: false, backup_codes: null, last_used_at: null });
    } catch (error) {
      console.error("Error fetching 2FA settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSecret = () => {
    // Generate a random base32 secret (in production, this should be done server-side)
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let secret = "";
    for (let i = 0; i < 16; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)];
    }
    return secret;
  };

  const generateBackupCodes = () => {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 6).toUpperCase() +
                   "-" +
                   Math.random().toString(36).substring(2, 6).toUpperCase();
      codes.push(code);
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
  };

  const verifyAndEnable = async () => {
    if (verificationCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code.",
      });
      return;
    }

    setProcessing(true);

    try {
      // In a real implementation, verify the TOTP code against the secret
      // For demo purposes, accept any 6-digit code
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
        title: "2FA Enabled",
        description: "Two-factor authentication has been enabled on your account.",
      });
    } catch (error) {
      console.error("Error enabling 2FA:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to enable 2FA. Please try again.",
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
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled on your account.",
      });
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to disable 2FA. Please try again.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
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
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </div>
            {settings?.is_enabled && (
              <Badge className="bg-success/10 text-success">
                <CheckCircle className="h-3 w-3 mr-1" />
                Enabled
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
                  <p className="font-medium text-success">2FA is enabled</p>
                  <p className="text-sm text-muted-foreground">
                    Your account is protected with two-factor authentication.
                    {settings.last_used_at && (
                      <> Last used: {new Date(settings.last_used_at).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => startSetup(true)}>
                  <Key className="h-4 w-4 mr-2" />
                  View Backup Codes
                </Button>
                <Button variant="destructive" onClick={() => setDisableOpen(true)}>
                  Disable 2FA
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3 p-4 bg-warning/5 border border-warning/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <p className="font-medium">2FA is not enabled</p>
                  <p className="text-sm text-muted-foreground">
                    Enable two-factor authentication to add an extra layer of security to your account.
                  </p>
                </div>
              </div>

              <Button onClick={startSetup}>
                <Shield className="h-4 w-4 mr-2" />
                Enable 2FA
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
              {setupStep === "backup" ? "Save Backup Codes" : "Set Up 2FA"}
            </DialogTitle>
            <DialogDescription>
              {setupStep === "intro" && "Use an authenticator app to generate verification codes."}
              {setupStep === "verify" && "Enter the 6-digit code from your authenticator app."}
              {setupStep === "backup" && "Save these backup codes in a secure location."}
            </DialogDescription>
          </DialogHeader>

          {setupStep === "intro" && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">Your secret key:</p>
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
                <p className="font-medium">Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Open your authenticator app (Google Authenticator, Authy, etc.)</li>
                  <li>Add a new account manually</li>
                  <li>Enter the secret key shown above</li>
                  <li>Click "Next" and enter the generated code</li>
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
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
          )}

          {setupStep === "backup" && (
            <div className="space-y-4">
              <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
                <p className="text-sm text-warning flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Save these codes! You won't be able to see them again.
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
                Copy All Codes
              </Button>
            </div>
          )}

          <DialogFooter>
            {setupStep === "intro" && (
              <>
                <Button variant="outline" onClick={() => setSetupOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setSetupStep("verify")}>
                  Next
                </Button>
              </>
            )}
            {setupStep === "verify" && (
              <>
                <Button variant="outline" onClick={() => setSetupStep("intro")}>
                  Back
                </Button>
                <Button onClick={verifyAndEnable} disabled={processing}>
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Enable"
                  )}
                </Button>
              </>
            )}
            {setupStep === "backup" && (
              <Button onClick={() => setSetupOpen(false)} className="w-full">
                I've Saved My Codes
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Confirmation Dialog */}
      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication?</DialogTitle>
            <DialogDescription>
              This will remove the extra layer of security from your account.
              You can always enable it again later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={disable2FA} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disabling...
                </>
              ) : (
                "Disable 2FA"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
