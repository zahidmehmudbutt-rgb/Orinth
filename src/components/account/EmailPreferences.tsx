import { useState, useEffect } from "react";
import { Mail, Bell, Calendar, GraduationCap, Megaphone, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoadingButton } from "@/components/ui/LoadingButton";

interface EmailPreferencesData {
  homework_notifications: boolean;
  attendance_notifications: boolean;
  grades_notifications: boolean;
  notice_notifications: boolean;
}

export function EmailPreferences() {
  const [preferences, setPreferences] = useState<EmailPreferencesData>({
    homework_notifications: true,
    attendance_notifications: true,
    grades_notifications: true,
    notice_notifications: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("email_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading preferences:", error);
        return;
      }

      if (data) {
        setPreferences({
          homework_notifications: data.homework_notifications,
          attendance_notifications: data.attendance_notifications,
          grades_notifications: data.grades_notifications,
          notice_notifications: data.notice_notifications,
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof EmailPreferencesData) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("email_preferences")
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (error) throw error;

      toast({
        title: "Preferences Saved",
        description: "Your email notification preferences have been updated.",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save preferences. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Notifications
        </CardTitle>
        <CardDescription>
          Choose which notifications you'd like to receive via email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <Label htmlFor="homework" className="font-medium">
                Homework Assignments
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new homework is assigned
              </p>
            </div>
          </div>
          <Switch
            id="homework"
            checked={preferences.homework_notifications}
            onCheckedChange={() => handleToggle("homework_notifications")}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <Label htmlFor="attendance" className="font-medium">
                Attendance Alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified when your child is marked absent
              </p>
            </div>
          </div>
          <Switch
            id="attendance"
            checked={preferences.attendance_notifications}
            onCheckedChange={() => handleToggle("attendance_notifications")}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <Label htmlFor="grades" className="font-medium">
                Grades Published
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified when homework is graded
              </p>
            </div>
          </div>
          <Switch
            id="grades"
            checked={preferences.grades_notifications}
            onCheckedChange={() => handleToggle("grades_notifications")}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <Label htmlFor="notices" className="font-medium">
                School Notices
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified about important announcements
              </p>
            </div>
          </div>
          <Switch
            id="notices"
            checked={preferences.notice_notifications}
            onCheckedChange={() => handleToggle("notice_notifications")}
          />
        </div>

        <div className="pt-4 border-t">
          <LoadingButton
            onClick={handleSave}
            loading={isSaving}
            loadingText="Saving..."
            className="w-full sm:w-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Preferences
          </LoadingButton>
        </div>
      </CardContent>
    </Card>
  );
}
