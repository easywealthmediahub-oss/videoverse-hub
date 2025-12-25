import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  Reply, 
  Trash2, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

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

const CommentSection = ({ videoId }: CommentSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<{[key: string]: string}>({});
  const [expandedReplies, setExpandedReplies] = useState<{[key: string]: boolean}>({});

  const updateCommentLikeStatus = (comments: Comment[], commentId: string, isLike: boolean) => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        // Calculate new like count based on the action
        let newLikeCount = comment.like_count || 0;
        if (comment.user_liked && isLike) {
          // User is unliking, decrease count
          newLikeCount = Math.max(0, newLikeCount - 1);
        } else if (comment.user_disliked && !isLike) {
          // User is undisliking, increase count
          newLikeCount = newLikeCount + 1;
        } else if (!comment.user_liked && isLike) {
          // User is liking, increase count
          newLikeCount = newLikeCount + 1;
        } else if (!comment.user_disliked && !isLike) {
          // User is disliking, decrease count
          newLikeCount = Math.max(0, newLikeCount - 1);
        }
        
        return {
          ...comment,
          like_count: newLikeCount,
          user_liked: isLike,
          user_disliked: !isLike,
        };
      }
      
      // Also update replies if they exist
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
      
      // Also check if we need to add to a reply's replies
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

  const removeTempReply = (comments: Comment[], tempId: string): Comment[] => {
    return comments.map(comment => {
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: comment.replies.filter(reply => reply.id !== tempId)
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
      // Get top-level comments (parent_id is null)
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('video_id', videoId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      if (commentsData) {
        // Fetch profile information for each comment separately
        const commentsWithProfiles = await Promise.all(commentsData.map(async (comment) => {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username, avatar_url, display_name')
            .eq('user_id', comment.user_id)
            .maybeSingle();

          if (profileError) {
            console.error('Error fetching profile for comment:', profileError);
          }

          // Get user's vote status for this comment if user is logged in
          let userVote = null;
          if (user) {
            try {
              const { data: voteData, error: voteError } = await supabase
                .from('comment_votes')
                .select('is_like')
                .eq('comment_id', comment.id)
                .eq('user_id', user.id)
                .maybeSingle(); // Use maybeSingle instead of single
              
              if (!voteError && voteData) {
                userVote = voteData;
              }
            } catch (error) {
              // Handle error gracefully
              console.warn('Error checking user vote status:', error);
            }
          }

          // Get replies for this comment
          const { data: repliesData, error: repliesError } = await supabase
            .from('comments')
            .select('*')
            .eq('parent_id', comment.id)
            .order('created_at', { ascending: true });

          if (repliesError) {
            console.error('Error fetching replies:', repliesError);
          }

          // Fetch profile information and vote status for each reply
          const repliesWithProfiles = repliesData ? await Promise.all(repliesData.map(async (reply) => {
            const { data: replyProfileData, error: replyProfileError } = await supabase
              .from('profiles')
              .select('username, avatar_url, display_name')
              .eq('user_id', reply.user_id)
              .maybeSingle();

            if (replyProfileError) {
              console.error('Error fetching profile for reply:', replyProfileError);
            }

            // Get user's vote status for this reply if user is logged in
            let replyUserVote = null;
            if (user) {
              try {
                const { data: replyVoteData, error: replyVoteError } = await supabase
                  .from('comment_votes')
                  .select('is_like')
                  .eq('comment_id', reply.id)
                  .eq('user_id', user.id)
                  .maybeSingle(); // Use maybeSingle instead of single
                
                if (!replyVoteError && replyVoteData) {
                  replyUserVote = replyVoteData;
                }
              } catch (error) {
                // Handle error gracefully
                console.warn('Error checking reply vote status:', error);
              }
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
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load comments',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Please sign in to comment' });
      return;
    }
    if (!newComment.trim()) {
      toast({ variant: 'destructive', title: 'Comment cannot be empty' });
      return;
    }

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
      fetchComments();
      toast({ title: 'Comment added!' });
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add comment',
      });
    }
  };

  const handleReply = async (commentId: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Please sign in to reply' });
      return;
    }

    const reply = replyText[commentId];
    if (!reply?.trim()) {
      toast({ variant: 'destructive', title: 'Reply cannot be empty' });
      return;
    }

    // Optimistic update: add reply to UI immediately
    const newReply = {
      id: `temp-${Date.now()}`, // Temporary ID
      user_id: user.id,
      video_id: videoId,
      parent_id: commentId,
      content: reply.trim(),
      like_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile: {
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
        avatar_url: user.user_metadata?.avatar_url || null,
        display_name: user.user_metadata?.display_name || null,
      },
      replies: [],
      user_liked: false,
      user_disliked: false,
    };
    
    setComments(prevComments => 
      addReplyToComment(prevComments, commentId, newReply)
    );

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
      fetchComments(); // Refresh to get the real ID and latest data
      toast({ title: 'Reply added!' });
    } catch (error: any) {
      // If the server update failed, remove the optimistic reply
      setComments(prevComments => 
        removeTempReply(prevComments, `temp-${Date.now()}`)
      );
      
      console.error('Error adding reply:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add reply',
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Please sign in to delete' });
      return;
    }

    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    // Optimistic update: remove comment from UI immediately
    setComments(prevComments => 
      removeComment(prevComments, commentId)
    );

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id); // Ensure user can only delete their own comments

      if (error) throw error;

      toast({ title: 'Comment deleted!' });
    } catch (error: any) {
      // If the server update failed, revert the optimistic update
      setComments(prevComments => 
        [...prevComments] // Just refresh to revert
      );
      
      console.error('Error deleting comment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete comment',
      });
    }
  };

  const handleLike = async (comment: Comment, isLike: boolean) => {
    const commentId = comment.id;
    if (!user) {
      toast({ variant: 'destructive', title: 'Please sign in to like' });
      return;
    }

    // Optimistic update: update UI immediately
    setComments(prevComments => 
      updateCommentLikeStatus(prevComments, commentId, isLike)
    );

    try {
      // Check if user has already liked/disliked this comment
      const { data: existingVote, error: voteError } = await supabase
        .from('comment_votes')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (voteError) {
        if (voteError.code === 'PGRST116') {
          // No rows returned, which is fine - user hasn't voted yet
        } else if (voteError.code === '42P01') {
          // 42P01 means the table doesn't exist, handle gracefully
          console.warn('comment_votes table does not exist, skipping vote operation');
          // Fallback: just update the like count directly
          const newLikeCount = isLike 
            ? (comment.like_count || 0) + 1 
            : Math.max(0, (comment.like_count || 0) - 1);
          
          await supabase
            .from('comments')
            .update({ 
              like_count: newLikeCount
            })
            .eq('id', commentId);
          // Refresh to get server state
          fetchComments();
          return;
        } else {
          // Some other error occurred
          throw voteError;
        }
      }

      if (existingVote) {
        // If the vote is the same, remove it
        if (existingVote.is_like === isLike) {
          await supabase
            .from('comment_votes')
            .delete()
            .eq('comment_id', commentId)
            .eq('user_id', user.id);

          // The like count will be updated by the trigger
        } else {
          // Update the vote
          await supabase
            .from('comment_votes')
            .update({ is_like: isLike })
            .eq('comment_id', commentId)
            .eq('user_id', user.id);

          // The like count will be updated by the trigger
        }
      } else {
        // Add new vote
        await supabase
          .from('comment_votes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
            is_like: isLike,
          });

        // The like count will be updated by the trigger
      }

      // Refresh to get server state
      fetchComments();
    } catch (error: any) {
      // If the server update failed, revert the optimistic update
      setComments(prevComments => 
        updateCommentLikeStatus(prevComments, commentId, !isLike) // Revert
      );
      
      console.error('Error liking comment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to like comment',
      });
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Comment */}
      {user && (
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.user_metadata?.avatar_url || ''} />
            <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="mb-2 resize-none"
              rows={3}
            />
            <div className="flex justify-end">
              <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                Comment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border-b pb-4 last:border-b-0">
              <div className="flex gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={comment.profile?.avatar_url || ''} />
                  <AvatarFallback>
                    {comment.profile?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-secondary p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">
                        {comment.profile?.display_name || comment.profile?.username || 'Anonymous'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-foreground">{comment.content}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <Button
                      variant={comment.user_liked ? "default" : "ghost"}
                      size="sm"
                      className="h-8 px-2 gap-1"
                      onClick={() => handleLike(comment, true)}
                    >
                      <ThumbsUp className={`h-4 w-4 ${comment.user_liked ? "text-white" : ""}`} />
                      <span>{comment.like_count || 0}</span>
                    </Button>
                    <Button
                      variant={comment.user_disliked ? "default" : "ghost"}
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => handleLike(comment, false)}
                    >
                      <ThumbsDown className={`h-4 w-4 ${comment.user_disliked ? "text-white" : ""}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    >
                      <Reply className="h-4 w-4 mr-1" />
                      Reply
                    </Button>
                    {user?.id === comment.user_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {comment.replies && comment.replies.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => toggleReplies(comment.id)}
                      >
                        {expandedReplies[comment.id] ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Hide replies ({comment.replies?.length})
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Show replies ({comment.replies?.length})
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Reply Form */}
                  {replyingTo === comment.id && user && (
                    <div className="mt-3 flex gap-2">
                      <Input
                        placeholder="Write a reply..."
                        value={replyText[comment.id] || ''}
                        onChange={(e) => setReplyText(prev => ({
                          ...prev,
                          [comment.id]: e.target.value
                        }))}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={() => handleReply(comment.id)}>
                        Reply
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setReplyingTo(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {/* Replies */}
                  {expandedReplies[comment.id] && comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 space-y-3 ml-6 border-l-2 border-muted pl-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="py-2">
                          <div className="flex gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={reply.profile?.avatar_url || ''} />
                              <AvatarFallback>
                                {reply.profile?.username?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-secondary p-2 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-foreground text-sm">
                                    {reply.profile?.display_name || reply.profile?.username || 'Anonymous'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(reply.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-foreground text-sm">{reply.content}</p>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs">
                                <Button
                                  variant={reply.user_liked ? "default" : "ghost"}
                                  size="sm"
                                  className="h-7 px-1 gap-0.5"
                                  onClick={() => handleLike(reply, true)}
                                >
                                  <ThumbsUp className={`h-3 w-3 ${reply.user_liked ? "text-white" : ""}`} />
                                  <span>{reply.like_count || 0}</span>
                                </Button>
                                <Button
                                  variant={reply.user_disliked ? "default" : "ghost"}
                                  size="sm"
                                  className="h-7 px-1"
                                  onClick={() => handleLike(reply, false)}
                                >
                                  <ThumbsDown className={`h-3 w-3 ${reply.user_disliked ? "text-white" : ""}`} />
                                </Button>
                                {user?.id === reply.user_id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-1 text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteComment(reply.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;