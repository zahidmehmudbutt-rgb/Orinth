import { useState, useEffect } from "react";
import { MessageSquare, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatRoom, getChatRooms } from "@/lib/chat";

interface ChatListProps {
  onSelectRoom: (room: ChatRoom) => void;
  selectedRoomId?: string;
}

export function ChatList({ onSelectRoom, selectedRoomId }: ChatListProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setIsLoading(true);
    const data = await getChatRooms();
    setRooms(data);
    setIsLoading(false);
  };

  const getTotalUnread = () => {
    return rooms.reduce((sum, room) => sum + (room.unread_count || 0), 0);
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading chats...
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="p-8 text-center">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No chat rooms available</p>
        <p className="text-sm text-muted-foreground mt-1">
          You'll see class group chats here once you're added to classes
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Group Chats
          {getTotalUnread() > 0 && (
            <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              {getTotalUnread()}
            </span>
          )}
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="divide-y">
          {rooms.map((room) => (
            <div
              key={room.id}
              onClick={() => onSelectRoom(room)}
              className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                selectedRoomId === room.id ? "bg-muted" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">{room.name}</p>
                    {(room.unread_count || 0) > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                        {room.unread_count}
                      </span>
                    )}
                  </div>
                  {room.description && (
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {room.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
