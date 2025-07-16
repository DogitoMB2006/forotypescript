import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, doc, deleteDoc, updateDoc, where, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { createNotification } from './notificationService';
import { deleteAudioFile } from './audioService';

export interface CreateCommentData {
  content?: string;
  audioUrl?: string;
  audioDuration?: number;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  parentId?: string;
  replyToUsername?: string;
}

export interface Comment {
  id: string;
  content?: string;
  audioUrl?: string;
  audioDuration?: number;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  createdAt: any;
  updatedAt: any;
  likes: number;
  likedBy: string[];
  parentId?: string;
  replyToUsername?: string;
  replies?: Comment[];
}

export const createComment = async (commentData: CreateCommentData) => {
  try {
    const docRef = await addDoc(collection(db, 'comments'), {
      content: commentData.content || null,
      audioUrl: commentData.audioUrl || null,
      audioDuration: commentData.audioDuration || null,
      postId: commentData.postId,
      authorId: commentData.authorId,
      authorUsername: commentData.authorUsername,
      authorDisplayName: commentData.authorDisplayName,
      parentId: commentData.parentId || null,
      replyToUsername: commentData.replyToUsername || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likes: 0,
      likedBy: []
    });

    const userDoc = await getDoc(doc(db, 'users', commentData.authorId));
    const userData = userDoc.exists() ? userDoc.data() : null;

    if (commentData.parentId) {
      const parentCommentDoc = await getDoc(doc(db, 'comments', commentData.parentId));
      if (parentCommentDoc.exists()) {
        const parentCommentData = parentCommentDoc.data();
        const parentAuthorId = parentCommentData.authorId;

        if (parentAuthorId !== commentData.authorId) {
          const notificationData: any = {
            type: 'reply',
            userId: parentAuthorId,
            triggeredBy: commentData.authorId,
            triggeredByUsername: commentData.authorUsername,
            triggeredByDisplayName: commentData.authorDisplayName,
            postId: commentData.postId,
            commentId: docRef.id,
            parentCommentId: commentData.parentId,
            content: commentData.content || '[Nota de voz]'
          };

          if (userData?.profileImageUrl) {
            notificationData.triggeredByProfileImage = userData.profileImageUrl;
          }

          await createNotification(notificationData);
        }
      }
    } else {
      const postDoc = await getDoc(doc(db, 'posts', commentData.postId));
      if (postDoc.exists()) {
        const postData = postDoc.data();
        const postAuthorId = postData.authorId;

        if (postAuthorId !== commentData.authorId) {
          const notificationData: any = {
            type: 'comment',
            userId: postAuthorId,
            triggeredBy: commentData.authorId,
            triggeredByUsername: commentData.authorUsername,
            triggeredByDisplayName: commentData.authorDisplayName,
            postId: commentData.postId,
            commentId: docRef.id,
            content: commentData.content || '[Nota de voz]'
          };

          if (userData?.profileImageUrl) {
            notificationData.triggeredByProfileImage = userData.profileImageUrl;
          }

          await createNotification(notificationData);
        }
      }
    }

    return docRef.id;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

export const getCommentsByPostId = async (postId: string): Promise<Comment[]> => {
  try {
    const q = query(
      collection(db, 'comments'), 
      where('postId', '==', postId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const allComments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Comment));

    const commentsMap = new Map<string, Comment>();
    const topLevelComments: Comment[] = [];

    allComments.forEach(comment => {
      comment.replies = [];
      commentsMap.set(comment.id, comment);
      
      if (!comment.parentId) {
        topLevelComments.push(comment);
      }
    });

    allComments.forEach(comment => {
      if (comment.parentId) {
        const parent = commentsMap.get(comment.parentId);
        if (parent) {
          parent.replies!.push(comment);
        }
      }
    });

    topLevelComments.forEach(comment => {
      if (comment.replies) {
        comment.replies.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return aTime.getTime() - bTime.getTime();
        });
      }
    });

    return topLevelComments;
  } catch (error) {
    console.error('Error getting comments:', error);
    throw error;
  }
};

export const updateComment = async (commentId: string, content: string) => {
  try {
    const commentRef = doc(db, 'comments', commentId);
    await updateDoc(commentRef, {
      content,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

export const deleteComment = async (commentId: string) => {
  try {
    const commentDoc = await getDoc(doc(db, 'comments', commentId));
    if (commentDoc.exists()) {
      const commentData = commentDoc.data();
      
      if (commentData.audioUrl) {
        await deleteAudioFile(commentData.audioUrl);
      }
    }
    
    await deleteDoc(doc(db, 'comments', commentId));
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

export const getCommentCount = async (postId: string): Promise<number> => {
  try {
    const q = query(collection(db, 'comments'), where('postId', '==', postId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting comment count:', error);
    return 0;
  }
};