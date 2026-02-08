import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Bell, Calendar, GraduationCap, Megaphone, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LoadingButton } from "@/components/ui/LoadingButton";

// NOTE: Email preferences are stored locally until email_preferences table is created
// This provides a UI-ready component for future database integration

interface EmailPreferencesData {
  homework_notifications: boolean;
  attendance_notifications: boolean;
  grades_notifications: boolean;
  notice_notifications: boolean;
}

const STORAGE_KEY = "email_preferences";

function loadFromStorage(): EmailPreferencesData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    if (import.meta.env.DEV) console.warn("Failed to load email preferences from storage");
  }
  return {
    homework_notifications: true,
    attendance_notifications: true,
    grades_notifications: true,
    notice_notifications: true,
  };
}

function saveToStorage(prefs: EmailPreferencesData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    if (import.meta.env.DEV) console.warn("Failed to save email preferences to storage");
  }
}

export function EmailPreferences() {
  const [preferences, setPreferences] = useState<EmailPreferencesData>(loadFromStorage);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleToggle = (key: keyof EmailPreferencesData) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage for now (email_preferences table not yet created)
      saveToStorage(preferences);
      
      toast({
        title: t("emailPreferences.saved"),
        description: t("emailPreferences.savedDesc"),
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error saving preferences:", error);
      toast({
        variant: "destructive",
        title: t("emailPreferences.error"),
        description: t("emailPreferences.errorDesc"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          {t("emailPreferences.title")}
        </CardTitle>
        <CardDescription>
          {t("emailPreferences.subtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <Label htmlFor="homework" className="font-medium">
                {t("emailPreferences.homework")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("emailPreferences.homeworkDesc")}
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
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <Label htmlFor="attendance" className="font-medium">
                {t("emailPreferences.attendance")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("emailPreferences.attendanceDesc")}
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
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <Label htmlFor="grades" className="font-medium">
                {t("emailPreferences.grades")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("emailPreferences.gradesDesc")}
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
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <Label htmlFor="notices" className="font-medium">
                {t("emailPreferences.notices")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("emailPreferences.noticesDesc")}
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
            loadingText={t("emailPreferences.saving")}
            className="w-full sm:w-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            {t("emailPreferences.saveButton")}
          </LoadingButton>
        </div>
      </CardContent>
    </Card>
  );
}
