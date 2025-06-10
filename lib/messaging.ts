import { supabase } from './supabase';
import { Chat, Message } from '@/types';
import { storage, CACHE_KEYS } from '@/lib/storage';

export class MessagingService {
  // Get all chats for a user
  static async getChats(userId: string): Promise<{ data?: Chat[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          buyer:users!buyer_id(*),
          seller:users!seller_id(*),
          product:products(*)
        `)
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Calculate unread status for each chat
      const processedChats = data?.map(chat => ({
        ...chat,
        is_read: chat.last_message_sender_id === userId || chat.is_read
      }));
      
      return { data: processedChats };
    } catch (error: any) {
      console.error('Error fetching chats:', error);
      return { error: error.message };
    }
  }

  // Get a specific chat by ID
  static async getChatById(chatId: string): Promise<{ data?: Chat; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          buyer:users!buyer_id(*),
          seller:users!seller_id(*),
          product:products(*)
        `)
        .eq('id', chatId)
        .single();

      if (error) throw error;
      return { data };
    } catch (error: any) {
      console.error('Error fetching chat:', error);
      return { error: error.message };
    }
  }

  // Create a new chat
  static async createChat(buyerId: string, sellerId: string, productId: string): Promise<{ data?: Chat; error?: string }> {
    try {
      // Check if chat already exists
      const { data: existingChat, error: checkError } = await supabase
        .from('chats')
        .select('id')
        .eq('buyer_id', buyerId)
        .eq('seller_id', sellerId)
        .eq('product_id', productId)
        .maybeSingle();

      if (checkError) throw checkError;

      // Return existing chat if found
      if (existingChat) {
        return await MessagingService.getChatById(existingChat.id);
      }

      // Create new chat
      const { data, error } = await supabase
        .from('chats')
        .insert({
          buyer_id: buyerId,
          seller_id: sellerId,
          product_id: productId
        })
        .select()
        .single();

      if (error) throw error;
      
      // Get full chat details
      return await MessagingService.getChatById(data.id);
    } catch (error: any) {
      console.error('Error creating chat:', error);
      return { error: error.message };
    }
  }

  // Get messages for a chat
  static async getMessages(chatId: string): Promise<{ data?: Message[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users(*)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data };
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      return { error: error.message };
    }
  }

  // Send a message
  static async sendMessage(chatId: string, senderId: string, content: string, messageType: 'text' | 'image' | 'system' = 'text'): Promise<{ data?: Message; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          content,
          message_type: messageType,
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error: any) {
      console.error('Error sending message:', error);
      return { error: error.message };
    }
  }

  // Mark messages as read
  static async markMessagesAsRead(chatId: string, userId: string): Promise<boolean> {
    try {
      await supabase.rpc('mark_messages_as_read', {
        p_chat_id: chatId,
        p_user_id: userId
      });
      
      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }

  // Get unread message count
  static async getUnreadMessageCount(userId: string): Promise<{ count: number; error?: string }> {
    try {
      // Try to get from cache first
      const cachedCount = await storage.getItem(CACHE_KEYS.UNREAD_MESSAGE_COUNT);
      
      // Fetch from server
      const { data, error } = await supabase.rpc('get_unread_message_count', {
        p_user_id: userId
      });

      if (error) throw error;
      
      // Update cache
      await storage.setItem(CACHE_KEYS.UNREAD_MESSAGE_COUNT, data || 0);
      
      return { count: data || 0 };
    } catch (error: any) {
      console.error('Error getting unread message count:', error);
      // Return cached count if available, otherwise 0
      const cachedCount = await storage.getItem(CACHE_KEYS.UNREAD_MESSAGE_COUNT);
      return { count: cachedCount || 0, error: error.message };
    }
  }

  // Subscribe to new messages in a chat
  static subscribeToMessages(chatId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          // Get the full message with sender details
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users(*)
            `)
            .eq('id', payload.new.id)
            .single();
            
          if (data) {
            callback(data as Message);
          } else {
            callback(payload.new as Message);
          }
        }
      )
      .subscribe();
  }

  // Subscribe to chat updates
  static subscribeToChats(userId: string, callback: (chat: Chat) => void) {
    return supabase
      .channel(`user-chats-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
          filter: `buyer_id=eq.${userId}`,
        },
        async (payload) => {
          // Get the full chat with related data
          const { data } = await MessagingService.getChatById(payload.new.id);
          if (data) {
            callback(data);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
          filter: `seller_id=eq.${userId}`,
        },
        async (payload) => {
          // Get the full chat with related data
          const { data } = await MessagingService.getChatById(payload.new.id);
          if (data) {
            callback(data);
          }
        }
      )
      .subscribe();
  }
}