import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Reply, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  MoreVertical,
  Edit,
  Flag,
  MessageCircle,
  Send
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

interface Comment {
  id: string;
  user_id: string;
  video_id: string;
  parent_id: string | null;
  content: string;
  like_count: number;
  created_at: string;
  updated_at: string;
  profile: {
    username: string | null;
    avatar_url: string | null;
    display_name: string | null;
  } | null;
  replies?: Comment[];
  user_liked?: boolean;
  user_disliked?: boolean;
}

interface CommentSectionProps {
  videoId: string;
}

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
  return `${Math.floor(seconds / 31536000)}y ago`;
};

const CommentSection = ({ videoId }: CommentSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<{[key: string]: string}>({});
  const [expandedReplies, setExpandedReplies] = useState<{[key: string]: boolean}>({});
  const [commentFocused, setCommentFocused] = useState(false);

  const updateCommentLikeStatus = (comments: Comment[], commentId: string, isLike: boolean) => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        let newLikeCount = comment.like_count || 0;
        if (comment.user_liked && isLike) {
          newLikeCount = Math.max(0, newLikeCount - 1);
        } else if (comment.user_disliked && !isLike) {
          newLikeCount = newLikeCount + 1;
        } else if (!comment.user_liked && isLike) {
          newLikeCount = newLikeCount + 1;
        } else if (!comment.user_disliked && !isLike) {
          newLikeCount = Math.max(0, newLikeCount - 1);
        }
        
        return {
          ...comment,
          like_count: newLikeCount,
          user_liked: isLike,
          user_disliked: !isLike,
        };
      }
      
      if (comment.replies && comment.replies.length > 0) {
        const updatedReplies = comment.replies.map(reply => {
          if (reply.id === commentId) {
            let newLikeCount = reply.like_count || 0;
            if (reply.user_liked && isLike) {
              newLikeCount = Math.max(0, newLikeCount - 1);
            } else if (reply.user_disliked && !isLike) {
              newLikeCount = newLikeCount + 1;
            } else if (!reply.user_liked && isLike) {
              newLikeCount = newLikeCount + 1;
            } else if (!reply.user_disliked && !isLike) {
              newLikeCount = Math.max(0, newLikeCount - 1);
            }
            
            return {
              ...reply,
              like_count: newLikeCount,
              user_liked: isLike,
              user_disliked: !isLike,
            };
          }
          return reply;
        });
        
        return {
          ...comment,
          replies: updatedReplies,
        };
      }
      
      return comment;
    });
  };

  const removeComment = (comments: Comment[], commentId: string): Comment[] => {
    return comments
      .filter(comment => comment.id !== commentId)
      .map(comment => {
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: comment.replies.filter(reply => reply.id !== commentId)
          };
        }
        return comment;
      });
  };

  const addReplyToComment = (comments: Comment[], commentId: string, newReply: Comment): Comment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply]
        };
      }
      
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: comment.replies.map(reply => {
            if (reply.id === commentId) {
              return {
                ...reply,
                replies: [...(reply.replies || []), newReply]
              };
            }
            return reply;
          })
        };
      }
      
      return comment;
    });
  };

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  const fetchComments = async () => {
    setLoading(true);
    
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('video_id', videoId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      if (commentsData) {
        const commentsWithProfiles = await Promise.all(commentsData.map(async (comment) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, avatar_url, display_name')
            .eq('user_id', comment.user_id)
            .maybeSingle();

          let userVote = null;
          if (user) {
            const { data: voteData } = await supabase
              .from('comment_votes')
              .select('is_like')
              .eq('comment_id', comment.id)
              .eq('user_id', user.id)
              .maybeSingle();
            userVote = voteData;
          }

          const { data: repliesData } = await supabase
            .from('comments')
            .select('*')
            .eq('parent_id', comment.id)
            .order('created_at', { ascending: true });

          const repliesWithProfiles = repliesData ? await Promise.all(repliesData.map(async (reply) => {
            const { data: replyProfileData } = await supabase
              .from('profiles')
              .select('username, avatar_url, display_name')
              .eq('user_id', reply.user_id)
              .maybeSingle();

            let replyUserVote = null;
            if (user) {
              const { data: replyVoteData } = await supabase
                .from('comment_votes')
                .select('is_like')
                .eq('comment_id', reply.id)
                .eq('user_id', user.id)
                .maybeSingle();
              replyUserVote = replyVoteData;
            }

            return {
              ...reply,
              profile: replyProfileData || null,
              user_liked: replyUserVote?.is_like === true,
              user_disliked: replyUserVote?.is_like === false,
            };
          })) : [];

          return {
            ...comment,
            profile: profileData || null,
            replies: repliesWithProfiles,
            user_liked: userVote?.is_like === true,
            user_disliked: userVote?.is_like === false,
          };
        }));

        setComments(commentsWithProfiles as Comment[]);
      }
    } catch (error: any) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Please sign in to comment' });
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          video_id: videoId,
          content: newComment.trim(),
          parent_id: null,
        });

      if (error) throw error;

      setNewComment('');
      setCommentFocused(false);
      fetchComments();
      toast({ title: 'Comment added!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (commentId: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Please sign in to reply' });
      return;
    }

    const reply = replyText[commentId];
    if (!reply?.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          video_id: videoId,
          content: reply.trim(),
          parent_id: commentId,
        });

      if (error) throw error;

      setReplyText(prev => ({ ...prev, [commentId]: '' }));
      setReplyingTo(null);
      setExpandedReplies(prev => ({ ...prev, [commentId]: true }));
      fetchComments();
      toast({ title: 'Reply added!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    if (!window.confirm('Delete this comment?')) return;

    setComments(prevComments => removeComment(prevComments, commentId));

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
      toast({ title: 'Comment deleted' });
    } catch (error: any) {
      fetchComments();
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleLike = async (comment: Comment, isLike: boolean) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Please sign in to like' });
      return;
    }

    setComments(prevComments => updateCommentLikeStatus(prevComments, comment.id, isLike));

    try {
      const { data: existingVote } = await supabase
        .from('comment_votes')
        .select('*')
        .eq('comment_id', comment.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingVote) {
        if (existingVote.is_like === isLike) {
          await supabase
            .from('comment_votes')
            .delete()
            .eq('comment_id', comment.id)
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('comment_votes')
            .update({ is_like: isLike })
            .eq('comment_id', comment.id)
            .eq('user_id', user.id);
        }
      } else {
        await supabase
          .from('comment_votes')
          .insert({ comment_id: comment.id, user_id: user.id, is_like: isLike });
      }
    } catch (error) {
      console.error('Error voting:', error);
      fetchComments();
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const displayName = comment.profile?.display_name || comment.profile?.username || 'Anonymous';
    const avatarUrl = comment.profile?.avatar_url;
    const isOwner = user?.id === comment.user_id;
    const hasReplies = comment.replies && comment.replies.length > 0;
    const repliesExpanded = expandedReplies[comment.id];

    return (
      <div className={`group ${isReply ? '' : ''}`}>
        <div className="flex gap-3">
          {/* Avatar */}
          <Avatar className={`flex-shrink-0 ${isReply ? 'h-7 w-7' : 'h-9 w-9 md:h-10 md:w-10'}`}>
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {displayName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-medium text-foreground ${isReply ? 'text-xs' : 'text-sm'}`}>
                @{displayName}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatTimeAgo(comment.created_at)}
              </span>
            </div>

            {/* Comment Text */}
            <p className={`mt-1 text-foreground whitespace-pre-wrap break-words ${isReply ? 'text-xs' : 'text-sm'}`}>
              {comment.content}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-1 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-2 gap-1.5 text-muted-foreground hover:text-foreground ${
                  comment.user_liked ? 'text-primary' : ''
                }`}
                onClick={() => handleLike(comment, true)}
              >
                <ThumbsUp className="h-3.5 w-3.5" fill={comment.user_liked ? 'currentColor' : 'none'} />
                {comment.like_count > 0 && (
                  <span className="text-xs">{comment.like_count}</span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-2 text-muted-foreground hover:text-foreground ${
                  comment.user_disliked ? 'text-primary' : ''
                }`}
                onClick={() => handleLike(comment, false)}
              >
                <ThumbsDown className="h-3.5 w-3.5" fill={comment.user_disliked ? 'currentColor' : 'none'} />
              </Button>

              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground font-medium"
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                >
                  Reply
                </Button>
              )}

              {/* More Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {isOwner && (
                    <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Reply Input */}
            {replyingTo === comment.id && (
              <div className="flex items-start gap-3 mt-3 pl-0">
                <Avatar className="h-7 w-7 flex-shrink-0">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Add a reply..."
                    value={replyText[comment.id] || ''}
                    onChange={(e) => setReplyText(prev => ({ ...prev, [comment.id]: e.target.value }))}
                    className="min-h-[60px] text-sm resize-none bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0"
                  />
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText(prev => ({ ...prev, [comment.id]: '' }));
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleReply(comment.id)}
                      disabled={!replyText[comment.id]?.trim()}
                      className="rounded-full"
                    >
                      Reply
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Replies Toggle */}
            {hasReplies && !isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-8 px-3 text-primary hover:bg-primary/10 font-medium"
                onClick={() => toggleReplies(comment.id)}
              >
                {repliesExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Hide {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    View {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
                  </>
                )}
              </Button>
            )}

            {/* Replies List */}
            {hasReplies && repliesExpanded && (
              <div className="mt-3 space-y-3 pl-0">
                {comment.replies!.map((reply) => (
                  <CommentItem key={reply.id} comment={reply} isReply />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comment Count */}
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </span>
      </div>

      {/* New Comment Input */}
      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9 md:h-10 md:w-10 flex-shrink-0">
          <AvatarImage src={user?.user_metadata?.avatar_url} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {user?.email?.[0]?.toUpperCase() || 'G'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder={user ? "Add a comment..." : "Sign in to comment"}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onFocus={() => setCommentFocused(true)}
            disabled={!user}
            className="min-h-[44px] text-sm resize-none bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 placeholder:text-muted-foreground"
          />
          {(commentFocused || newComment) && (
            <div className="flex items-center justify-end gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNewComment('');
                  setCommentFocused(false);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={!newComment.trim() || isSubmitting}
                className="rounded-full gap-2"
              >
                <Send className="h-4 w-4" />
                Comment
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-5">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-7 h-7 text-muted-foreground" />
            </div>
            <h4 className="font-medium text-foreground mb-1">No comments yet</h4>
            <p className="text-sm text-muted-foreground">Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
