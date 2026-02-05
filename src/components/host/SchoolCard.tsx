import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const [editData, setEditData] = useState(school);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  const slug = generateSlug(school.name);
  const publicUrl = `/school/${slug}`;

  const handleSave = async () => {
    if (!editData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "School name is required.",
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
        title: "Success",
        description: "School updated successfully.",
      });

      onUpdate({ ...school, ...editData });
      setIsEditing(false);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error updating school:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update school details. Check your connection and try again.",
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
      title: "Copied!",
      description: "Public page URL copied to clipboard.",
    });
  };

  if (isEditing) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">School Name *</Label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Email</Label>
              <Input
                type="email"
                value={editData.email || ""}
                onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Phone</Label>
              <Input
                value={editData.phone || ""}
                onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Address</Label>
              <Input
                value={editData.address || ""}
                onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-slate-300">
                <Image className="w-4 h-4 inline mr-2" />
                Logo URL
              </Label>
              <Input
                value={editData.logo_url || ""}
                onChange={(e) => setEditData(prev => ({ ...prev, logo_url: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-slate-500">Enter a direct URL to the school logo image</p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setEditData(school);
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUpdating}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {school.logo_url ? (
              <img
                src={school.logo_url}
                alt={school.name}
                className="w-12 h-12 rounded-lg object-contain bg-white p-1"
              />
            ) : (
              <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-slate-400" />
              </div>
            )}
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
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-500">Public URL:</span>
                  <code className="text-xs bg-slate-700 px-2 py-0.5 rounded text-amber-400">
                    /school/{slug}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyPublicUrl}
                    className="h-6 w-6 p-0 text-slate-400 hover:text-white"
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
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              View Page
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
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
                  {school.is_active ? "Disable" : "Enable"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-800 border-slate-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">
                    {school.is_active ? "Disable" : "Enable"} School?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    {school.is_active
                      ? "This will prevent all users from logging in to this school. The school can be re-enabled later."
                      : "This will allow users to access this school again."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-700">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onToggleStatus(school)}
                    className={school.is_active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                  >
                    {school.is_active ? "Disable" : "Enable"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/sys-admin-x7k9/school/${school.id}/principal`)}
              className="border-slate-600 text-amber-400 hover:bg-amber-500/10"
            >
              <Crown className="w-4 h-4 mr-1" />
              Principal
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
