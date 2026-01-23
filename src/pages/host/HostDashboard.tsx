import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Shield,
  Building,
  Users,
  Activity,
  Plus,
  LogOut,
  Edit,
  Power,
  Crown,
  Loader2,
  Search,
  RefreshCw,
} from "lucide-react";

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

  // New school form
  const [showNewSchoolForm, setShowNewSchoolForm] = useState(false);
  const [newSchool, setNewSchool] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [isCreatingSchool, setIsCreatingSchool] = useState(false);

  // Edit school
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [isUpdatingSchool, setIsUpdatingSchool] = useState(false);

  useEffect(() => {
    if (!loading && !isHost) {
      navigate("/host/login");
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
      console.error('Error fetching schools:', error);
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
      console.error('Error fetching activity logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleCreateSchool = async () => {
    if (!newSchool.name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "School name is required.",
      });
      return;
    }

    setIsCreatingSchool(true);
    try {
      const { data, error } = await supabase
        .from('schools')
        .insert({
          name: newSchool.name.trim(),
          email: newSchool.email.trim() || null,
          phone: newSchool.phone.trim() || null,
          address: newSchool.address.trim() || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `School "${newSchool.name}" created successfully.`,
      });

      setSchools(prev => [data as School, ...prev]);
      setNewSchool({ name: "", email: "", phone: "", address: "" });
      setShowNewSchoolForm(false);
    } catch (error) {
      console.error('Error creating school:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create school.",
      });
    } finally {
      setIsCreatingSchool(false);
    }
  };

  const handleUpdateSchool = async () => {
    if (!editingSchool) return;

    setIsUpdatingSchool(true);
    try {
      const { error } = await supabase
        .from('schools')
        .update({
          name: editingSchool.name,
          email: editingSchool.email,
          phone: editingSchool.phone,
          address: editingSchool.address,
        })
        .eq('id', editingSchool.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "School updated successfully.",
      });

      setSchools(prev =>
        prev.map(s => (s.id === editingSchool.id ? editingSchool : s))
      );
      setEditingSchool(null);
    } catch (error) {
      console.error('Error updating school:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update school.",
      });
    } finally {
      setIsUpdatingSchool(false);
    }
  };

  const handleToggleSchoolStatus = async (school: School) => {
    try {
      const { error } = await supabase
        .from('schools')
        .update({ is_active: !school.is_active })
        .eq('id', school.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `School ${school.is_active ? "deactivated" : "activated"} successfully.`,
      });

      setSchools(prev =>
        prev.map(s => (s.id === school.id ? { ...s, is_active: !s.is_active } : s))
      );
    } catch (error) {
      console.error('Error toggling school status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update school status.",
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/host/login");
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
              <p className="text-xs text-slate-400">System Administration</p>
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
              Schools
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
                <Button
                  onClick={() => setShowNewSchoolForm(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add School
                </Button>
              </div>
            </div>

            {/* New School Form */}
            {showNewSchoolForm && (
              <Card className="mb-6 bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Create New School</CardTitle>
                  <CardDescription className="text-slate-400">
                    Enter the details for the new school
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">School Name *</Label>
                      <Input
                        value={newSchool.name}
                        onChange={(e) => setNewSchool(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Enter school name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Email</Label>
                      <Input
                        type="email"
                        value={newSchool.email}
                        onChange={(e) => setNewSchool(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="school@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Phone</Label>
                      <Input
                        value={newSchool.phone}
                        onChange={(e) => setNewSchool(prev => ({ ...prev, phone: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="+92 300 1234567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Address</Label>
                      <Input
                        value={newSchool.address}
                        onChange={(e) => setNewSchool(prev => ({ ...prev, address: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Enter address"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewSchoolForm(false);
                        setNewSchool({ name: "", email: "", phone: "", address: "" });
                      }}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateSchool}
                      disabled={isCreatingSchool}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      {isCreatingSchool ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Create School
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
                  <p className="text-slate-400">No schools found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredSchools.map((school) => (
                  <Card key={school.id} className="bg-slate-800 border-slate-700">
                    <CardContent className="p-6">
                      {editingSchool?.id === school.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-slate-300">School Name</Label>
                              <Input
                                value={editingSchool.name}
                                onChange={(e) => setEditingSchool(prev => prev ? { ...prev, name: e.target.value } : null)}
                                className="bg-slate-700 border-slate-600 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">Email</Label>
                              <Input
                                value={editingSchool.email || ""}
                                onChange={(e) => setEditingSchool(prev => prev ? { ...prev, email: e.target.value } : null)}
                                className="bg-slate-700 border-slate-600 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">Phone</Label>
                              <Input
                                value={editingSchool.phone || ""}
                                onChange={(e) => setEditingSchool(prev => prev ? { ...prev, phone: e.target.value } : null)}
                                className="bg-slate-700 border-slate-600 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">Address</Label>
                              <Input
                                value={editingSchool.address || ""}
                                onChange={(e) => setEditingSchool(prev => prev ? { ...prev, address: e.target.value } : null)}
                                className="bg-slate-700 border-slate-600 text-white"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setEditingSchool(null)}
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleUpdateSchool}
                              disabled={isUpdatingSchool}
                              className="bg-amber-600 hover:bg-amber-700"
                            >
                              {isUpdatingSchool ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : null}
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
                              <Building className="w-6 h-6 text-slate-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-medium text-white">{school.name}</h3>
                                <Badge
                                  variant={school.is_active ? "default" : "secondary"}
                                  className={school.is_active ? "bg-green-600" : "bg-slate-600"}
                                >
                                  {school.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-sm text-slate-400">
                                {school.email && <p>Email: {school.email}</p>}
                                {school.phone && <p>Phone: {school.phone}</p>}
                                {school.address && <p>Address: {school.address}</p>}
                                <p>Created: {new Date(school.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingSchool(school)}
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`border-slate-600 ${
                                    school.is_active
                                      ? "text-red-400 hover:bg-red-500/10"
                                      : "text-green-400 hover:bg-green-500/10"
                                  }`}
                                >
                                  <Power className="w-4 h-4 mr-1" />
                                  {school.is_active ? "Deactivate" : "Activate"}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-slate-800 border-slate-700">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">
                                    {school.is_active ? "Deactivate" : "Activate"} School?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-slate-400">
                                    {school.is_active
                                      ? "This will prevent all users from accessing this school. The school can be reactivated later."
                                      : "This will allow users to access this school again."}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-700">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleToggleSchoolStatus(school)}
                                    className={school.is_active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                                  >
                                    {school.is_active ? "Deactivate" : "Activate"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/host/schools/${school.id}/principal`)}
                              className="border-slate-600 text-amber-400 hover:bg-amber-500/10"
                            >
                              <Crown className="w-4 h-4 mr-1" />
                              Principal
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Activity Logs Tab */}
          <TabsContent value="activity" className="mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">System Activity Logs</CardTitle>
                    <CardDescription className="text-slate-400">
                      View all system-wide activity logs
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchActivityLogs}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingLogs ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  </div>
                ) : activityLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Activity className="w-12 h-12 text-slate-600 mb-4" />
                    <p className="text-slate-400">No activity logs found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activityLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 p-4 bg-slate-700/50 rounded-lg"
                      >
                        <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Activity className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white">{log.action}</span>
                            <Badge variant="outline" className="text-slate-400 border-slate-600">
                              {log.entity_type}
                            </Badge>
                          </div>
                          {log.details && (
                            <p className="text-sm text-slate-400">
                              {JSON.stringify(log.details)}
                            </p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default HostDashboard;
