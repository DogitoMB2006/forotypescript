import { doc, updateDoc, arrayUnion, arrayRemove, increment, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { createNotification } from './notificationService';

export interface LikeResult {
  liked: boolean;
  totalLikes: number;
}

export const togglePostLike = async (postId: string, userId: string): Promise<LikeResult> => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      throw new Error('Post not found');
    }

    const postData = postSnap.data();
    const likedBy = postData.likedBy || [];
    const isCurrentlyLiked = likedBy.includes(userId);

    if (isCurrentlyLiked) {
      await updateDoc(postRef, {
        likedBy: arrayRemove(userId),
        likes: increment(-1)
      });

      return {
        liked: false,
        totalLikes: Math.max(0, (postData.likes || 0) - 1)
      };
    } else {
      await updateDoc(postRef, {
        likedBy: arrayUnion(userId),
        likes: increment(1)
      });

      if (postData.authorId !== userId) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        const userData = userDoc.exists() ? userDoc.data() : null;

        const notificationData: any = {
          type: 'like',
          userId: postData.authorId,
          triggeredBy: userId,
          triggeredByUsername: userData?.username || 'Usuario',
          triggeredByDisplayName: userData?.displayName || 'Usuario',
          postId: postId,
          content: `Le gustó tu post: "${postData.title}"`
        };

        if (userData?.profileImageUrl) {
          notificationData.triggeredByProfileImage = userData.profileImageUrl;
        }

        await createNotification(notificationData);
      }

      return {
        liked: true,
        totalLikes: (postData.likes || 0) + 1
      };
    }
  } catch (error) {
    console.error('Error toggling post like:', error);
    throw error;
  }
};

export const getPostLikeStatus = async (postId: string, userId: string): Promise<{ isLiked: boolean; totalLikes: number }> => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      return { isLiked: false, totalLikes: 0 };
    }

    const postData = postSnap.data();
    const likedBy = postData.likedBy || [];
    
    return {
      isLiked: likedBy.includes(userId),
      totalLikes: postData.likes || 0
    };
  } catch (error) {
    console.error('Error getting post like status:', error);
    return { isLiked: false, totalLikes: 0 };
  }
};