import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { History, Monitor, Smartphone, Tablet, Globe, CheckCircle, XCircle, Shield } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface LoginRecord {
  id: string;
  login_at: string;
  ip_address: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  location_country: string | null;
  location_city: string | null;
  login_status: "success" | "failed" | "blocked";
  failure_reason: string | null;
}

export default function LoginHistory() {
  const [history, setHistory] = useState<LoginRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("login_history")
        .select("*")
        .eq("user_id", user.id)
        .order("login_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching login history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-success/10 text-success">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t("loginHistory.success")}
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-destructive/10 text-destructive">
            <XCircle className="h-3 w-3 mr-1" />
            {t("loginHistory.failed")}
          </Badge>
        );
      case "blocked":
        return (
          <Badge className="bg-warning/10 text-warning">
            <Shield className="h-3 w-3 mr-1" />
            {t("loginHistory.blocked")}
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t("loginHistory.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-3 border rounded-lg">
                <div className="h-8 w-8 bg-muted rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          {t("loginHistory.title")}
        </CardTitle>
        <CardDescription>
          {t("loginHistory.subtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t("loginHistory.empty")}</p>
          </div>
        ) : (
          <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 max-h-[400px] overflow-y-auto" role="region" aria-label="Login history">
            {history.map((record) => (
              <div key={record.id} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(record.device_type)}
                    <div>
                      <p className="text-sm font-medium">{record.device_type || t("loginHistory.unknown")}</p>
                      <p className="text-xs text-muted-foreground">{record.browser || t("loginHistory.unknown")} &middot; {record.os || t("loginHistory.unknownOS")}</p>
                    </div>
                  </div>
                  {getStatusBadge(record.login_status)}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{format(new Date(record.login_at), "PPp")}</span>
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    <span>{record.ip_address || t("loginHistory.unknown")}</span>
                  </div>
                </div>
                {record.failure_reason && (
                  <p className="text-xs text-destructive">{record.failure_reason}</p>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <ScrollArea className="h-[400px]">
              <Table aria-label="Login history">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("loginHistory.dateTime")}</TableHead>
                    <TableHead>{t("loginHistory.device")}</TableHead>
                    <TableHead>{t("loginHistory.browser")}</TableHead>
                    <TableHead>{t("loginHistory.ipAddress")}</TableHead>
                    <TableHead>{t("loginHistory.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {format(new Date(record.login_at), "PPp")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(record.login_at), { addSuffix: true })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(record.device_type)}
                          <div>
                            <p className="text-sm">{record.device_type || t("loginHistory.unknown")}</p>
                            <p className="text-xs text-muted-foreground">{record.os || t("loginHistory.unknownOS")}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{record.browser || t("loginHistory.unknown")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{record.ip_address || t("loginHistory.unknown")}</span>
                        </div>
                        {record.location_city && (
                          <p className="text-xs text-muted-foreground">
                            {record.location_city}, {record.location_country}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.login_status)}
                        {record.failure_reason && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {record.failure_reason}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
