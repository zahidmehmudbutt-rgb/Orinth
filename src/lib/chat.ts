// Chat functionality - Placeholder implementation
// NOTE: Chat tables (chat_rooms, chat_room_members, chat_messages) are not yet created in the database
// This file provides type definitions and stub functions for future implementation

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

// Stub implementations - Chat feature requires database tables to be created
// These functions return empty results until chat tables are added to the database

export async function getChatRooms(): Promise<ChatRoom[]> {
  console.warn("Chat feature not yet implemented - chat tables not created");
  return [];
}

export async function getChatMessages(
  _roomId: string,
  _limit: number = 50,
  _before?: string
): Promise<ChatMessage[]> {
  console.warn("Chat feature not yet implemented - chat tables not created");
  return [];
}

export async function sendMessage(
  _roomId: string,
  _message: string,
  _messageType: "text" | "image" | "file" = "text",
  _fileUrl?: string,
  _fileName?: string
): Promise<ChatMessage | null> {
  console.warn("Chat feature not yet implemented - chat tables not created");
  return null;
}

export async function markRoomAsRead(_roomId: string): Promise<boolean> {
  console.warn("Chat feature not yet implemented - chat tables not created");
  return false;
}

export function subscribeToMessages(
  _roomId: string,
  _onMessage: (message: ChatMessage) => void
): RealtimeChannel | null {
  console.warn("Chat feature not yet implemented - chat tables not created");
  return null;
}

export function unsubscribeFromMessages(channel: RealtimeChannel | null) {
  if (channel) {
    console.warn("Chat feature not yet implemented");
  }
}

export async function getRoomMembers(_roomId: string): Promise<
  Array<{
    user_id: string;
    role: string;
    full_name: string;
  }>
> {
  console.warn("Chat feature not yet implemented - chat tables not created");
  return [];
}
