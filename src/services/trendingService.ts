import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Post } from './postService';

export interface TrendingPost extends Post {
  trendingScore: number;
}

export type TimeRange = '24h' | '7d' | '30d' | 'all';

const calculateTrendingScore = (post: Post, timeRange: TimeRange): number => {
  const likes = post.likes || 0;
  const createdAt = post.createdAt?.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
  const now = new Date();
  const ageInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  
  let timeWeight = 1;
  let likesWeight = 1;
  
  switch (timeRange) {
    case '24h':
      timeWeight = Math.max(0, 1 - (ageInHours / 24));
      likesWeight = 2;
      break;
    case '7d':
      timeWeight = Math.max(0, 1 - (ageInHours / (24 * 7)));
      likesWeight = 1.5;
      break;
    case '30d':
      timeWeight = Math.max(0, 1 - (ageInHours / (24 * 30)));
      likesWeight = 1.2;
      break;
    case 'all':
      timeWeight = Math.max(0.1, 1 - (ageInHours / (24 * 365)));
      likesWeight = 1;
      break;
  }
  
  const baseScore = likes * likesWeight;
  const timeBonus = timeWeight * 10;
  const recencyBonus = ageInHours < 24 ? 5 : ageInHours < 168 ? 2 : 0;
  
  return baseScore + timeBonus + recencyBonus;
};

const getTimeRangeFilter = (timeRange: TimeRange): Date | null => {
  const now = new Date();
  
  switch (timeRange) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'all':
      return null;
    default:
      return null;
  }
};

export const getTrendingPosts = async (
  timeRange: TimeRange = '7d',
  minLikes: number = 1,
  limit: number = 20
): Promise<TrendingPost[]> => {
  try {
    const timeFilter = getTimeRangeFilter(timeRange);
    
    let q = query(
      collection(db, 'posts'),
      where('likes', '>=', minLikes),
      orderBy('likes', 'desc'),
      orderBy('createdAt', 'desc')
    );

    if (timeFilter) {
      q = query(
        collection(db, 'posts'),
        where('likes', '>=', minLikes),
        where('createdAt', '>=', Timestamp.fromDate(timeFilter)),
        orderBy('likes', 'desc'),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Post));

    const trendingPosts: TrendingPost[] = posts.map(post => ({
      ...post,
      trendingScore: calculateTrendingScore(post, timeRange)
    }));

    return trendingPosts
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    throw error;
  }
};

export const getTrendingStats = async (timeRange: TimeRange = '7d'): Promise<{
  totalPosts: number;
  avgLikes: number;
  timeRange: string;
}> => {
  try {
    const timeFilter = getTimeRangeFilter(timeRange);
    
    let q = query(
      collection(db, 'posts'),
      where('likes', '>=', 1),
      orderBy('likes', 'desc')
    );

    if (timeFilter) {
      q = query(
        collection(db, 'posts'),
        where('likes', '>=', 1),
        where('createdAt', '>=', Timestamp.fromDate(timeFilter)),
        orderBy('likes', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map(doc => doc.data() as Post);
    
    const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
    const avgLikes = posts.length > 0 ? totalLikes / posts.length : 0;
    
    const timeRangeLabels = {
      '24h': '24 Horas',
      '7d': '7 Días',
      '30d': '30 Días',
      'all': 'Todo el Tiempo'
    };

    return {
      totalPosts: posts.length,
      avgLikes,
      timeRange: timeRangeLabels[timeRange]
    };
  } catch (error) {
    console.error('Error fetching trending stats:', error);
    return {
      totalPosts: 0,
      avgLikes: 0,
      timeRange: 'Sin datos'
    };
  }
};