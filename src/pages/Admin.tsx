import { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  LayoutDashboard, 
  Users, 
  Video, 
  MessageSquare, 
  Settings,
  Menu,
  X,
  Shield,
  DollarSign,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: Video, label: 'Content', path: '/admin/content' },
  { icon: MessageSquare, label: 'Comments', path: '/admin/comments' },
  { icon: DollarSign, label: 'Monetization', path: '/admin/monetization' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
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

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b border-border">
        {sidebarOpen && (
          <Link to="/admin" className="flex items-center gap-2" onClick={onNavigate}>
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg text-foreground">Admin</span>
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

      <nav className="p-2 space-y-1 flex-1">
        {adminNavItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/admin' && location.pathname.startsWith(item.path));
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
        <div className="p-4 border-t border-border">
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

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      checkAdminRole();
    }
  }, [user, loading, navigate]);

  const checkAdminRole = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (data) {
      setIsAdmin(true);
    } else {
      navigate('/');
    }
    setCheckingAdmin(false);
  };

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access this area.</p>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

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
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-bold text-foreground">Admin Panel</span>
          </div>

          <div className="w-10" /> {/* Spacer for alignment */}
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
