import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Building,
  Activity,
  Plus,
  LogOut,
  Loader2,
  Search,
  RefreshCw,
} from "lucide-react";
import { SchoolCard } from "@/components/host/SchoolCard";
import { CreateSchoolForm } from "@/components/host/CreateSchoolForm";
import { ActivityLogList } from "@/components/host/ActivityLogList";

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

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  details: Record<string, unknown> | null;
  created_at: string;
  school_id: string | null;
}

const HostDashboard = () => {
  const navigate = useNavigate();
  const { user, isHost, loading } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("schools");
  const [schools, setSchools] = useState<School[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewSchoolForm, setShowNewSchoolForm] = useState(false);

  useEffect(() => {
    if (!loading && !isHost) {
      navigate("/sys-admin-x7k9");
    }
  }, [loading, isHost, navigate]);

  useEffect(() => {
    if (isHost) {
      fetchSchools();
      fetchActivityLogs();
    }
  }, [isHost]);

  const fetchSchools = async () => {
    setIsLoadingSchools(true);
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchools((data || []) as School[]);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching schools:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load schools.",
      });
    } finally {
      setIsLoadingSchools(false);
    }
  };

  const fetchActivityLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setActivityLogs((data || []) as ActivityLog[]);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching activity logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleSchoolCreated = (school: School) => {
    setSchools(prev => [school, ...prev]);
    setShowNewSchoolForm(false);
  };

  const handleSchoolUpdate = (updatedSchool: School) => {
    setSchools(prev => prev.map(s => s.id === updatedSchool.id ? updatedSchool : s));
  };

  const handleToggleSchoolStatus = async (school: School) => {
    try {
      // If deactivating, check for active users first (soft-delete policy)
      if (school.is_active) {
        const { data: userCount, error: countError } = await supabase
          .rpc('get_school_active_user_count', { _school_id: school.id });

        if (countError) throw countError;

        if (userCount && userCount > 0) {
          toast({
            variant: "destructive",
            title: "Cannot Disable School",
            description: `This school has ${userCount} active user(s). Please deactivate all users first.`,
          });
          return;
        }
      }

      const { error } = await supabase
        .from('schools')
        .update({ is_active: !school.is_active })
        .eq('id', school.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `School ${school.is_active ? "disabled" : "enabled"} successfully.`,
      });

      setSchools(prev =>
        prev.map(s => (s.id === school.id ? { ...s, is_active: !s.is_active } : s))
      );
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error toggling school status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update school status.",
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/sys-admin-x7k9");
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!isHost) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Host Dashboard</h1>
              <p className="text-xs text-slate-400">Multi-School Administration</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              {user?.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger
              value="schools"
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-slate-400"
            >
              <Building className="w-4 h-4 mr-2" />
              Schools ({schools.length})
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-slate-400"
            >
              <Activity className="w-4 h-4 mr-2" />
              Activity Logs
            </TabsTrigger>
          </TabsList>

          {/* Schools Tab */}
          <TabsContent value="schools" className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search schools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchSchools}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                {!showNewSchoolForm && (
                  <Button
                    onClick={() => setShowNewSchoolForm(true)}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add School
                  </Button>
                )}
              </div>
            </div>

            {/* New School Form */}
            {showNewSchoolForm && (
              <CreateSchoolForm
                onCreated={handleSchoolCreated}
                onCancel={() => setShowNewSchoolForm(false)}
              />
            )}

            {/* Schools List */}
            {isLoadingSchools ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : filteredSchools.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Building className="w-12 h-12 text-slate-600 mb-4" />
                  <p className="text-slate-400 mb-2">No schools found</p>
                  <p className="text-sm text-slate-500">
                    {schools.length === 0 
                      ? "Create your first school to get started" 
                      : "Try adjusting your search"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredSchools.map((school) => (
                  <SchoolCard
                    key={school.id}
                    school={school}
                    onUpdate={handleSchoolUpdate}
                    onToggleStatus={handleToggleSchoolStatus}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Activity Logs Tab */}
          <TabsContent value="activity" className="mt-6">
            <ActivityLogList
              logs={activityLogs}
              isLoading={isLoadingLogs}
              onRefresh={fetchActivityLogs}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default HostDashboard;
