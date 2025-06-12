import { MessagingService } from '@/lib/messaging';
import { Chat } from '@/types';
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

interface MessagingContextType {
  chats: Chat[];
  unreadCount: number;
  loading: boolean;
  markChatAsRead: (chatId: string) => Promise<void>;
  refreshChats: () => Promise<void>;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

interface MessagingProviderProps {
  children: ReactNode;
}

export function MessagingProvider({ children }: MessagingProviderProps) {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  // Fetch chats on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchChats();
      fetchUnreadCount();
      
      // Only subscribe if we don't have an active subscription
      if (!subscriptionRef.current) {
        subscriptionRef.current = subscribeToRealTimeChats();
      }
      
      return () => {
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }
      };
    } else {
      setChats([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [user]);

  // Subscribe to real-time chat updates
  const subscribeToRealTimeChats = () => {
    if (!user) return { unsubscribe: () => {} };
    
    const channel = MessagingService.subscribeToChats(user.id, (chat) => {
      // Update the chat in the list or add it if it doesn't exist
      setChats(prev => {
        const index = prev.findIndex(c => c.id === chat.id);
        if (index >= 0) {
          const newChats = [...prev];
          newChats[index] = chat;
          return newChats;
        } else {
          return [chat, ...prev];
        }
      });
      
      // Update unread count if the message is not from the current user
      if (chat.last_message_sender_id !== user.id) {
        fetchUnreadCount();
      }
    });

    return channel;
  };

  // Fetch chats
  const fetchChats = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await MessagingService.getChats(user.id);
      if (error) throw error;
      setChats(data || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!user) return;
    
    try {
      const { count, error } = await MessagingService.getUnreadMessageCount(user.id);
      if (error) throw error;
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark chat as read
  const markChatAsRead = async (chatId: string) => {
    if (!user) return;
    
    try {
      const success = await MessagingService.markMessagesAsRead(chatId, user.id);
      if (success) {
        // Update the chat in the list
        setChats(prev => 
          prev.map(chat => {
            if (chat.id === chatId) {
              // If the last message was from the other user, mark it as read
              if (chat.last_message_sender_id !== user.id) {
                return { ...chat, unread_count: 0 };
              }
            }
            return chat;
          })
        );
        // Refresh unread count
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  };

  // Refresh chats
  const refreshChats = async () => {
    await fetchChats();
    await fetchUnreadCount();
  };

  return (
    <MessagingContext.Provider value={{
      chats,
      unreadCount,
      loading,
      markChatAsRead,
      refreshChats,
    }}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
}