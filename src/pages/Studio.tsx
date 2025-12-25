import { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Video, 
  BarChart3, 
  DollarSign, 
  MessageSquare, 
  Settings,
  Menu,
  X,
  Upload,
  Play,
  ListVideo
} from 'lucide-react';
import { cn } from '@/lib/utils';

const studioNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/studio' },
  { icon: Video, label: 'Content', path: '/studio/content' },
  { icon: ListVideo, label: 'Playlists', path: '/studio/playlists' },
  { icon: BarChart3, label: 'Analytics', path: '/studio/analytics' },
  { icon: MessageSquare, label: 'Comments', path: '/studio/comments' },
  { icon: DollarSign, label: 'Earn', path: '/studio/earn' },
  { icon: Settings, label: 'Settings', path: '/studio/settings' },
];

export default function Studio() {
  const { user, loading } = useAuth();
  const { channel } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-card border-r border-border z-50 transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          {sidebarOpen && (
            <Link to="/" className="flex items-center gap-2">
              <Play className="h-6 w-6 text-primary fill-primary" />
              <span className="font-bold text-lg text-foreground">Studio</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        <nav className="p-2 space-y-1">
          {studioNavItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/studio' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {sidebarOpen && (
          <div className="absolute bottom-4 left-4 right-4">
            <Button asChild className="w-full gap-2">
              <Link to="/upload">
                <Upload className="h-4 w-4" />
                Upload
              </Link>
            </Button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        sidebarOpen ? "ml-64" : "ml-16"
      )}>
        <Outlet />
      </main>
    </div>
  );
}