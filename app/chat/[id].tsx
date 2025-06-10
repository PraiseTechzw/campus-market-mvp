import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { MessagingService } from '@/lib/messaging';
import { NotificationService } from '@/lib/notifications';
import { Chat, Message } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function ChatScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const subscription = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    if (id && user) {
      fetchChat();
      fetchMessages();
      subscribeToMessages();
      
      // Mark messages as read when opening the chat
      MessagingService.markMessagesAsRead(id as string, user.id);
    }
    
    return () => {
      if (subscription.current) {
        subscription.current.unsubscribe();
      }
    };
  }, [id, user]);

  const fetchChat = async () => {
    try {
      const { data, error } = await MessagingService.getChatById(id as string);
      if (error) throw new Error(error);
      setChat(data);
    } catch (error: any) {
      console.error('Error fetching chat:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load chat',
      });
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await MessagingService.getMessages(id as string);
      if (error) throw new Error(error);
      setMessages(data || []);
      
      // Scroll to bottom after messages load
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!id) return;
    
    subscription.current = MessagingService.subscribeToMessages(id as string, (newMessage) => {
      // Add the new message to the list
      setMessages(prev => {
        // Check if message already exists to prevent duplicates
        const exists = prev.some(msg => msg.id === newMessage.id);
        if (exists) return prev;
        
        const updatedMessages = [...prev, newMessage];
        
        // Scroll to bottom when new message arrives
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
        
        // Mark message as read if it's not from the current user
        if (newMessage.sender_id !== user?.id) {
          MessagingService.markMessagesAsRead(id as string, user?.id || '');
        }
        
        return updatedMessages;
      });
      
      // Show notification for new messages if not from current user
      if (newMessage.sender_id !== user?.id) {
        NotificationService.sendLocalNotification(
          'New Message',
          newMessage.content,
          { chatId: id }
        );
      }
    });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user || !chat) return;

    setSending(true);
    const tempMessage = messageText;
    setMessageText('');

    try {
      const { error } = await MessagingService.sendMessage(
        id as string,
        user.id,
        tempMessage.trim()
      );

      if (error) throw new Error(error);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to send',
        text2: error.message || 'Message could not be sent',
      });
      setMessageText(tempMessage); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.sender_id === user?.id;
    const showAvatar = index === 0 || messages[index - 1].sender_id !== item.sender_id;
    const isSystemMessage = item.message_type === 'system';

    if (isSystemMessage) {
      return (
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 300 }}
          style={styles.systemMessageContainer}
        >
          <View style={[styles.systemMessage, { backgroundColor: colors.border }]}>
            <Text style={[styles.systemMessageText, { color: colors.textSecondary }]}>
              {item.content}
            </Text>
          </View>
        </MotiView>
      );
    }

    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300 }}
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {!isOwnMessage && showAvatar && (
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            {item.sender?.avatar_url ? (
              <Image source={{ uri: item.sender.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={16} color="#FFFFFF" />
            )}
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          {
            backgroundColor: isOwnMessage ? colors.primary : colors.surface,
            marginLeft: !isOwnMessage && !showAvatar ? 32 : 0,
          }
        ]}>
          <Text style={[
            styles.messageText,
            { color: isOwnMessage ? '#FFFFFF' : colors.text }
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            { color: isOwnMessage ? 'rgba(255,255,255,0.7)' : colors.textTertiary }
          ]}>
            {new Date(item.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </MotiView>
    );
  };

  if (!user) {
    router.replace('/(auth)');
    return null;
  }

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!chat) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="chatbubbles" size={64} color={colors.textTertiary} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Chat Not Found
          </Text>
          <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
            This conversation may have been removed
          </Text>
        </View>
      </View>
    );
  }

  const otherUser = chat.buyer_id === user?.id ? chat.seller : chat.buyer;

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.headerInfo}
          onPress={() => router.push(`/product/${chat.product.id}`)}
        >
          {chat.product.images && chat.product.images.length > 0 && (
            <Image 
              source={{ uri: chat.product.images[0] }} 
              style={styles.productImage}
              resizeMode="cover"
            />
          )}
          <View style={styles.headerText}>
            <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={1}>
              {chat.product.title}
            </Text>
            <Text style={[styles.sellerName, { color: colors.textSecondary }]}>
              with {otherUser.name}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => {
            // Show options menu
            Toast.show({
              type: 'info',
              text1: 'Coming Soon',
              text2: 'More options will be available soon',
            });
          }}
        >
          <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No messages yet. Start the conversation!
            </Text>
          </View>
        )}
      />

      {/* Input */}
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textTertiary}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { 
                backgroundColor: messageText.trim() ? colors.primary : colors.border,
                opacity: sending ? 0.5 : 1,
              }
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons 
                name="send" 
                size={20} 
                color={messageText.trim() ? '#FFFFFF' : colors.textTertiary} 
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  headerText: {
    flex: 1,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  sellerName: {
    fontSize: 14,
  },
  moreButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 32,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 12,
    alignSelf: 'flex-end',
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  systemMessage: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: '80%',
  },
  systemMessageText: {
    fontSize: 12,
    textAlign: 'center',
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 80,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
});