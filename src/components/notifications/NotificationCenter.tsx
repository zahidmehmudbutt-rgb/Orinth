import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Check, CheckCheck, BookOpen, Calendar, GraduationCap, Megaphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, Notification, NotificationType } from "@/lib/notifications";
import { formatDistanceToNow } from "date-fns";

interface NotificationCenterProps {
  className?: string;
}

const notificationIcons: Record<NotificationType, typeof Bell> = {
  homework_assigned: BookOpen,
  attendance_alert: Calendar,
  grades_published: GraduationCap,
  notice: Megaphone,
  welcome: Bell,
  general: Bell,
};

const notificationColors: Record<NotificationType, string> = {
  homework_assigned: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  attendance_alert: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  grades_published: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  notice: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  welcome: "bg-primary/10 text-primary",
  general: "bg-muted text-muted-foreground",
};

export function NotificationCenter({ className }: NotificationCenterProps) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUnreadCount();
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadUnreadCount = async () => {
    const count = await getUnreadCount();
    setUnreadCount(count);
  };

  const loadNotifications = async () => {
    setIsLoading(true);
    const data = await getNotifications(20);
    setNotifications(data);
    setIsLoading(false);
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.is_read) return;

    const success = await markAsRead(notification.id);
    if (success) {
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllAsRead = async () => {
    const success = await markAllAsRead();
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return t("notifications.recently");
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative ${className}`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-foreground">{t("notifications.title")}</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>{t("notifications.noNotifications")}</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || Bell;
                const colorClass = notificationColors[notification.type] || notificationColors.general;

                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                      !notification.is_read ? "bg-primary/5" : ""
                    }`}
                    onClick={() => handleMarkAsRead(notification)}
                  >
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium truncate ${!notification.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
