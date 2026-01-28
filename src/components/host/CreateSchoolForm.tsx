import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, Image } from "lucide-react";
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

interface CreateSchoolFormProps {
  onCreated: (school: School) => void;
  onCancel: () => void;
}

export function CreateSchoolForm({ onCreated, onCancel }: CreateSchoolFormProps) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    logo_url: "",
  });

  const slug = generateSlug(formData.name);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "School name is required.",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('schools')
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          address: formData.address.trim() || null,
          logo_url: formData.logo_url.trim() || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "School Created",
        description: `"${formData.name}" has been created. Public page available at /school/${slug}`,
      });

      onCreated(data as School);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error creating school:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create school.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="mb-6 bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Create New School</CardTitle>
        <CardDescription className="text-slate-400">
          Each school will have its own isolated website and data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-300">School Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="Enter school name"
            />
            {formData.name && (
              <p className="text-xs text-slate-500">
                URL Slug: <code className="text-amber-400">/school/{slug}</code>
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="school@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Phone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="+92 300 1234567"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Address</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="Enter address"
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label className="text-slate-300">
              <Image className="w-4 h-4 inline mr-2" />
              Logo URL
            </Label>
            <Input
              value={formData.logo_url}
              onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-slate-500">
              The logo will appear on the school's public page, login screens, and dashboards
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isCreating}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Create School
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
