import { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
  ListVideo,
  Home,
  ChevronLeft
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

function SidebarContent({ 
  sidebarOpen, 
  setSidebarOpen,
  onNavigate 
}: { 
  sidebarOpen: boolean; 
  setSidebarOpen: (open: boolean) => void;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const { channel } = useProfile();

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b border-border">
        {sidebarOpen && (
          <Link to="/" className="flex items-center gap-2" onClick={onNavigate}>
            <Play className="h-6 w-6 text-primary fill-primary" />
            <span className="font-bold text-lg text-foreground">Studio</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden md:flex"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Channel Info */}
      {sidebarOpen && channel && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={channel.avatar_url || ''} />
              <AvatarFallback>{channel.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="font-medium text-foreground truncate">{channel.name}</p>
              <p className="text-xs text-muted-foreground">Your channel</p>
            </div>
          </div>
        </div>
      )}

      <nav className="p-2 space-y-1 flex-1">
        {studioNavItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/studio' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {sidebarOpen && (
        <div className="p-4 space-y-2 border-t border-border">
          <Button asChild className="w-full gap-2">
            <Link to="/upload" onClick={onNavigate}>
              <Upload className="h-4 w-4" />
              Upload Video
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full gap-2">
            <Link to="/" onClick={onNavigate}>
              <Home className="h-4 w-4" />
              Back to Site
            </Link>
          </Button>
        </div>
      )}
    </>
  );
}

export default function Studio() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(true); // Always show full content in mobile sheet
    }
  }, [isMobile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col">
              <SidebarContent 
                sidebarOpen={true} 
                setSidebarOpen={setSidebarOpen} 
                onNavigate={() => setMobileSheetOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary fill-primary" />
            <span className="font-bold text-foreground">Studio</span>
          </div>

          <Button variant="ghost" size="icon" asChild>
            <Link to="/upload">
              <Upload className="h-5 w-5" />
            </Link>
          </Button>
        </header>

        {/* Mobile Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-card border-r border-border z-50 transition-all duration-300 flex flex-col",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        <SidebarContent sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 min-h-screen",
        sidebarOpen ? "ml-64" : "ml-16"
      )}>
        <Outlet />
      </main>
    </div>
  );
}
