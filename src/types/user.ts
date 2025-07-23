export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  bio?: string;
  profileImageUrl?: string;
  bannerImageUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
  defaultBadgeId?: string;
}

export interface User {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface UserStats {
  userId: string;
  postsCount: number;
  commentsCount: number;
  likesReceived: number;
  likesGiven: number;
  joinedAt: Date;
  lastActivity: Date;
}

export interface UserSettings {
  userId: string;
  notifications: {
    email: boolean;
    push: boolean;
    newMessages: boolean;
    newFollowers: boolean;
    postLikes: boolean;
    commentReplies: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    showEmail: boolean;
    showLastSeen: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

export interface UserSearchResult {
  uid: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  bio?: string;
}