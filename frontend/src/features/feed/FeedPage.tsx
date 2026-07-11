"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getFeed, votePost, FeedPost } from './feedApi';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { PostItem } from './PostItem';
import { Loader2, Filter } from 'lucide-react';
import { useToast } from '@/shared/ui';

export function FeedPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { error: showError } = useToast();
  const [tab, setTab] = useState<'recent' | 'nearby'>('recent');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Request location if nearby tab is clicked and we don't have it
  useEffect(() => {
    if (tab === 'nearby' && !userLocation) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setLocError(null);
          },
          (err) => {
            console.error("Location error:", err);
            showError("Location Unavailable", "Please enable location permissions to use the Nearby feed.");
            setTab('recent');
          }
        );
      } else {
        showError("Not Supported", "Geolocation is not supported by your browser.");
        setTab('recent');
      }
    }
  }, [tab, userLocation, showError]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['feed', tab, userLocation?.lat, userLocation?.lng],
    queryFn: () => getFeed(userLocation?.lat, userLocation?.lng, tab, 0, 50),
    enabled: tab === 'recent' || (tab === 'nearby' && userLocation !== null),
  });

  const voteMutation = useMutation({
    mutationFn: ({ reportId, type }: { reportId: number, type: 'upvote' | 'downvote' }) => votePost(reportId, type),
    onSuccess: () => {
      // Invalidate feed to refresh votes
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (error) => {
      showError('Failed to vote', error.message);
    }
  });

  const handleVote = (reportId: number, type: 'upvote' | 'downvote') => {
    voteMutation.mutate({ reportId, type });
  };

  return (
    <div className="bg-transparent text-gray-900 flex justify-center w-full mt-2">
      {/* 3-Column Layout Wrapper */}
      <div className="flex w-full px-2 lg:px-4 xl:px-8 border-t border-gray-200 pt-2">
        
        {/* Left Navigation */}
        <LeftSidebar />

        {/* Center & Right Wrapper */}
        <div className="flex-1 flex justify-center min-w-0 px-4 lg:px-8 gap-6">
          
          {/* Main Feed */}
          <main className="w-full max-w-[720px] bg-transparent relative">
          
          {/* Sticky Header with Tabs */}
          <div className="sticky top-20 z-10 bg-gray-50/95 backdrop-blur-md border-b border-gray-200 px-4 pt-2 pb-0 flex flex-col justify-end">
            <h1 className="text-xl font-extrabold tracking-tight mb-2 px-2">Community Feed</h1>
            
            <div className="flex justify-between items-end px-2">
              <div className="flex gap-6">
                <button 
                  onClick={() => setTab('recent')}
                  className={`pb-3 text-sm font-bold transition-colors relative ${
                    tab === 'recent' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Recent
                  {tab === 'recent' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-md"></div>
                  )}
                </button>
                
                <button 
                  onClick={() => setTab('nearby')}
                  className={`pb-3 text-sm font-bold transition-colors relative ${
                    tab === 'nearby' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Nearby
                  {tab === 'nearby' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-md"></div>
                  )}
                </button>
              </div>

              <button className="pb-2.5 text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 text-sm font-medium">
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>


          {/* Feed Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-2 overflow-hidden mb-20">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                <p className="text-gray-500 text-sm font-medium">Fetching reports...</p>
              </div>
            )}

            {isError && (
              <div className="p-8 text-center text-red-500">
                <p>Failed to load feed.</p>
                <p className="text-xs mt-2 opacity-70">{(error as Error).message}</p>
              </div>
            )}

            {data && data.posts.length === 0 && (
              <div className="p-16 text-center text-gray-500">
                <p className="font-medium text-lg text-gray-700">No reports found.</p>
                <p className="text-sm mt-1">Check back later or submit a new report.</p>
              </div>
            )}

            {data && data.posts.map((post: FeedPost) => (
              <PostItem 
                key={post.id} 
                post={post} 
                onVote={handleVote}
                onViewMap={(lat, lng) => router.push(`/map?lat=${lat}&lng=${lng}&zoom=16`)} 
              />
            ))}
          </div>

          </main>

          {/* Right Auxiliary Panel (Pulled in) */}
          <RightSidebar />
        </div>
        
      </div>
    </div>
  );
}
