import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Megaphone, Pin, Trash2, Edit, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import CreateAnnouncement from "./CreateAnnouncement";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  target_audience: string[];
  is_pinned: boolean;
  created_at: string;
  expires_at: string | null;
  created_by: string;
}

interface AnnouncementManagerProps {
  schoolId: string;
}

const priorityColors: Record<string, string> = {
  low: "bg-muted",
  normal: "bg-primary/10 text-primary",
  high: "bg-warning/10 text-warning",
  urgent: "bg-destructive/10 text-destructive",
};

export default function AnnouncementManager({ schoolId }: AnnouncementManagerProps) {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("school_id", schoolId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [schoolId]);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      setAnnouncements(announcements.filter(a => a.id !== deleteId));
      toast({
        title: t("announcements.deleted"),
        description: t("announcements.deletedDesc"),
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error deleting announcement:", error);
      toast({
        variant: "destructive",
        title: t("announcements.error"),
        description: t("announcements.deleteFailed"),
      });
    } finally {
      setDeleteId(null);
    }
  };

  const togglePin = async (id: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ is_pinned: !currentPinned })
        .eq("id", id);

      if (error) throw error;

      setAnnouncements(announcements.map(a =>
        a.id === id ? { ...a, is_pinned: !currentPinned } : a
      ));

      toast({
        title: currentPinned ? t("announcements.unpinned") : t("announcements.pinned"),
        description: t("announcements.pinnedDesc", { action: currentPinned ? "unpinned" : "pinned" }),
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error toggling pin:", error);
    }
  };

  const formatAudience = (audience: string[]) => {
    if (audience.includes("all")) return t("announcements.everyone");
    return audience.map(a => a.replace(/_/g, " ")).join(", ");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          {t("announcements.manageTitle")}
        </CardTitle>
        <CreateAnnouncement schoolId={schoolId} onCreated={fetchAnnouncements} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse p-4 border rounded-lg">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t("announcements.empty")}</p>
            <p className="text-sm">{t("announcements.emptyDesc")}</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`p-4 border rounded-lg ${
                    announcement.is_pinned ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {announcement.is_pinned && (
                          <Pin className="h-4 w-4 text-primary" />
                        )}
                        <h4 className="font-semibold">{announcement.title}</h4>
                        <Badge className={priorityColors[announcement.priority]}>
                          {announcement.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {announcement.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(announcement.created_at), "PPp")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {formatAudience(announcement.target_audience)}
                        </span>
                        {announcement.expires_at && (
                          <span className="text-warning">
                            {t("announcements.expiresLabel", { date: format(new Date(announcement.expires_at), "PP") })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePin(announcement.id, announcement.is_pinned)}
                        title={announcement.is_pinned ? "Unpin" : "Pin"}
                      >
                        <Pin className={`h-4 w-4 ${announcement.is_pinned ? "text-primary" : ""}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(announcement.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("announcements.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("announcements.deleteDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("announcements.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t("announcements.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
