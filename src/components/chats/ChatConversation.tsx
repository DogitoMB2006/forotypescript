const handleSendMessage = async (content: stringimport type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import { getChatMessages, sendMessage, markMessagesAsRead, editMessage, deleteMessage } from '../../services/chatService';
import { getUserProfile } from '../../services/userService';
import type { ChatMessage } from '../../types/chat';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

const ChatConversation: FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId || !user?.uid) return;

    const unsubscribe = getChatMessages(chatId, (newMessages) => {
      console.log('ChatConversation: Messages received:', newMessages.length);
      setMessages(newMessages);
      setLoading(false);

      // Auto scroll to bottom on new messages
      setTimeout(() => {
        scrollToBottom();
      }, 100);

      // Mark messages as read
      if (newMessages.length > 0) {
        markMessagesAsRead(chatId, user.uid);
      }
    });

    return unsubscribe;
  }, [chatId, user?.uid]);

  useEffect(() => {
    const loadOtherUserFromChat = async () => {
      if (!chatId || !user?.uid) return;

      try {
        console.log('ChatConversation: Loading chat data for:', chatId);
        const chatRef = doc(db, 'chats', chatId);
        const chatDoc = await getDoc(chatRef);
        
        if (chatDoc.exists()) {
          const chatData = chatDoc.data();
          console.log('ChatConversation: Chat data loaded:', chatData);
          
          const otherUserId = chatData.participants.find((id: string) => id !== user.uid);
          if (otherUserId && chatData.participantDetails[otherUserId]) {
            const otherUserDetails = chatData.participantDetails[otherUserId];
            console.log('ChatConversation: Other user details:', otherUserDetails);
            
            setOtherUser({
              id: otherUserId,
              username: otherUserDetails.username,
              displayName: otherUserDetails.displayName,
              profileImage: otherUserDetails.profileImage,
              isOnline: false, // TODO: Implement online status
              lastSeen: otherUserDetails.lastSeen?.toDate() || new Date()
            });
          } else {
            console.error('ChatConversation: No other user found in chat');
          }
        } else {
          console.error('ChatConversation: Chat not found');
        }
      } catch (error) {
        console.error('Error loading chat data:', error);
      } finally {
        setChatLoading(false);
      }
    };

    loadOtherUserFromChat();
  }, [chatId, user?.uid]);

  useEffect(() => {
    const loadOtherUserFromMessages = async () => {
      if (!chatId || !user?.uid || messages.length === 0 || otherUser) return;

      // Solo como fallback si no se pudo cargar desde el chat
      const otherUserId = messages.find(msg => msg.senderId !== user.uid)?.senderId;
      if (!otherUserId) return;

      try {
        const profile = await getUserProfile(otherUserId);
        if (profile) {
          setOtherUser({
            id: otherUserId,
            username: profile.username,
            displayName: profile.displayName,
            profileImage: profile.profileImageUrl,
            isOnline: false,
            lastSeen: new Date()
          });
        }
      } catch (error) {
        console.error('Error loading other user from messages:', error);
      }
    };

    loadOtherUserFromMessages();
  }, [messages, chatId, user?.uid, otherUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string, type: 'text' | 'image' | 'audio' = 'text', fileUrl?: string) => {
    if (!chatId || !user?.uid || !userProfile) return;

    setSending(true);
    try {
      await sendMessage(chatId, user.uid, userProfile, content, type, fileUrl);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      console.log('ChatConversation: Editing message', messageId, 'with content:', newContent);
      await editMessage(messageId, newContent);
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      console.log('ChatConversation: Deleting message', messageId);
      await deleteMessage(messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  };

  const handleBack = () => {
    navigate('/chats');
  };

  const shouldShowAvatar = (message: ChatMessage, index: number) => {
    if (message.senderId === user?.uid) return false;
    if (index === messages.length - 1) return true;
    
    const nextMessage = messages[index + 1];
    return !nextMessage || nextMessage.senderId !== message.senderId;
  };

  const shouldShowTimestamp = (message: ChatMessage, index: number) => {
    if (index === 0) return true;
    
    const prevMessage = messages[index - 1];
    const timeDiff = message.createdAt.getTime() - prevMessage.createdAt.getTime();
    
    // Show timestamp if more than 1 hour difference
    return timeDiff > 3600000;
  };

  if (loading || chatLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando conversación...</p>
        </div>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <p className="text-gray-400">No se pudo cargar la conversación</p>
          <button 
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Volver a chats
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Header */}
      <ChatHeader otherUser={otherUser} onBack={handleBack} />

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                ¡Comienza la conversación!
              </h3>
              <p className="text-gray-400 text-sm sm:text-base">
                Envía un mensaje a {otherUser.displayName}
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div key={message.id}>
                {shouldShowTimestamp(message, index) && (
                  <div className="flex items-center justify-center my-4 sm:my-6">
                    <span className="bg-gray-800 text-gray-400 text-xs px-3 py-1 rounded-full">
                      {message.createdAt.toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                <MessageBubble
                  message={message}
                  isOwn={message.senderId === user?.uid}
                  showAvatar={shouldShowAvatar(message, index)}
                  showTimestamp={false}
                  onEdit={handleEditMessage}
                  onDelete={handleDeleteMessage}
                />
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={sending}
        placeholder={`Mensaje a ${otherUser.displayName}...`}
        chatId={chatId!}
      />
    </div>
  );
};

export default ChatConversation;