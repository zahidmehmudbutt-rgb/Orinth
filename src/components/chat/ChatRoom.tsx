import { useState, useEffect, useRef, useCallback } from "react";
import type { CSSProperties, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { getDateLocale } from "@/lib/utils/date-locale";
import { Send, Paperclip, Image, X, Users, ArrowLeft } from "lucide-react";
import { List, useListRef } from "react-window";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ChatMessage,
  ChatRoom as ChatRoomType,
  getChatMessages,
  sendMessage,
  markRoomAsRead,
  subscribeToMessages,
  unsubscribeFromMessages,
  getRoomMembers,
} from "@/lib/chat";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { RealtimeChannel } from "@supabase/supabase-js";

// Row component for virtualized chat message list (react-window v2 API)
interface ChatMessageRowProps {
  messages: ChatMessage[];
  currentUserId: string | null;
  getInitials: (name: string) => string;
  formatTime: (dateString: string) => string;
}

function ChatMessageRow(props: { index: number; style: CSSProperties; ariaAttributes: unknown } & ChatMessageRowProps): ReactElement {
  const { index, style, messages, currentUserId, getInitials, formatTime } = props;
  const message = messages[index];
  const isOwn = message.sender_id === currentUserId;
  const showAvatar =
    index === 0 ||
    messages[index - 1].sender_id !== message.sender_id;

  return (
    <div style={{ ...style, padding: "4px 16px" }}>
      <div
        className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
      >
        {!isOwn && showAvatar ? (
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="text-xs">
              {getInitials(message.sender?.full_name || "?")}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-8" />
        )}

        <div
          className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}
        >
          {!isOwn && showAvatar && (
            <p className="text-xs text-muted-foreground mb-1 ml-1">
              {message.sender?.full_name || "Unknown"}
            </p>
          )}
          <div
            className={`rounded-2xl px-4 py-2 ${
              isOwn
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-background border rounded-bl-md"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.message}
            </p>
          </div>
          <p
            className={`text-xs text-muted-foreground mt-1 ${
              isOwn ? "text-right mr-1" : "ml-1"
            }`}
          >
            {formatTime(message.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}

interface ChatRoomProps {
  room: ChatRoomType;
  onBack?: () => void;
}

export function ChatRoom({ room, onBack }: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [members, setMembers] = useState<Array<{ user_id: string; role: string; full_name: string }>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualListRef = useListRef();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (user) setCurrentUserId(user.id);

      const msgs = await getChatMessages(room.id);
      if (!mounted) return;
      setMessages(msgs);
      setIsLoading(false);

      const memberData = await getRoomMembers(room.id);
      if (!mounted) return;
      setMembers(memberData);
    };

    setIsLoading(true);
    init();
    markRoomAsRead(room.id);

    // Subscribe to new messages
    channelRef.current = subscribeToMessages(room.id, (message) => {
      if (!mounted) return;
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    return () => {
      mounted = false;
      if (channelRef.current) {
        unsubscribeFromMessages(channelRef.current);
      }
    };
  }, [room.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (virtualListRef.current && messages.length > 20) {
        virtualListRef.current.scrollToRow({ index: messages.length - 1, align: "end" });
      } else if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  }, [messages.length, virtualListRef]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const message = newMessage.trim();
    setNewMessage("");

    const sent = await sendMessage(room.id, message);
    if (!sent) {
      setNewMessage(message); // Restore message if failed
    }
    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0] || "")
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString(getDateLocale(), { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "class_teacher":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "teacher":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "student":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "parent":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h2 className="font-semibold text-foreground">{room.name}</h2>
            <p className="text-xs text-muted-foreground">
              {t("chat.members", { count: members.length })}
            </p>
          </div>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Users className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{t("chat.groupMembers")}</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-100px)] mt-4">
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>
                        {getInitials(member.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{member.full_name}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(
                          member.role
                        )}`}
                      >
                        {member.role.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* Messages */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center bg-muted/30">
          <p className="text-muted-foreground">{t("chat.loadingMessages")}</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-muted/30 text-center">
          <p className="text-muted-foreground">{t("chat.noMessages")}</p>
          <p className="text-sm text-muted-foreground">
            {t("chat.beFirst")}
          </p>
        </div>
      ) : messages.length > 20 ? (
        <div className="flex-1 bg-muted/30" style={{ height: 400 }}>
          <List<ChatMessageRowProps>
            listRef={virtualListRef}
            rowCount={messages.length}
            rowHeight={72}
            rowComponent={ChatMessageRow}
            rowProps={{ messages, currentUserId, getInitials, formatTime }}
          />
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30"
        >
          {messages.map((message, index) => {
            const isOwn = message.sender_id === currentUserId;
            const showAvatar =
              index === 0 ||
              messages[index - 1].sender_id !== message.sender_id;

            return (
              <div
                key={message.id}
                className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
              >
                {!isOwn && showAvatar ? (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {getInitials(message.sender?.full_name || "?")}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-8" />
                )}

                <div
                  className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}
                >
                  {!isOwn && showAvatar && (
                    <p className="text-xs text-muted-foreground mb-1 ml-1">
                      {message.sender?.full_name || "Unknown"}
                    </p>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-background border rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.message}
                    </p>
                  </div>
                  <p
                    className={`text-xs text-muted-foreground mt-1 ${
                      isOwn ? "text-right mr-1" : "ml-1"
                    }`}
                  >
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t("chat.typeMessage")}
            className="flex-1"
            disabled={isSending}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
