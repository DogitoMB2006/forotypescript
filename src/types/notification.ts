export interface Notification {
  id: string;
  type: 'comment' | 'like' | 'reply' | 'mention';
  userId: string;
  triggeredBy: string;
  triggeredByUsername: string;
  triggeredByDisplayName: string;
  triggeredByProfileImage?: string;
  postId?: string;
  commentId?: string;
  parentCommentId?: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationToast {
  id: string;
  type: 'comment' | 'like' | 'reply' | 'mention';
  title: string;
  message: string;
  avatar?: string;
  postId?: string;
  commentId?: string;
  timestamp: Date;
}