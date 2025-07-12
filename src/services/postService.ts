import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';

export interface CreatePostData {
  title: string;
  content: string;
  images: File[];
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  imageUrls: string[];
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  createdAt: any;
  updatedAt: any;
  likes: number;
  commentsCount: number;
  likedBy: string[];
}

export type { Post as PostType };

export const createPost = async (postData: CreatePostData) => {
  try {
    let imageUrls: string[] = [];

    if (postData.images.length > 0) {
      const uploadPromises = postData.images.map(async (image, index) => {
        const imageRef = ref(storage, `posts/${postData.authorId}/${Date.now()}_${index}`);
        const snapshot = await uploadBytes(imageRef, image);
        return getDownloadURL(snapshot.ref);
      });
      
      imageUrls = await Promise.all(uploadPromises);
    }

    const docRef = await addDoc(collection(db, 'posts'), {
      title: postData.title,
      content: postData.content,
      imageUrls,
      authorId: postData.authorId,
      authorUsername: postData.authorUsername,
      authorDisplayName: postData.authorDisplayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likes: 0,
      commentsCount: 0,
      likedBy: []
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

export const getPosts = async (): Promise<Post[]> => {
  try {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Post));
  } catch (error) {
    console.error('Error getting posts:', error);
    throw error;
  }
};

export const getPostById = async (postId: string): Promise<Post | null> => {
  try {
    const docRef = doc(db, 'posts', postId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Post;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting post:', error);
    throw error;
  }
};

export const deletePost = async (postId: string, imageUrls: string[] = []) => {
  try {
    if (imageUrls.length > 0) {
      const deletePromises = imageUrls.map(async (imageUrl) => {
        try {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        } catch (error) {
          console.error('Error deleting image:', error);
        }
      });
      
      await Promise.all(deletePromises);
    }

    await deleteDoc(doc(db, 'posts', postId));
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};