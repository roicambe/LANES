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
}

export interface FeedResponse {
  posts: FeedPost[];
  total: number;
  has_more: boolean;
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
