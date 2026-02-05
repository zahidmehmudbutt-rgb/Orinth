import { useState, useEffect } from "react";
import { Save, Upload, ExternalLink, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoadingButton } from "@/components/ui/LoadingButton";

// Only use columns that exist in the schools table
interface SchoolSettings {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
}

interface SchoolSettingsFormProps {
  schoolId: string;
  onSaved?: () => void;
}

const colorPresets = [
  { name: "Blue", value: "#2563eb" },
  { name: "Green", value: "#16a34a" },
  { name: "Purple", value: "#9333ea" },
  { name: "Red", value: "#dc2626" },
  { name: "Orange", value: "#ea580c" },
  { name: "Teal", value: "#0d9488" },
  { name: "Pink", value: "#db2777" },
  { name: "Indigo", value: "#4f46e5" },
];

// Extended settings stored locally until database columns are added
interface ExtendedSettings {
  website: string | null;
  description: string | null;
  established_year: number | null;
  motto: string | null;
  primary_color: string | null;
}

function loadExtendedSettings(schoolId: string): ExtendedSettings {
  try {
    const stored = localStorage.getItem(`school_settings_${schoolId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Failed to load extended settings");
  }
  return {
    website: null,
    description: null,
    established_year: null,
    motto: null,
    primary_color: "#2563eb",
  };
}

function saveExtendedSettings(schoolId: string, settings: ExtendedSettings): void {
  try {
    localStorage.setItem(`school_settings_${schoolId}`, JSON.stringify(settings));
  } catch (e) {
    console.warn("Failed to save extended settings");
  }
}

export function SchoolSettingsForm({ schoolId, onSaved }: SchoolSettingsFormProps) {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [extended, setExtended] = useState<ExtendedSettings>(loadExtendedSettings(schoolId));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, [schoolId]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("schools")
        .select("id, name, address, phone, email, logo_url")
        .eq("id", schoolId)
        .single();

      if (error) throw error;
      setSettings(data);
      setExtended(loadExtendedSettings(schoolId));
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load school settings. Check your connection and refresh.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof SchoolSettings, value: string | null) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const handleExtendedChange = (field: keyof ExtendedSettings, value: string | number | null) => {
    setExtended({ ...extended, [field]: value });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    const maxSize = 2 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Logo must be less than 2MB.",
      });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload a JPG, PNG, GIF, or WebP image.",
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${schoolId}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("school-assets")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("school-assets")
        .getPublicUrl(fileName);

      setSettings({ ...settings, logo_url: urlData.publicUrl });

      toast({
        title: "Logo Uploaded",
        description: "School logo has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Could not upload the logo. Ensure the file is a valid image under 2MB.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);

    try {
      // Save core settings to database
      const { error } = await supabase
        .from("schools")
        .update({
          address: settings.address,
          phone: settings.phone,
          email: settings.email,
          logo_url: settings.logo_url,
        })
        .eq("id", schoolId);

      if (error) throw error;

      // Save extended settings to localStorage
      saveExtendedSettings(schoolId, extended);

      toast({
        title: "Settings Saved",
        description: "School settings have been updated successfully.",
      });

      onSaved?.();
    } catch (error) {
      console.error("Save error:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save settings. Check your connection and try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getPublicPageUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/school/${schoolId}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Could not load settings. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Public Page Link */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-foreground">Your School's Public Page</p>
              <p className="text-sm text-muted-foreground">Share this link with prospective students and parents</p>
            </div>
            <Button
              variant="outline"
              onClick={() => window.open(getPublicPageUrl(), "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Page
            </Button>
          </div>
          <div className="mt-3 p-2 bg-background rounded border text-sm font-mono text-muted-foreground break-all">
            {getPublicPageUrl()}
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>General school information displayed on your public page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">School Name</Label>
              <Input
                id="name"
                value={settings.name}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">School name cannot be changed from settings</p>
            </div>
            <div>
              <Label htmlFor="established_year">Established Year</Label>
              <Input
                id="established_year"
                type="number"
                placeholder="e.g., 1995"
                value={extended.established_year || ""}
                onChange={(e) => handleExtendedChange("established_year", e.target.value ? parseInt(e.target.value) : null)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="motto">School Motto</Label>
            <Input
              id="motto"
              placeholder="e.g., Excellence in Education"
              value={extended.motto || ""}
              onChange={(e) => handleExtendedChange("motto", e.target.value || null)}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Tell visitors about your school..."
              rows={4}
              value={extended.description || ""}
              onChange={(e) => handleExtendedChange("description", e.target.value || null)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>How visitors can reach your school</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              placeholder="Full school address"
              rows={2}
              value={settings.address || ""}
              onChange={(e) => handleChange("address", e.target.value || null)}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+92 300 1234567"
                value={settings.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value || null)}
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="info@school.edu.pk"
                value={settings.email || ""}
                onChange={(e) => handleChange("email", e.target.value || null)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="website">Website URL</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://www.school.edu.pk"
              value={extended.website || ""}
              onChange={(e) => handleExtendedChange("website", e.target.value || null)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Customize the look of your public page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div>
            <Label>School Logo</Label>
            <div className="flex items-center gap-4 mt-2">
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt="School logo"
                  className="w-20 h-20 rounded-lg object-contain border bg-white"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-muted-foreground/50" />
                </div>
              )}
              <div>
                <input
                  type="file"
                  id="logo-upload"
                  className="hidden"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleLogoUpload}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("logo-upload")?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Upload Logo"}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, GIF, or WebP. Max 2MB.</p>
              </div>
            </div>
          </div>

          {/* Primary Color */}
          <div>
            <Label className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Primary Color
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {colorPresets.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleExtendedChange("primary_color", color.value)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    extended.primary_color === color.value
                      ? "border-foreground scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={extended.primary_color || "#2563eb"}
                  onChange={(e) => handleExtendedChange("primary_color", e.target.value)}
                  className="w-10 h-10 p-1 cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">Custom</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <LoadingButton
          onClick={handleSave}
          loading={isSaving}
          loadingText="Saving..."
          className="px-8"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </LoadingButton>
      </div>
    </div>
  );
}
