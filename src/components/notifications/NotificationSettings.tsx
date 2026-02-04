import { useState, useEffect } from "react";
import { MessageSquare, Phone, Bell, Save, Loader2, Info, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface NotificationSettingsProps {
  schoolId: string;
}

interface Settings {
  id?: string;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_phone_number: string;
  twilio_whatsapp_number: string;
  daily_sms_limit: number;
  absence_message_template: string;
  low_marks_message_template: string;
}

const defaultSettings: Settings = {
  sms_enabled: false,
  whatsapp_enabled: false,
  twilio_account_sid: "",
  twilio_auth_token: "",
  twilio_phone_number: "",
  twilio_whatsapp_number: "",
  daily_sms_limit: 1000,
  absence_message_template: "Dear Parent, your child {student_name} of {class_name} was marked absent on {date}. Please contact the school if this is incorrect. - {school_name}",
  low_marks_message_template: "Dear Parent, your child {student_name} scored {marks}/{max_marks} ({percentage}%) in {subject} - {exam_title}. Please review with your child. - {school_name}",
};

export function NotificationSettings({ schoolId }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, [schoolId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("school_notification_settings")
        .select("*")
        .eq("school_id", schoolId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setSettings({
          id: data.id,
          sms_enabled: data.sms_enabled,
          whatsapp_enabled: data.whatsapp_enabled,
          twilio_account_sid: data.twilio_account_sid || "",
          twilio_auth_token: data.twilio_auth_token || "",
          twilio_phone_number: data.twilio_phone_number || "",
          twilio_whatsapp_number: data.twilio_whatsapp_number || "",
          daily_sms_limit: data.daily_sms_limit || 1000,
          absence_message_template: data.absence_message_template || defaultSettings.absence_message_template,
          low_marks_message_template: data.low_marks_message_template || defaultSettings.low_marks_message_template,
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settingsData = {
        school_id: schoolId,
        sms_enabled: settings.sms_enabled,
        whatsapp_enabled: settings.whatsapp_enabled,
        twilio_account_sid: settings.twilio_account_sid || null,
        twilio_auth_token: settings.twilio_auth_token || null,
        twilio_phone_number: settings.twilio_phone_number || null,
        twilio_whatsapp_number: settings.twilio_whatsapp_number || null,
        daily_sms_limit: settings.daily_sms_limit,
        absence_message_template: settings.absence_message_template,
        low_marks_message_template: settings.low_marks_message_template,
      };

      if (settings.id) {
        const { error } = await supabase
          .from("school_notification_settings")
          .update(settingsData)
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("school_notification_settings")
          .insert(settingsData)
          .select()
          .single();

        if (error) throw error;
        setSettings(prev => ({ ...prev, id: data.id }));
      }

      toast({
        title: "Settings Saved",
        description: "Notification settings have been updated.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save notification settings.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">SMS/WhatsApp Notifications</h2>
          <p className="text-sm text-muted-foreground">
            Configure automated alerts for parents when students are absent or score low marks
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="twilio">Twilio Setup</TabsTrigger>
          <TabsTrigger value="templates">Message Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Channels
              </CardTitle>
              <CardDescription>
                Enable or disable notification channels for your school
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Send text messages to parent phone numbers
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.sms_enabled}
                  onCheckedChange={(checked) => updateSetting("sms_enabled", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">WhatsApp Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Send WhatsApp messages to parents (requires Twilio WhatsApp)
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.whatsapp_enabled}
                  onCheckedChange={(checked) => updateSetting("whatsapp_enabled", checked)}
                />
              </div>

              <div className="pt-4 border-t">
                <Label>Daily SMS Limit</Label>
                <Input
                  type="number"
                  value={settings.daily_sms_limit}
                  onChange={(e) => updateSetting("daily_sms_limit", parseInt(e.target.value) || 1000)}
                  className="mt-1 w-32"
                  min={1}
                  max={10000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum number of SMS messages per day to prevent unexpected charges
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">How it works</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>When a student is marked absent, their parent receives an alert</li>
                    <li>When a student scores below passing marks, their parent is notified</li>
                    <li>Parents can opt-out from their dashboard settings</li>
                    <li>WhatsApp is preferred over SMS when both are available</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="twilio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Twilio Configuration</CardTitle>
              <CardDescription>
                Enter your Twilio credentials to enable SMS and WhatsApp notifications.{" "}
                <a
                  href="https://www.twilio.com/try-twilio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Sign up for Twilio <ExternalLink className="w-3 h-3" />
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account SID</Label>
                  <Input
                    type="password"
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={settings.twilio_account_sid}
                    onChange={(e) => updateSetting("twilio_account_sid", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Auth Token</Label>
                  <Input
                    type="password"
                    placeholder="Your auth token"
                    value={settings.twilio_auth_token}
                    onChange={(e) => updateSetting("twilio_auth_token", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMS Phone Number</Label>
                  <Input
                    placeholder="+1234567890"
                    value={settings.twilio_phone_number}
                    onChange={(e) => updateSetting("twilio_phone_number", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your Twilio phone number for sending SMS
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp Number (Optional)</Label>
                  <Input
                    placeholder="+1234567890"
                    value={settings.twilio_whatsapp_number}
                    onChange={(e) => updateSetting("twilio_whatsapp_number", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your Twilio WhatsApp-enabled number
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Important Notes</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-700">
                    <li>Keep your credentials secure - never share them</li>
                    <li>Twilio charges per message sent (check their pricing)</li>
                    <li>For WhatsApp, you need to set up a WhatsApp Business account with Twilio</li>
                    <li>Pakistani numbers should be in format: +923XXXXXXXXX</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Absence Alert Template</CardTitle>
              <CardDescription>
                Message sent to parents when their child is marked absent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={3}
                value={settings.absence_message_template}
                onChange={(e) => updateSetting("absence_message_template", e.target.value)}
                placeholder="Enter absence message template..."
              />
              <p className="text-xs text-muted-foreground mt-2">
                Available variables: {"{student_name}"}, {"{class_name}"}, {"{date}"}, {"{school_name}"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Low Marks Alert Template</CardTitle>
              <CardDescription>
                Message sent to parents when their child scores below passing marks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={3}
                value={settings.low_marks_message_template}
                onChange={(e) => updateSetting("low_marks_message_template", e.target.value)}
                placeholder="Enter low marks message template..."
              />
              <p className="text-xs text-muted-foreground mt-2">
                Available variables: {"{student_name}"}, {"{class_name}"}, {"{subject}"}, {"{exam_title}"}, {"{marks}"}, {"{max_marks}"}, {"{percentage}"}, {"{school_name}"}
              </p>
            </CardContent>
          </Card>

          <Button variant="outline" onClick={() => setSettings(prev => ({
            ...prev,
            absence_message_template: defaultSettings.absence_message_template,
            low_marks_message_template: defaultSettings.low_marks_message_template,
          }))}>
            Reset to Default Templates
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default NotificationSettings;
