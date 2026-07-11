import { apiClient } from '@/lib/apiClient';

export interface FeedPost {
  id: number;
  raw_text: string;
  source: string;
  source_url?: string;
  severity: 'low' | 'medium' | 'extreme';
  status: string;
  image_url?: string;
  created_at: string;
  
  upvotes: number;
  downvotes: number;
  distance_meters?: number;
  user_interaction?: 'upvote' | 'downvote';
  human_readable_location?: string;
  author_name?: string;
  comment_count: number;
  geometry?: {
    type: 'Point' | 'LineString';
    coordinates: number[] | number[][];
  };
}

export interface FeedResponse {
  posts: FeedPost[];
  total: number;
  has_more: boolean;
}

export interface CommentResponse {
  id: number;
  content: string;
  created_at: string;
  author_name: string;
}

export interface TopReporter {
  rank: number;
  user_id: number;
  username: string;
  avatar_url: string | null;
  report_count: number;
}

export interface TopReportersResponse {
  reporters: TopReporter[];
}

export const getFeed = async (
  lat?: number, 
  lng?: number, 
  tab: 'recent' | 'nearby' = 'recent', 
  skip = 0, 
  limit = 20
): Promise<FeedResponse> => {
  const searchParams = new URLSearchParams();
  searchParams.append('tab', tab);
  searchParams.append('skip', skip.toString());
  searchParams.append('limit', limit.toString());
  
  if (lat !== undefined && lng !== undefined) {
    searchParams.append('lat', lat.toString());
    searchParams.append('lng', lng.toString());
  }
  
  return apiClient.get<FeedResponse>(`/feed/?${searchParams.toString()}`);
};

export const votePost = async (reportId: number, interactionType: 'upvote' | 'downvote') => {
  return apiClient.post(`/feed/${reportId}/vote`, {
    report_id: reportId,
    interaction_type: interactionType,
  });
};

export const getComments = async (reportId: number): Promise<CommentResponse[]> => {
  return apiClient.get<CommentResponse[]>(`/reports/${reportId}/comments`);
};

export const postComment = async (reportId: number, content: string): Promise<CommentResponse> => {
  return apiClient.post<CommentResponse>(`/reports/${reportId}/comments`, { content });
};

export const getTopReporters = async (limit: number = 5): Promise<TopReportersResponse> => {
  return apiClient.get<TopReportersResponse>(`/feed/leaderboard?limit=${limit}`);
};

