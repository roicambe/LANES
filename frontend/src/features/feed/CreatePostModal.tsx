import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Image as ImageIcon, Video, Send, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost } from './feedApi';
import { useToast } from '@/shared/ui';
import LoginForm from '@/features/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';

import { useRouter } from 'next/navigation';

interface CreatePostModalProps {
  onClose: () => void;
}

export function CreatePostModal({ onClose }: CreatePostModalProps) {
  const router = useRouter();
  const [content, setContent] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('lanes_draft_post') || '';
    }
    return '';
  });
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; preview: string }[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const { isAuthenticated } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isAuthenticated && showAuthPrompt) {
      setShowAuthPrompt(false);
      // Wait for the user to explicitly click post again
    }
  }, [isAuthenticated, showAuthPrompt]);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    
    // Fallback: forcefully load the draft on mount in case the useState initializer was skipped or mismatched
    if (typeof window !== 'undefined') {
      const draft = sessionStorage.getItem('lanes_draft_post');
      if (draft && !content) {
        setContent(draft);
      }
    }
    
    return () => {
      document.body.style.overflow = 'auto';
      // Cleanup previews
      selectedFiles.forEach(f => URL.revokeObjectURL(f.preview));
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[indexToRemove].preview);
      updated.splice(indexToRemove, 1);
      return updated;
    });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      return createPost({ 
        content, 
        images: selectedFiles.map(f => f.file)
      });
    },
    onSuccess: () => {
      success('Post created successfully!');
      sessionStorage.removeItem('lanes_draft_post');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      onClose();
    },
    onError: (err: any) => {
      if (err.status === 401 || err.message.includes('401') || err.message.includes('authenticated') || err.message.includes('credentials') || err.message.includes('logged in')) {
        localStorage.removeItem('lanes_token');
        setShowAuthPrompt(true);
      } else {
        showError('Failed to create post', err.message);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      showError("Please enter a description for your post.");
      return;
    }
    
    if (!localStorage.getItem('lanes_token')) {
      sessionStorage.setItem('lanes_draft_post', content);
      sessionStorage.setItem('lanes_post_intent', 'true');
      setShowAuthPrompt(true);
      return;
    }
    
    createMutation.mutate();
  };

  if (!mounted) return null;

  // Helper to render media (video vs image)
  const renderMedia = (f: {file: File, preview: string}, className: string) => {
    if (f.file.type.startsWith('video/')) {
      return <video src={f.preview} controls className={className + " bg-black"} />;
    }
    return <img src={f.preview} alt="Preview" className={className} />;
  };

  // Facebook style grid preview
  const renderGridPreview = () => {
    if (selectedFiles.length === 0) return null;

    const count = selectedFiles.length;
    let gridContent = null;

    // Helper for rendering a grid cell with remove button
    const renderCell = (index: number, extraClass: string = "", overlayIndex?: number) => (
      <div key={index} className={`relative w-full h-full overflow-hidden ${extraClass}`}>
        {renderMedia(selectedFiles[index], "w-full h-full object-cover")}
        {overlayIndex === index && count > 5 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
            <span className="text-white text-3xl font-bold">+{count - 5}</span>
          </div>
        )}
        <button 
          type="button" 
          onClick={() => removeFile(index)} 
          className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-md z-10 scale-90"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );

    if (count === 1) {
      gridContent = (
        <div className="w-full max-h-[300px]">
          {renderCell(0, "max-h-[300px]")}
        </div>
      );
    } else if (count === 2) {
      gridContent = (
        <div className="grid grid-cols-2 gap-1 w-full aspect-video">
          {renderCell(0)}
          {renderCell(1)}
        </div>
      );
    } else if (count === 3) {
      gridContent = (
        <div className="flex flex-col gap-1 w-full aspect-square">
          <div className="flex-1 w-full">{renderCell(0)}</div>
          <div className="flex-1 grid grid-cols-2 gap-1 w-full">
            {renderCell(1)}
            {renderCell(2)}
          </div>
        </div>
      );
    } else if (count === 4) {
      gridContent = (
        <div className="flex flex-col gap-1 w-full aspect-square">
          <div className="flex-[2] w-full">{renderCell(0)}</div>
          <div className="flex-[1] grid grid-cols-3 gap-1 w-full">
            {renderCell(1)}
            {renderCell(2)}
            {renderCell(3)}
          </div>
        </div>
      );
    } else {
      // 5 or more (Facebook style: 2 on top, 3 on bottom)
      gridContent = (
        <div className="flex flex-col gap-1 w-full aspect-square">
          <div className="flex-1 grid grid-cols-2 gap-1 w-full">
            {renderCell(0)}
            {renderCell(1)}
          </div>
          <div className="flex-1 grid grid-cols-3 gap-1 w-full">
            {renderCell(2)}
            {renderCell(3)}
            {renderCell(4, "", 4)}
          </div>
        </div>
      );
    }

    return (
      <div className="relative mt-2 rounded-xl overflow-hidden border border-gray-200">
        {gridContent}
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] relative">
        {/* Auth Prompt Overlay */}
        {showAuthPrompt && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in">
            <button 
              onClick={() => setShowAuthPrompt(false)}
              className="absolute top-4 right-4 p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-full max-w-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Login Required</h3>
              <p className="text-gray-600 mb-6 text-center text-sm">Sign in to share your post and photos with the community.</p>
              <LoginForm />
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Create Post</h2>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4">
            <textarea
              className="w-full text-gray-800 text-lg border-none focus:outline-none focus:ring-0 focus:border-transparent resize-none min-h-[120px] placeholder-gray-400 bg-transparent"
              placeholder="What's happening in your area?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={createMutation.isPending}
              autoFocus
            ></textarea>

            {renderGridPreview()}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2">
              <label 
                className="cursor-pointer text-blue-600 hover:bg-blue-100 p-2 rounded-full transition-colors flex items-center justify-center"
                title="Add Photo"
              >
                <ImageIcon className="w-5 h-5" />
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple
                  className="hidden" 
                  onChange={handleFileChange}
                  disabled={createMutation.isPending}
                />
              </label>

              <label 
                className="cursor-pointer text-green-600 hover:bg-green-100 p-2 rounded-full transition-colors flex items-center justify-center"
                title="Add Video"
              >
                <Video className="w-5 h-5" />
                <input 
                  type="file" 
                  accept="video/*" 
                  multiple
                  className="hidden" 
                  onChange={handleFileChange}
                  disabled={createMutation.isPending}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending || !content.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Post
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
