-- Add playlists storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('playlists', 'playlists', true);

-- Add storage policies for playlists
CREATE POLICY "Anyone can view playlist thumbnails" ON storage.objects FOR SELECT USING (bucket_id = 'playlists');

CREATE POLICY "Authenticated users can upload playlist thumbnails" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'playlists' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own playlist thumbnails" ON storage.objects FOR UPDATE USING (bucket_id = 'playlists' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own playlist thumbnails" ON storage.objects FOR DELETE USING (bucket_id = 'playlists' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Down migration
DELETE FROM storage.buckets WHERE id = 'playlists';

DROP POLICY IF EXISTS "Anyone can view playlist thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload playlist thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own playlist thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own playlist thumbnails" ON storage.objects;