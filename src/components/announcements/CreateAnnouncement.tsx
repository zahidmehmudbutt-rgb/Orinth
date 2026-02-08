import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Megaphone } from "lucide-react";

interface CreateAnnouncementProps {
  schoolId: string;
  onCreated?: () => void;
}

const AUDIENCE_KEYS = [
  { value: "all", key: "createAnnouncement.everyone" },
  { value: "students", key: "createAnnouncement.students" },
  { value: "teachers", key: "createAnnouncement.teachers" },
  { value: "class_teachers", key: "createAnnouncement.classTeachers" },
  { value: "coordinators", key: "createAnnouncement.coordinators" },
  { value: "parents", key: "createAnnouncement.parents" },
];

export default function CreateAnnouncement({ schoolId, onCreated }: CreateAnnouncementProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<string>("normal");
  const [targetAudience, setTargetAudience] = useState<string[]>(["all"]);
  const [isPinned, setIsPinned] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<string>("");
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleAudienceChange = (value: string, checked: boolean) => {
    if (value === "all") {
      setTargetAudience(checked ? ["all"] : []);
    } else {
      let newAudience = targetAudience.filter(a => a !== "all");
      if (checked) {
        newAudience.push(value);
      } else {
        newAudience = newAudience.filter(a => a !== value);
      }
      setTargetAudience(newAudience.length === 0 ? ["all"] : newAudience);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast({
        variant: "destructive",
        title: t("createAnnouncement.validationError"),
        description: t("createAnnouncement.validationDesc"),
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let expiresAt = null;
      if (expiresInDays && parseInt(expiresInDays) > 0) {
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + parseInt(expiresInDays));
        expiresAt = expireDate.toISOString();
      }

      const { error } = await supabase.from("announcements").insert({
        school_id: schoolId,
        created_by: user.id,
        title: title.trim(),
        content: content.trim(),
        priority,
        target_audience: targetAudience,
        is_pinned: isPinned,
        expires_at: expiresAt,
      });

      if (error) throw error;

      toast({
        title: t("createAnnouncement.created"),
        description: t("createAnnouncement.createdDesc"),
      });

      // Reset form
      setTitle("");
      setContent("");
      setPriority("normal");
      setTargetAudience(["all"]);
      setIsPinned(false);
      setExpiresInDays("");
      setOpen(false);

      onCreated?.();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error creating announcement:", error);
      toast({
        variant: "destructive",
        title: t("createAnnouncement.error"),
        description: t("createAnnouncement.errorDesc"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t("createAnnouncement.new")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            {t("createAnnouncement.title")}
          </DialogTitle>
          <DialogDescription>
            {t("createAnnouncement.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("createAnnouncement.titleLabel")}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("createAnnouncement.titlePlaceholder")}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">{t("createAnnouncement.contentLabel")}</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("createAnnouncement.contentPlaceholder")}
              rows={4}
              maxLength={5000}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">{t("createAnnouncement.priority")}</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("createAnnouncement.low")}</SelectItem>
                  <SelectItem value="normal">{t("createAnnouncement.normal")}</SelectItem>
                  <SelectItem value="high">{t("createAnnouncement.high")}</SelectItem>
                  <SelectItem value="urgent">{t("createAnnouncement.urgent")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires">{t("createAnnouncement.expiresIn")}</Label>
              <Input
                id="expires"
                type="number"
                min="0"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                placeholder={t("createAnnouncement.never")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("createAnnouncement.targetAudience")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {AUDIENCE_KEYS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`audience-${option.value}`}
                    checked={targetAudience.includes(option.value)}
                    onCheckedChange={(checked) =>
                      handleAudienceChange(option.value, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`audience-${option.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {t(option.key)}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="pinned"
              checked={isPinned}
              onCheckedChange={(checked) => setIsPinned(checked as boolean)}
            />
            <label htmlFor="pinned" className="text-sm cursor-pointer">
              {t("createAnnouncement.pinAnnouncement")}
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("createAnnouncement.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("createAnnouncement.creating")}
                </>
              ) : (
                t("createAnnouncement.publish")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
