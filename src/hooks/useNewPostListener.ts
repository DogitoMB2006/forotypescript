import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useNewPostListener = () => {
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const [latestPostId, setLatestPostId] = useState<string | null>(null);

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

        if (latestPostId && latestPostId !== newPostId) {
          setHasNewPosts(true);
        }

        if (!latestPostId) {
          setLatestPostId(newPostId);
        }
      }
    });

    return () => unsubscribe();
  }, [latestPostId]);

  const markAsRead = () => {
    setHasNewPosts(false);
    setLatestPostId(null);
  };

  return { hasNewPosts, markAsRead };
};