import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, Image } from "lucide-react";
import { generateSlug } from "@/lib/utils/slug";

interface School {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface CreateSchoolFormProps {
  onCreated: (school: School) => void;
  onCancel: () => void;
}

export function CreateSchoolForm({ onCreated, onCancel }: CreateSchoolFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    logo_url: "",
  });

  const slug = generateSlug(formData.name);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: t("hostSchool.validationError"),
        description: t("hostSchool.schoolNameRequired"),
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('schools')
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          address: formData.address.trim() || null,
          logo_url: formData.logo_url.trim() || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: t("hostSchool.schoolCreated"),
        description: t("hostSchool.schoolCreatedDesc", { name: formData.name, slug }),
      });

      onCreated(data as School);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error creating school:', error);
      toast({
        variant: "destructive",
        title: t("hostSchool.error"),
        description: t("hostSchool.createError"),
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t("hostSchool.createTitle")}</CardTitle>
        <CardDescription>
          {t("hostSchool.createDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("hostSchool.schoolNameLabel")}</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t("hostSchool.schoolNamePlaceholder")}
            />
            {formData.name && (
              <p className="text-xs text-muted-foreground">
                URL Slug: <code className="text-amber-600 dark:text-amber-400">/school/{slug}</code>
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t("hostSchool.emailLabel")}</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder={t("hostSchool.emailPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("hostSchool.phoneLabel")}</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder={t("hostSchool.phonePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("hostSchool.addressLabel")}</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder={t("hostSchool.addressPlaceholder")}
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>
              <Image className="w-4 h-4 inline mr-2" />
              {t("hostSchool.logoUrlLabel")}
            </Label>
            <Input
              value={formData.logo_url}
              onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
              placeholder={t("hostSchool.logoUrlPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">
              {t("hostSchool.logoUrlHelp")}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            {t("hostSchool.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isCreating}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {t("hostSchool.createSchool")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
