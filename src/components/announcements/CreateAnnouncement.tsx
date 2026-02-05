import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Megaphone } from "lucide-react";

interface CreateAnnouncementProps {
  schoolId: string;
  onCreated?: () => void;
}

const audienceOptions = [
  { value: "all", label: "Everyone" },
  { value: "students", label: "Students" },
  { value: "teachers", label: "Teachers" },
  { value: "class_teachers", label: "Class Teachers" },
  { value: "coordinators", label: "Coordinators" },
  { value: "parents", label: "Parents" },
];

export default function CreateAnnouncement({ schoolId, onCreated }: CreateAnnouncementProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<string>("normal");
  const [targetAudience, setTargetAudience] = useState<string[]>(["all"]);
  const [isPinned, setIsPinned] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<string>("");
  const { toast } = useToast();

  const handleAudienceChange = (value: string, checked: boolean) => {
    if (value === "all") {
      setTargetAudience(checked ? ["all"] : []);
    } else {
      let newAudience = targetAudience.filter(a => a !== "all");
      if (checked) {
        newAudience.push(value);
      } else {
        newAudience = newAudience.filter(a => a !== value);
      }
      setTargetAudience(newAudience.length === 0 ? ["all"] : newAudience);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in both title and content.",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let expiresAt = null;
      if (expiresInDays && parseInt(expiresInDays) > 0) {
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + parseInt(expiresInDays));
        expiresAt = expireDate.toISOString();
      }

      const { error } = await supabase.from("announcements").insert({
        school_id: schoolId,
        created_by: user.id,
        title: title.trim(),
        content: content.trim(),
        priority,
        target_audience: targetAudience,
        is_pinned: isPinned,
        expires_at: expiresAt,
      });

      if (error) throw error;

      toast({
        title: "Announcement Created",
        description: "Your announcement has been published successfully.",
      });

      // Reset form
      setTitle("");
      setContent("");
      setPriority("normal");
      setTargetAudience(["all"]);
      setIsPinned(false);
      setExpiresInDays("");
      setOpen(false);

      onCreated?.();
    } catch (error) {
      console.error("Error creating announcement:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not create the announcement. Ensure title and content are filled in.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Create Announcement
          </DialogTitle>
          <DialogDescription>
            Create a new announcement for your school community.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement here..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires">Expires In (Days)</Label>
              <Input
                id="expires"
                type="number"
                min="0"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                placeholder="Never"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Target Audience</Label>
            <div className="grid grid-cols-2 gap-2">
              {audienceOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`audience-${option.value}`}
                    checked={targetAudience.includes(option.value)}
                    onCheckedChange={(checked) =>
                      handleAudienceChange(option.value, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`audience-${option.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="pinned"
              checked={isPinned}
              onCheckedChange={(checked) => setIsPinned(checked as boolean)}
            />
            <label htmlFor="pinned" className="text-sm cursor-pointer">
              Pin this announcement (appears at top)
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Publish Announcement"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
