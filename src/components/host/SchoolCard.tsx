import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Building,
  Edit,
  Power,
  Crown,
  Loader2,
  ExternalLink,
  Image,
  Copy,
  Check,
} from "lucide-react";
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

interface SchoolCardProps {
  school: School;
  onUpdate: (school: School) => void;
  onToggleStatus: (school: School) => void;
}

export function SchoolCard({ school, onUpdate, onToggleStatus }: SchoolCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const { t } = useTranslation();
  const [editData, setEditData] = useState(school);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  const slug = generateSlug(school.name);
  const publicUrl = `/school/${slug}`;

  const handleSave = async () => {
    if (!editData.name.trim()) {
      toast({
        variant: "destructive",
        title: t("hostSchool.validationError"),
        description: t("hostSchool.schoolNameRequired"),
      });
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('schools')
        .update({
          name: editData.name.trim(),
          email: editData.email?.trim() || null,
          phone: editData.phone?.trim() || null,
          address: editData.address?.trim() || null,
          logo_url: editData.logo_url?.trim() || null,
        })
        .eq('id', school.id);

      if (error) throw error;

      toast({
        title: t("hostSchool.success"),
        description: t("hostSchool.schoolUpdated"),
      });

      onUpdate({ ...school, ...editData });
      setIsEditing(false);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error updating school:', error);
      toast({
        variant: "destructive",
        title: t("hostSchool.error"),
        description: t("hostSchool.updateError"),
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const copyPublicUrl = async () => {
    const fullUrl = `${window.location.origin}${publicUrl}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: t("hostSchool.copied"),
      description: t("hostSchool.copiedDesc"),
    });
  };

  if (isEditing) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("hostSchool.schoolNameLabel")}</Label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("hostSchool.emailLabel")}</Label>
              <Input
                type="email"
                value={editData.email || ""}
                onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("hostSchool.phoneLabel")}</Label>
              <Input
                value={editData.phone || ""}
                onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("hostSchool.addressLabel")}</Label>
              <Input
                value={editData.address || ""}
                onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>
                <Image className="w-4 h-4 inline mr-2" />
                {t("hostSchool.logoUrlLabel")}
              </Label>
              <Input
                value={editData.logo_url || ""}
                onChange={(e) => setEditData(prev => ({ ...prev, logo_url: e.target.value }))}
                placeholder={t("hostSchool.logoUrlPlaceholder")}
              />
              <p className="text-xs text-muted-foreground">{t("hostSchool.logoUrlEditHelp")}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setEditData(school);
              }}
            >
              {t("hostSchool.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUpdating}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("hostSchool.saveChanges")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {school.logo_url ? (
              <img
                src={school.logo_url}
                alt={school.name}
                className="w-12 h-12 rounded-lg object-contain bg-muted p-1"
                loading="lazy"
              />
            ) : (
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-medium text-foreground">{school.name}</h3>
                <Badge
                  variant={school.is_active ? "default" : "secondary"}
                  className={school.is_active ? "bg-green-600" : "bg-muted"}
                >
                  {school.is_active ? t("hostSchool.active") : t("hostSchool.inactive")}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                {school.email && <p>{t("hostSchool.emailField")}: {school.email}</p>}
                {school.phone && <p>{t("hostSchool.phoneField")}: {school.phone}</p>}
                {school.address && <p>{t("hostSchool.addressField")}: {school.address}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">{t("hostSchool.publicUrl")}:</span>
                  <code className="text-xs bg-muted px-2 py-0.5 rounded text-amber-600 dark:text-amber-400">
                    /school/{slug}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyPublicUrl}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(publicUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              {t("hostSchool.viewPage")}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="w-4 h-4 mr-1" />
              {t("hostSchool.edit")}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`${
                    school.is_active
                      ? "text-red-400 hover:bg-red-500/10"
                      : "text-green-400 hover:bg-green-500/10"
                  }`}
                >
                  <Power className="w-4 h-4 mr-1" />
                  {school.is_active ? t("hostSchool.disable") : t("hostSchool.enable")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {school.is_active ? t("hostSchool.disableTitle") : t("hostSchool.enableTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {school.is_active
                      ? t("hostSchool.disableDesc")
                      : t("hostSchool.enableDesc")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {t("hostSchool.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onToggleStatus(school)}
                    className={school.is_active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                  >
                    {school.is_active ? t("hostSchool.disable") : t("hostSchool.enable")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/sys-admin-x7k9/school/${school.id}/principal`)}
              className="text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            >
              <Crown className="w-4 h-4 mr-1" />
              {t("hostSchool.principal")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
