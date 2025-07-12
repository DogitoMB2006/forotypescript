import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, doc, deleteDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface CreateCommentData {
  content: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
}

export interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  createdAt: any;
  updatedAt: any;
  likes: number;
  likedBy: string[];
}

export const createComment = async (commentData: CreateCommentData) => {
  try {
    const docRef = await addDoc(collection(db, 'comments'), {
      content: commentData.content,
      postId: commentData.postId,
      authorId: commentData.authorId,
      authorUsername: commentData.authorUsername,
      authorDisplayName: commentData.authorDisplayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likes: 0,
      likedBy: []
    });

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
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Comment));
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