import { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChatList } from "./ChatList";
import { ChatRoom } from "./ChatRoom";
import { ChatRoom as ChatRoomType } from "@/lib/chat";

interface GroupChatProps {
  className?: string;
  triggerClassName?: string;
}

export function GroupChat({ className, triggerClassName }: GroupChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomType | null>(null);

  const handleSelectRoom = (room: ChatRoomType) => {
    setSelectedRoom(room);
  };

  const handleBack = () => {
    setSelectedRoom(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className={triggerClassName}>
          <MessageSquare className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className={`max-w-2xl h-[600px] p-0 gap-0 ${className}`}>
        <DialogHeader className="sr-only">
          <DialogTitle>Group Chat</DialogTitle>
        </DialogHeader>

        <div className="flex h-full">
          {/* Room list - hidden on mobile when room is selected */}
          <div
            className={`w-full md:w-80 border-r h-full ${
              selectedRoom ? "hidden md:block" : ""
            }`}
          >
            <ChatList
              onSelectRoom={handleSelectRoom}
              selectedRoomId={selectedRoom?.id}
            />
          </div>

          {/* Chat room */}
          <div
            className={`flex-1 h-full ${
              !selectedRoom ? "hidden md:flex" : ""
            }`}
          >
            {selectedRoom ? (
              <ChatRoom
                room={selectedRoom}
                onBack={handleBack}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <MessageSquare className="w-16 h-16 text-muted-foreground opacity-30 mb-4" />
                <p className="text-muted-foreground">
                  Select a chat to start messaging
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Standalone chat page component for full-page chat view
export function GroupChatPage() {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomType | null>(null);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background border rounded-lg overflow-hidden">
      {/* Room list */}
      <div
        className={`w-full md:w-80 border-r ${
          selectedRoom ? "hidden md:block" : ""
        }`}
      >
        <ChatList
          onSelectRoom={setSelectedRoom}
          selectedRoomId={selectedRoom?.id}
        />
      </div>

      {/* Chat room */}
      <div
        className={`flex-1 ${!selectedRoom ? "hidden md:flex" : ""}`}
      >
        {selectedRoom ? (
          <ChatRoom
            room={selectedRoom}
            onBack={() => setSelectedRoom(null)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageSquare className="w-16 h-16 text-muted-foreground opacity-30 mb-4" />
            <p className="text-muted-foreground">
              Select a chat to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
