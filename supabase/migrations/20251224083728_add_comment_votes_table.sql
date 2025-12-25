-- Create comment_votes table
CREATE TABLE public.comment_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_like BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (comment_id, user_id)
);

ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;

-- Comment votes policies
CREATE POLICY "Comment votes are viewable by everyone" ON public.comment_votes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comment votes" ON public.comment_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comment votes" ON public.comment_votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment votes" ON public.comment_votes
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update comment like counts
CREATE OR REPLACE FUNCTION public.update_comment_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_like THEN
      UPDATE public.comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    ELSE
      -- For dislikes, we'll need a separate dislike_count column or just track likes
      -- For now, let's just update the like_count (positive votes - negative votes)
      UPDATE public.comments 
      SET like_count = (
        SELECT COALESCE(SUM(CASE WHEN is_like THEN 1 ELSE -1 END), 0)
        FROM public.comment_votes
        WHERE comment_id = NEW.comment_id
      )
      WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_like THEN
      UPDATE public.comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.comment_id;
    ELSE
      UPDATE public.comments 
      SET like_count = (
        SELECT COALESCE(SUM(CASE WHEN is_like THEN 1 ELSE -1 END), 0)
        FROM public.comment_votes
        WHERE comment_id = OLD.comment_id
      )
      WHERE id = OLD.comment_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If vote changed from like to dislike or vice versa
    IF OLD.is_like AND NOT NEW.is_like THEN
      UPDATE public.comments SET like_count = like_count - 2 WHERE id = NEW.comment_id; -- Subtract 2 (remove like, add dislike)
    ELSIF NOT OLD.is_like AND NEW.is_like THEN
      UPDATE public.comments SET like_count = like_count + 2 WHERE id = NEW.comment_id; -- Add 2 (remove dislike, add like)
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger for comment votes
CREATE TRIGGER on_comment_vote_change
  AFTER INSERT OR UPDATE OR DELETE ON public.comment_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_comment_like_count();