import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, ArrowUpCircle, ArrowDownCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { FeedPost } from './feedApi';

interface PostItemProps {
  post: FeedPost;
  onVote: (reportId: number, type: 'upvote' | 'downvote') => void;
}

export function PostItem({ post, onVote }: PostItemProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'extreme': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'extreme': return 'High Severity';
      case 'medium': return 'Moderate Severity';
      default: return 'Low Severity';
    }
  };

  const formatDistance = (meters?: number) => {
    if (meters === undefined || meters === null) return null;
    if (meters < 1000) return `${Math.round(meters)}m away`;
    return `${(meters / 1000).toFixed(1)}km away`;
  };

  return (
    <article className="py-6 px-4 sm:px-6 hover:bg-gray-50/50 transition-colors">
      
      {/* Header Area */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-blue-200 flex items-center justify-center border border-blue-300">
            <span className="font-bold text-blue-700 text-sm">
              {post.source === 'user_report' ? 'U' : post.source[0].toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm">
                {post.source === 'user_report' ? 'Community Reporter' : 'External Source'}
              </span>
              {post.status === 'approved' && (
                <ShieldCheck className="w-4 h-4 text-blue-500" title="Verified by Admin" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              {post.distance_meters !== undefined && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium text-blue-600">
                    <MapPin className="w-3 h-3" />
                    {formatDistance(post.distance_meters)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getSeverityColor(post.severity)}`}>
          <AlertTriangle className="w-3.5 h-3.5" />
          {getSeverityLabel(post.severity)}
        </span>
      </div>

      {/* Content Area */}
      <div className="ml-13 pl-13 mb-4">
        <p className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap">
          {post.raw_text}
        </p>

        {post.image_url && (
          <div className="mt-3 rounded-2xl overflow-hidden border border-gray-100 max-h-96 bg-gray-100">
            <img 
              src={post.image_url} 
              alt="Flood evidence" 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Interaction Bar */}
      <div className="ml-13 pl-13 flex items-center gap-6">
        <div className="flex items-center bg-gray-50 rounded-full border border-gray-200 p-1">
          <button 
            onClick={() => onVote(post.id, 'upvote')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-sm font-medium ${
              post.user_interaction === 'upvote' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <ArrowUpCircle className={`w-5 h-5 ${post.user_interaction === 'upvote' ? 'fill-blue-200' : ''}`} />
            <span>{post.upvotes}</span>
          </button>
          
          <div className="w-px h-5 bg-gray-300 mx-1"></div>
          
          <button 
            onClick={() => onVote(post.id, 'downvote')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-sm font-medium ${
              post.user_interaction === 'downvote' 
                ? 'bg-red-100 text-red-700' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{post.downvotes}</span>
            <ArrowDownCircle className={`w-5 h-5 ${post.user_interaction === 'downvote' ? 'fill-red-200' : ''}`} />
          </button>
        </div>

        <button className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
          Reply
        </button>
        <button className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
          Share
        </button>
      </div>
    </article>
  );
}
