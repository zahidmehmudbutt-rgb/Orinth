import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Megaphone, Pin, Clock, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: "low" | "normal" | "high" | "urgent";
  is_pinned: boolean;
  created_by: string;
  creator_name: string;
  created_at: string;
  expires_at: string | null;
}

const priorityConfig = {
  low: { color: "bg-muted text-muted-foreground", icon: Info },
  normal: { color: "bg-primary/10 text-primary", icon: Megaphone },
  high: { color: "bg-warning/10 text-warning", icon: AlertTriangle },
  urgent: { color: "bg-destructive/10 text-destructive", icon: AlertCircle },
};

export default function AnnouncementList() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .rpc("get_active_announcements", { p_user_id: user.id });

      if (error) throw error;

      setAnnouncements(data || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (announcements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No announcements at this time</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Announcements
          {announcements.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {announcements.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {announcements.map((announcement) => {
              const config = priorityConfig[announcement.priority];
              const Icon = config.icon;

              return (
                <div
                  key={announcement.id}
                  className={`p-4 rounded-lg border ${
                    announcement.is_pinned ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {announcement.is_pinned && (
                        <Pin className="h-4 w-4 text-primary" />
                      )}
                      <h4 className="font-semibold text-foreground">
                        {announcement.title}
                      </h4>
                    </div>
                    <Badge className={config.color}>
                      <Icon className="h-3 w-3 mr-1" />
                      {announcement.priority}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">
                    {announcement.content}
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>By {announcement.creator_name}</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(announcement.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>

                  {announcement.expires_at && (
                    <div className="mt-2 text-xs text-warning">
                      Expires: {format(new Date(announcement.expires_at), "PPp")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
