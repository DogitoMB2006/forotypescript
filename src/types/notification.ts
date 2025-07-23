export interface Notification {
  id: string;
  type: 'comment' | 'like' | 'reply' | 'mention' | 'message';
  userId: string;
  title: string;
  message: string;
  triggeredByUserId: string;
  triggeredByUsername: string;
  triggeredByDisplayName: string;
  triggeredByProfileImage?: string;
  postId?: string;
  commentId?: string;
  parentCommentId?: string;
  data?: {
    chatId?: string;
    messageId?: string;
    messageType?: string;
    [key: string]: any;
  };
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationToast {
  id: string;
  type: 'comment' | 'like' | 'reply' | 'mention' | 'message';
  title: string;
  message: string;
  avatar?: string;
  postId?: string;
  commentId?: string;
  chatId?: string;
  timestamp: Date;
}