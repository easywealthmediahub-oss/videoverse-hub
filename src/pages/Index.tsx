<<<<<<< HEAD
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import CategoryChips from "@/components/CategoryChips";
import VideoCard from "@/components/VideoCard";
import { supabase } from "@/integrations/supabase/client";
import { Video, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface VideoData {
  id: string;
  title: string;
  thumbnail_url: string | null;
  view_count: number;
  created_at: string;
  duration: number;
  channel: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

const Index = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        channel:channels(id, name, avatar_url)
      `)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setVideos(data as any);
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="p-0 md:p-6">
        <div className="px-3 md:px-0">
          <CategoryChips />
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-0 md:gap-4">
            {videos.map((video) => (
              <div key={video.id} className="pb-4 md:pb-0">
                <VideoCard
                  id={video.id}
                  title={video.title}
                  thumbnail={video.thumbnail_url || '/placeholder.svg'}
                  channelName={video.channel.name}
                  channelAvatar={video.channel.avatar_url || undefined}
                  views={video.view_count}
                  timestamp={video.created_at}
                  duration={video.duration}
                  channelId={video.channel.id}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
            <div className="bg-muted rounded-full p-6 mb-6">
              <Video className="w-16 h-16 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              No videos yet
            </h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Be the first to upload a video! Share your content with the world and start building your audience.
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link to="/upload">
                <Upload className="w-5 h-5" />
                Upload Video
              </Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
=======
import { useEffect, useRef, useMemo } from "react";
import Header from "@/components/Header";
import Section from "@/components/Section";
import ArticlePreview from "@/components/ArticlePreview";
import BlogHero from "@/components/BlogHero";
import WavyBackground from "@/components/WavyBackground";
import {
  GridContainer,
  GridContent,
  GridWrapper,
} from "@/components/GridContainer";
import { articlesData } from "@/data/articles";

const Index = () => {
  const articlesRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fadeInUp");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    articlesRef.current.forEach((article) => {
      if (article) observer.observe(article);
    });

    return () => observer.disconnect();
  }, []);

  // Transform articlesData into the format needed for the article grid
  const allArticles = useMemo(() => {
    return Object.values(articlesData).map((article) => ({
      title: article.title,
      image: article.heroImage,
      publishDate: article.publishDate,
      slug: article.slug,
    }));
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      <WavyBackground />
      <Header />

      <Section>
        <GridWrapper>
          <GridContent className="!mt-0 !mb-0">
            <BlogHero
              title="Voyager"
              description="Voyager Press is a modern travel and lifestyle newsroom that showcases inspiring stories, destination features, and travel industry updates."
            />
          </GridContent>
        </GridWrapper>
      </Section>

      {/* Articles Section - Accordion Grid */}
      <Section>
        <GridWrapper>
          <GridContent>
            <div className="article-full-width">
              <ul className="article-two-columns">
                {allArticles.map((article, index) => (
                  <li
                    key={index}
                    ref={(el) => (articlesRef.current[index] = el)}
                    className="blog-feed__item"
                    style={{
                      animationDelay: `${(index % 2) * 150}ms`,
                    }}
                  >
                    <ArticlePreview
                      title={article.title}
                      slug={article.slug}
                      image={article.image}
                      imageAlt={article.title}
                      publishDate={article.publishDate}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </GridContent>
        </GridWrapper>
      </Section>

      {/* Footer */}
      <footer className="border-t border-border mt-24">
        <div className="article-grid py-12">
          <div className="article-hero text-center text-sm text-muted-foreground">
            <p>© 2024 Voyager Press. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
>>>>>>> 082e1cdd5207865191de63322e9ac1b350ae7043
  );
};

export default Index;
