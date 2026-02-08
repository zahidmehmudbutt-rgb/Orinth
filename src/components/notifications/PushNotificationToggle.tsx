import { useTranslation } from "react-i18next";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, Loader2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PushNotificationToggle() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isSupported, isSubscribed, permission, loading, subscribe, unsubscribe } = usePushNotifications();

  const handleToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast({ title: t("pushNotifications.disabled"), description: t("pushNotifications.disabledDesc") });
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast({ title: t("pushNotifications.enabled"), description: t("pushNotifications.enabledDesc") });
      } else if (permission === "denied") {
        toast({
          variant: "destructive",
          title: t("pushNotifications.blocked"),
          description: t("pushNotifications.blockedDesc"),
        });
      }
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BellOff className="h-5 w-5" />
            {t("pushNotifications.title")}
          </CardTitle>
          <CardDescription>{t("pushNotifications.notSupported")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-5 w-5" />
              {t("pushNotifications.title")}
            </CardTitle>
            <CardDescription>{t("pushNotifications.description")}</CardDescription>
          </div>
          {isSubscribed && (
            <Badge className="bg-success/10 text-success">
              {t("pushNotifications.active")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>{t("pushNotifications.receiveLabel")}</Label>
            <p className="text-sm text-muted-foreground">
              {isSubscribed ? t("pushNotifications.subscribedDesc") : t("pushNotifications.unsubscribedDesc")}
            </p>
          </div>
          {loading ? (
            <span role="status">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
              <span className="sr-only">Loading...</span>
            </span>
          ) : (
            <Switch checked={isSubscribed} onCheckedChange={handleToggle} />
          )}
        </div>
        {permission === "denied" && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-warning/5 border border-warning/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
            <p className="text-sm text-muted-foreground">{t("pushNotifications.deniedHint")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
