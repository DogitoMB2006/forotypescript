import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useNewPostListener = () => {
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const [latestPostId, setLatestPostId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const latestPost = querySnapshot.docs[0];
        const newPostId = latestPost.id;

        if (!isInitialized) {
          setLatestPostId(newPostId);
          setIsInitialized(true);
          return;
        }

        if (latestPostId && latestPostId !== newPostId) {
          setHasNewPosts(true);
        }

        setLatestPostId(newPostId);
      }
    });

    return () => unsubscribe();
  }, [latestPostId, isInitialized]);

  const markAsRead = () => {
    setHasNewPosts(false);
  };

  return { hasNewPosts, markAsRead };
};