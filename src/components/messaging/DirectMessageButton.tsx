import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Loader2, Send } from "lucide-react";
type ChatRole = "teacher" | "class_teacher" | "student" | "parent";

interface DirectMessageButtonProps {
  recipientId: string;
  recipientName: string;
  studentName?: string;
  classId: string;
  schoolId: string;
  senderRole: ChatRole;
  recipientRole: ChatRole;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
}

export function DirectMessageButton({
  recipientId,
  recipientName,
  studentName,
  classId,
  schoolId,
  senderRole,
  recipientRole,
  variant = "outline",
  size = "sm",
}: DirectMessageButtonProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if a direct chat room already exists between these two users
      const { data: existingRooms } = await supabase
        .from("chat_room_members")
        .select("room_id")
        .eq("user_id", user.id);

      let roomId: string | null = null;

      if (existingRooms) {
        for (const room of existingRooms) {
          const { data: otherMember } = await supabase
            .from("chat_room_members")
            .select("user_id")
            .eq("room_id", room.room_id)
            .eq("user_id", recipientId)
            .single();

          if (otherMember) {
            // Check it's a direct (2-member) room
            const { count } = await supabase
              .from("chat_room_members")
              .select("*", { count: "exact", head: true })
              .eq("room_id", room.room_id);

            if (count === 2) {
              roomId = room.room_id;
              break;
            }
          }
        }
      }

      // Create new room if none exists
      if (!roomId) {
        const roomName = studentName
          ? `${t("directMessage.about")} ${studentName}`
          : `${t("directMessage.directChat")}`;

        const { data: newRoom, error: roomError } = await supabase
          .from("chat_rooms")
          .insert({
            name: roomName,
            class_id: classId,
            school_id: schoolId,
            description: `Direct message: ${recipientName}`,
          })
          .select("id")
          .single();

        if (roomError || !newRoom) throw roomError || new Error("Failed to create room");
        roomId = newRoom.id;

        // Add both users as members with their roles
        const { error: senderMemberError } = await supabase
          .from("chat_room_members")
          .insert({ room_id: roomId, user_id: user.id, role: senderRole });

        if (senderMemberError) throw senderMemberError;

        const { error: recipientMemberError } = await supabase
          .from("chat_room_members")
          .insert({ room_id: roomId, user_id: recipientId, role: recipientRole });

        if (recipientMemberError) throw recipientMemberError;
      }

      // Send message
      const { error: msgError } = await supabase
        .from("chat_messages")
        .insert({
          room_id: roomId,
          sender_id: user.id,
          message: message.trim(),
        });

      if (msgError) throw msgError;

      // Update room's updated_at timestamp
      await supabase
        .from("chat_rooms")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", roomId);

      toast({
        title: t("directMessage.sent"),
        description: t("directMessage.sentDesc", { name: recipientName }),
      });

      setMessage("");
      setOpen(false);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Direct message error:", error);
      toast({
        variant: "destructive",
        title: t("directMessage.error"),
        description: t("directMessage.errorDesc"),
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <MessageSquare className="w-4 h-4 mr-2" />
          {t("directMessage.message")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t("directMessage.sendTo", { name: recipientName })}
          </DialogTitle>
          <DialogDescription>
            {studentName
              ? t("directMessage.aboutStudent", { student: studentName })
              : t("directMessage.directDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("directMessage.placeholder")}
            rows={4}
            maxLength={2000}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("directMessage.cancel")}
            </Button>
            <Button onClick={handleSend} disabled={sending || !message.trim()}>
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("directMessage.sending")}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t("directMessage.send")}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
