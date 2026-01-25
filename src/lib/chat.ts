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

// Get all chat rooms for the current user
export async function getChatRooms(): Promise<ChatRoom[]> {
  try {
    const { data: memberships, error: memberError } = await supabase
      .from("chat_room_members")
      .select("room_id, last_read_at");

    if (memberError) {
      console.error("Error fetching memberships:", memberError);
      return [];
    }

    if (!memberships || memberships.length === 0) {
      return [];
    }

    const roomIds = memberships.map((m) => m.room_id);
    const { data: rooms, error: roomError } = await supabase
      .from("chat_rooms")
      .select("*")
      .in("id", roomIds)
      .eq("is_active", true)
      .order("name");

    if (roomError) {
      console.error("Error fetching rooms:", roomError);
      return [];
    }

    // Get unread counts for each room
    const roomsWithUnread = await Promise.all(
      (rooms || []).map(async (room) => {
        const membership = memberships.find((m) => m.room_id === room.id);
        const lastReadAt = membership?.last_read_at || room.created_at;

        const { count } = await supabase
          .from("chat_messages")
          .select("*", { count: "exact", head: true })
          .eq("room_id", room.id)
          .gt("created_at", lastReadAt);

        return {
          ...room,
          unread_count: count || 0,
        };
      })
    );

    return roomsWithUnread as ChatRoom[];
  } catch (error) {
    console.error("Error getting chat rooms:", error);
    return [];
  }
}

// Get messages for a chat room
export async function getChatMessages(
  roomId: string,
  limit: number = 50,
  before?: string
): Promise<ChatMessage[]> {
  try {
    let query = supabase
      .from("chat_messages")
      .select(
        `
        *,
        sender:profiles!chat_messages_sender_id_fkey(full_name, email)
      `
      )
      .eq("room_id", roomId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching messages:", error);
      return [];
    }

    // Reverse to get chronological order
    return ((data || []) as ChatMessage[]).reverse();
  } catch (error) {
    console.error("Error getting messages:", error);
    return [];
  }
}

// Send a message to a chat room
export async function sendMessage(
  roomId: string,
  message: string,
  messageType: "text" | "image" | "file" = "text",
  fileUrl?: string,
  fileName?: string
): Promise<ChatMessage | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
      .select(
        `
        *,
        sender:profiles!chat_messages_sender_id_fkey(full_name, email)
      `
      )
      .single();

    if (error) {
      console.error("Error sending message:", error);
      return null;
    }

    return data as ChatMessage;
  } catch (error) {
    console.error("Error sending message:", error);
    return null;
  }
}

// Update last read timestamp for a room
export async function markRoomAsRead(roomId: string): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("chat_room_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("room_id", roomId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error marking room as read:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error marking room as read:", error);
    return false;
  }
}

// Subscribe to new messages in a room
export function subscribeToMessages(
  roomId: string,
  onMessage: (message: ChatMessage) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`room:${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `room_id=eq.${roomId}`,
      },
      async (payload) => {
        // Fetch the full message with sender info
        const { data } = await supabase
          .from("chat_messages")
          .select(
            `
            *,
            sender:profiles!chat_messages_sender_id_fkey(full_name, email)
          `
          )
          .eq("id", payload.new.id)
          .single();

        if (data) {
          onMessage(data as ChatMessage);
        }
      }
    )
    .subscribe();

  return channel;
}

// Unsubscribe from a channel
export function unsubscribeFromMessages(channel: RealtimeChannel) {
  supabase.removeChannel(channel);
}

// Get room members
export async function getRoomMembers(roomId: string): Promise<
  Array<{
    user_id: string;
    role: string;
    full_name: string;
  }>
> {
  try {
    const { data, error } = await supabase
      .from("chat_room_members")
      .select(
        `
        user_id,
        role,
        profiles:user_id(full_name)
      `
      )
      .eq("room_id", roomId);

    if (error) {
      console.error("Error fetching room members:", error);
      return [];
    }

    return (data || []).map((m: any) => ({
      user_id: m.user_id,
      role: m.role,
      full_name: m.profiles?.full_name || "Unknown",
    }));
  } catch (error) {
    console.error("Error getting room members:", error);
    return [];
  }
}
