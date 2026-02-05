import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Save, Mail, Phone, MapPin, MessageCircle, Lock, Eye, EyeOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AccountSettingsProps {
  roleColor?: string;
}

const AccountSettings = ({ roleColor = "bg-primary" }: AccountSettingsProps) => {
  const { user, profile, refreshUserData } = useAuth();
  const { toast } = useToast();
  
  // Profile state
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp || "");
  const [address, setAddress] = useState(profile?.address || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Full name is required.",
      });
      return;
    }

    setIsUpdatingProfile(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          whatsapp: whatsapp.trim() || null,
          address: address.trim() || null,
        })
        .eq("id", user?.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });

      refreshUserData();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update your profile. Check your connection and try again.",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all password fields.",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "New password must be at least 8 characters.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Passwords do not match.",
      });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not change your password. Your session may have expired.",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-card border border-border">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full grid grid-cols-2 rounded-t-xl rounded-b-none border-b">
          <TabsTrigger value="profile" className={`data-[state=active]:${roleColor} data-[state=active]:text-primary-foreground`}>
            Account Information
          </TabsTrigger>
          <TabsTrigger value="security" className={`data-[state=active]:${roleColor} data-[state=active]:text-primary-foreground`}>
            Change Password
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email Address
              </Label>
              <Input
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact admin for assistance.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Phone Number
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
                  WhatsApp Number
                </Label>
                <Input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+92 300 1234567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Address
              </Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your address"
              />
            </div>

            <Button
              onClick={handleUpdateProfile}
              disabled={isUpdatingProfile}
              className={`w-full ${roleColor} text-primary-foreground`}
            >
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="security" className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                New Password
              </Label>
              <div className="relative">
                <Input
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
            </div>

            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={isUpdatingPassword}
              className={`w-full ${roleColor} text-primary-foreground`}
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountSettings;
