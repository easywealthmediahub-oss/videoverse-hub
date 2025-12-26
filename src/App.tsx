import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import FaviconUpdater from "@/components/FaviconUpdater";
import Index from "./pages/Index";
import Watch from "./pages/Watch";
import Auth from "./pages/Auth";
import Channel from "./pages/Channel";
import Upload from "./pages/Upload";
import Search from "./pages/Search";
import Dashboard from "./pages/Dashboard";
import Subscriptions from "./pages/Subscriptions";
import Playlists from "./pages/Playlists";
import History from "./pages/History";
import Explore from "./pages/Explore";
import Trending from "./pages/Trending";
import Music from "./pages/Music";
import Gaming from "./pages/Gaming";
import News from "./pages/News";
import Sports from "./pages/Sports";
import LikedVideos from "./pages/LikedVideos";
import Shorts from "./pages/Shorts";
import ChannelSettings from "./pages/ChannelSettings";
import NotFound from "./pages/NotFound";
import Studio from "./pages/Studio";
import Playlist from "./pages/Playlist";
import StudioDashboard from "./pages/studio/StudioDashboard";
import StudioContent from "./pages/studio/StudioContent";
import StudioPlaylists from "./pages/studio/StudioPlaylists";
import StudioAnalytics from "./pages/studio/StudioAnalytics";
import StudioComments from "./pages/studio/StudioComments";
import StudioEarn from "./pages/studio/StudioEarn";
import StudioSettings from "./pages/studio/StudioSettings";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminContent from "./pages/admin/AdminContent";
import AdminComments from "./pages/admin/AdminComments";
import AdminMonetization from "./pages/admin/AdminMonetization";
import AdminSettings from "./pages/admin/AdminSettings";
import Profile from "./pages/Profile";
import Shop from "./pages/Shop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <SiteSettingsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <FaviconUpdater />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/watch/:id" element={<Watch />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/channel/:id" element={<Channel />} />
                <Route path="/c/:id" element={<Channel />} />
                <Route path="/channel/settings" element={<ChannelSettings />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/search" element={<Search />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/subscriptions" element={<Subscriptions />} />
                <Route path="/playlists" element={<Playlists />} />
                <Route path="/playlist/:id" element={<Playlist />} />
                <Route path="/history" element={<History />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/trending" element={<Trending />} />
                <Route path="/music" element={<Music />} />
                <Route path="/gaming" element={<Gaming />} />
                <Route path="/news" element={<News />} />
                <Route path="/sports" element={<Sports />} />
                <Route path="/liked" element={<LikedVideos />} />
                <Route path="/shorts" element={<Shorts />} />
                <Route path="/shop" element={<Shop />} />
                {/* Studio Routes */}
                <Route path="/studio" element={<Studio />}>
                  <Route index element={<StudioDashboard />} />
                  <Route path="content" element={<StudioContent />} />
                  <Route path="playlists" element={<StudioPlaylists />} />
                  <Route path="analytics" element={<StudioAnalytics />} />
                  <Route path="comments" element={<StudioComments />} />
                  <Route path="earn" element={<StudioEarn />} />
                  <Route path="settings" element={<StudioSettings />} />
                </Route>
                {/* Admin Routes */}
                <Route path="/admin" element={<Admin />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="content" element={<AdminContent />} />
                  <Route path="comments" element={<AdminComments />} />
                  <Route path="monetization" element={<AdminMonetization />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </SiteSettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
