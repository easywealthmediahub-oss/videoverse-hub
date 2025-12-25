import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  like_count: number;
  user_id: string;
  video_id: string;
  video?: {
    title: string;
    thumbnail_url: string | null;
  };
  profile?: {
    username: string;
    avatar_url: string | null;
  };
}

interface CommentsFeedProps {
  limit?: number;
  showAddComment?: boolean;
}

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
  return `${Math.floor(seconds / 31536000)} years ago`;
};

export default function CommentsFeed({ limit = 20, showAddComment = true }: CommentsFeedProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profile:profiles(username, avatar_url),
          video:videos(title, thumbnail_url)
        `)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      if (data) {
        setComments(data as any);
      }
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load comments',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async () => {
    if (!user) {
      toast({ 
        variant: 'destructive', 
        title: 'Please sign in to comment' 
      });
      return;
    }
    
    if (!newComment.trim() || !selectedVideoId) {
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          video_id: selectedVideoId,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment("");
      setSelectedVideoId(null);
      fetchComments(); // Refresh the comments feed
      
      toast({ 
        title: 'Comment added!' 
      });
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add comment',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showAddComment && user && (
        <div className="flex gap-3 mb-6 p-4 bg-secondary rounded-lg">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="Add a comment to a video..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="resize-none"
              rows={3}
            />
            <div className="flex justify-between items-center">
              <input
                type="text"
                value={selectedVideoId || ''}
                onChange={(e) => setSelectedVideoId(e.target.value)}
                placeholder="Enter video ID to comment on"
                className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-background"
              />
              <Button 
                onClick={handleComment} 
                disabled={!newComment.trim() || !selectedVideoId}
                className="ml-2"
              >
                Comment
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 p-4 bg-secondary rounded-lg">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={comment.profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {comment.profile?.username?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-foreground">
                    {comment.profile?.username || 'Anonymous'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(comment.created_at)}
                  </span>
                </div>
                
                <p className="text-sm text-foreground mb-2">{comment.content}</p>
                
                <div className="flex items-center gap-4 text-sm">
                  <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{comment.like_count || 0}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Reply
                  </Button>
                </div>
                
                {comment.video && (
                  <div className="mt-3 p-2 bg-background rounded-md border">
                    <div className="flex items-center gap-2">
                      {comment.video.thumbnail_url && (
                        <img 
                          src={comment.video.thumbnail_url} 
                          alt={comment.video.title} 
                          className="w-12 h-8 object-cover rounded" 
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {comment.video.title}
                        </p>
                        <p className="text-xs text-muted-foreground">Commented on this video</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
}