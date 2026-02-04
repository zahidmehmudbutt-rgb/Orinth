// Chat functionality for group class chats
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface ChatRoom {
  id: string;
  class_id: string;
  school_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  unread_count?: number;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  message_type: "text" | "image" | "file" | "system";
  file_url: string | null;
  file_name: string | null;
  is_deleted: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    email: string | null;
  };
}

export interface ChatRoomMember {
  id: string;
  room_id: string;
  user_id: string;
  role: "teacher" | "class_teacher" | "student" | "parent";
  joined_at: string;
  last_read_at: string;
}

/**
 * Get all chat rooms the current user is a member of
 */
export async function getChatRooms(): Promise<ChatRoom[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get rooms where user is a member
    const { data: memberships, error: memberError } = await supabase
      .from("chat_room_members")
      .select("room_id, last_read_at")
      .eq("user_id", user.id);

    if (memberError || !memberships || memberships.length === 0) {
      if (import.meta.env.DEV && memberError) {
        console.error("Error fetching chat memberships:", memberError);
      }
      return [];
    }

    const roomIds = memberships.map(m => m.room_id);
    const lastReadMap = new Map(memberships.map(m => [m.room_id, m.last_read_at]));

    // Get room details
    const { data: rooms, error: roomError } = await supabase
      .from("chat_rooms")
      .select("*")
      .in("id", roomIds)
      .eq("is_active", true)
      .order("updated_at", { ascending: false });

    if (roomError || !rooms) {
      if (import.meta.env.DEV) {
        console.error("Error fetching chat rooms:", roomError);
      }
      return [];
    }

    // Get unread counts for each room
    const roomsWithUnread = await Promise.all(
      rooms.map(async (room) => {
        const lastReadAt = lastReadMap.get(room.id);
        let unreadCount = 0;

        if (lastReadAt) {
          const { count } = await supabase
            .from("chat_messages")
            .select("id", { count: "exact", head: true })
            .eq("room_id", room.id)
            .gt("created_at", lastReadAt)
            .neq("sender_id", user.id);

          unreadCount = count || 0;
        }

        return {
          ...room,
          unread_count: unreadCount,
        } as ChatRoom;
      })
    );

    return roomsWithUnread;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error in getChatRooms:", error);
    }
    return [];
  }
}

/**
 * Get messages for a specific chat room
 */
export async function getChatMessages(
  roomId: string,
  limit: number = 50,
  before?: string
): Promise<ChatMessage[]> {
  try {
    let query = supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", roomId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data: messages, error } = await query;

    if (error || !messages) {
      if (import.meta.env.DEV) {
        console.error("Error fetching messages:", error);
      }
      return [];
    }

    // Get sender profiles
    const senderIds = [...new Set(messages.map(m => m.sender_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", senderIds);

    const profileMap = new Map(
      (profiles || []).map(p => [p.id, { full_name: p.full_name, email: p.email }])
    );

    return messages.map(msg => ({
      ...msg,
      message_type: msg.message_type as ChatMessage["message_type"],
      sender: profileMap.get(msg.sender_id) || { full_name: "Unknown", email: null },
    }));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error in getChatMessages:", error);
    }
    return [];
  }
}

/**
 * Send a message to a chat room
 */
export async function sendMessage(
  roomId: string,
  message: string,
  messageType: "text" | "image" | "file" = "text",
  fileUrl?: string,
  fileName?: string
): Promise<ChatMessage | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        room_id: roomId,
        sender_id: user.id,
        message,
        message_type: messageType,
        file_url: fileUrl || null,
        file_name: fileName || null,
      })
      .select()
      .single();

    if (error) {
      if (import.meta.env.DEV) {
        console.error("Error sending message:", error);
      }
      return null;
    }

    // Update room's updated_at timestamp
    await supabase
      .from("chat_rooms")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", roomId);

    // Get sender profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    return {
      ...data,
      message_type: data.message_type as ChatMessage["message_type"],
      sender: profile || { full_name: "Unknown", email: null },
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error in sendMessage:", error);
    }
    return null;
  }
}

/**
 * Mark all messages in a room as read
 */
export async function markRoomAsRead(roomId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("chat_room_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("room_id", roomId)
      .eq("user_id", user.id);

    if (error) {
      if (import.meta.env.DEV) {
        console.error("Error marking room as read:", error);
      }
      return false;
    }

    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error in markRoomAsRead:", error);
    }
    return false;
  }
}

/**
 * Subscribe to new messages in a room
 */
export function subscribeToMessages(
  roomId: string,
  onMessage: (message: ChatMessage) => void
): RealtimeChannel | null {
  try {
    const channel = supabase
      .channel(`chat-room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage;

          // Get sender profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", newMessage.sender_id)
            .single();

          onMessage({
            ...newMessage,
            sender: profile || { full_name: "Unknown", email: null },
          });
        }
      )
      .subscribe();

    return channel;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error subscribing to messages:", error);
    }
    return null;
  }
}

/**
 * Unsubscribe from message updates
 */
export function unsubscribeFromMessages(channel: RealtimeChannel | null) {
  if (channel) {
    supabase.removeChannel(channel);
  }
}

/**
 * Get members of a chat room
 */
export async function getRoomMembers(roomId: string): Promise<
  Array<{
    user_id: string;
    role: string;
    full_name: string;
  }>
> {
  try {
    const { data: members, error } = await supabase
      .from("chat_room_members")
      .select("user_id, role")
      .eq("room_id", roomId);

    if (error || !members) {
      if (import.meta.env.DEV) {
        console.error("Error fetching room members:", error);
      }
      return [];
    }

    // Get profiles for all members
    const userIds = members.map(m => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    const profileMap = new Map(
      (profiles || []).map(p => [p.id, p.full_name])
    );

    return members.map(m => ({
      user_id: m.user_id,
      role: m.role,
      full_name: profileMap.get(m.user_id) || "Unknown",
    }));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error in getRoomMembers:", error);
    }
    return [];
  }
}
