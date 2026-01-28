import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, RefreshCw, Loader2, Building, Crown, Power, Edit, Plus } from "lucide-react";

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  details: Record<string, unknown> | null;
  created_at: string;
  school_id: string | null;
}

interface ActivityLogListProps {
  logs: ActivityLog[];
  isLoading: boolean;
  onRefresh: () => void;
}

const getActionIcon = (action: string) => {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('create') || actionLower.includes('add')) {
    return <Plus className="w-4 h-4 text-green-400" />;
  }
  if (actionLower.includes('update') || actionLower.includes('edit') || actionLower.includes('change')) {
    return <Edit className="w-4 h-4 text-blue-400" />;
  }
  if (actionLower.includes('deactivate') || actionLower.includes('disable')) {
    return <Power className="w-4 h-4 text-red-400" />;
  }
  if (actionLower.includes('activate') || actionLower.includes('enable')) {
    return <Power className="w-4 h-4 text-green-400" />;
  }
  if (actionLower.includes('principal')) {
    return <Crown className="w-4 h-4 text-amber-400" />;
  }
  if (actionLower.includes('school')) {
    return <Building className="w-4 h-4 text-slate-400" />;
  }
  return <Activity className="w-4 h-4 text-slate-400" />;
};

const getActionColor = (action: string) => {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('create') || actionLower.includes('add') || actionLower.includes('activate') || actionLower.includes('enable')) {
    return "bg-green-500/10 text-green-400 border-green-500/20";
  }
  if (actionLower.includes('deactivate') || actionLower.includes('disable') || actionLower.includes('delete')) {
    return "bg-red-500/10 text-red-400 border-red-500/20";
  }
  if (actionLower.includes('update') || actionLower.includes('edit') || actionLower.includes('change')) {
    return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  }
  return "bg-slate-500/10 text-slate-400 border-slate-500/20";
};

const formatDetails = (details: Record<string, unknown> | null) => {
  if (!details) return null;
  
  const entries = Object.entries(details).filter(([key]) => 
    !['id', 'user_id', 'school_id'].includes(key)
  );
  
  if (entries.length === 0) return null;
  
  return entries.map(([key, value]) => (
    <span key={key} className="inline-flex items-center gap-1">
      <span className="text-slate-500">{key}:</span>
      <span className="text-slate-300">{String(value)}</span>
    </span>
  ));
};

export function ActivityLogList({ logs, isLoading, onRefresh }: ActivityLogListProps) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">System Activity Logs</CardTitle>
            <CardDescription className="text-slate-400">
              Track all host actions: school creation, principal assignments, status changes
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Activity className="w-12 h-12 text-slate-600 mb-4" />
            <p className="text-slate-400">No activity logs yet</p>
            <p className="text-sm text-slate-500 mt-1">Actions like creating schools will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors"
              >
                <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-white">{log.action}</span>
                    <Badge variant="outline" className={getActionColor(log.action)}>
                      {log.entity_type}
                    </Badge>
                  </div>
                  {log.details && (
                    <div className="text-sm text-slate-400 flex gap-3 flex-wrap">
                      {formatDetails(log.details)}
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
