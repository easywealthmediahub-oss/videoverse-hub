import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Home, 
  Compass, 
  PlaySquare, 
  Clock, 
  ThumbsUp, 
  Flame, 
  Music2, 
  Gamepad2, 
  Newspaper, 
  Trophy, 
  Zap, 
  LayoutDashboard,
  Settings,
  Menu
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

const MobileNavDrawer = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [isOpen, setIsOpen] = useState(false);

  const mainLinks = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Zap, label: "Shorts", path: "/shorts" },
    { icon: Compass, label: "Explore", path: "/explore" },
    { icon: PlaySquare, label: "Subscriptions", path: "/subscriptions" },
  ];

  const libraryLinks = [
    { icon: Clock, label: "History", path: "/history" },
    { icon: ThumbsUp, label: "Liked Videos", path: "/liked" },
  ];

  const exploreLinks = [
    { icon: Flame, label: "Trending", path: "/trending" },
    { icon: Music2, label: "Music", path: "/music" },
    { icon: Gamepad2, label: "Gaming", path: "/gaming" },
    { icon: Newspaper, label: "News", path: "/news" },
    { icon: Trophy, label: "Sports", path: "/sports" },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col h-full pt-4">
          {/* Main Links */}
          <div className="px-2 py-3">
            {mainLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-accent"
                onClick={() => setIsOpen(false)}
              >
                <link.icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Library */}
          <div className="px-2 py-3 border-t border-border">
            <h3 className="px-3 mb-2 text-sm font-medium text-muted-foreground">
              Library
            </h3>
            {libraryLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-accent"
                onClick={() => setIsOpen(false)}
              >
                <link.icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Creator Tools */}
          {user && (
            <div className="px-2 py-3 border-t border-border">
              <h3 className="px-3 mb-2 text-sm font-medium text-muted-foreground">
                Creator Tools
              </h3>
              <Link
                to="/studio"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-accent"
                onClick={() => setIsOpen(false)}
              >
                <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">Studio</span>
              </Link>
            </div>
          )}

          {/* Admin */}
          {user && isAdmin && (
            <div className="px-2 py-3 border-t border-border">
              <h3 className="px-3 mb-2 text-sm font-medium text-muted-foreground">
                Admin
              </h3>
              <Link
                to="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-accent"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">Admin Panel</span>
              </Link>
            </div>
          )}

          {/* Explore */}
          <div className="px-2 py-3 border-t border-border flex-1">
            <h3 className="px-3 mb-2 text-sm font-medium text-muted-foreground">
              Explore
            </h3>
            {exploreLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-accent"
                onClick={() => setIsOpen(false)}
              >
                <link.icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavDrawer;