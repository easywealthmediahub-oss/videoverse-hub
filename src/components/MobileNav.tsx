import { useState, useEffect } from 'react';
import { Home, Film, Plus, User, Video } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const MobileNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 md:hidden">
      <div className="flex items-center justify-around py-1">
        <Link to="/" className="flex flex-col items-center gap-1 flex-1 py-1">
          <Button
            variant={location.pathname === '/' ? 'default' : 'ghost'}
            size="sm"
            className="h-10 w-10 p-0 rounded-full"
          >
            <Home className="h-5 w-5" />
          </Button>
          <span className="text-xs mt-1 text-muted-foreground">
            Home
          </span>
        </Link>
        
        <Link to="/shorts" className="flex flex-col items-center gap-1 flex-1 py-1">
          <Button
            variant={location.pathname === '/shorts' ? 'default' : 'ghost'}
            size="sm"
            className="h-10 w-10 p-0 rounded-full"
          >
            <Film className="h-5 w-5" />
          </Button>
          <span className="text-xs mt-1 text-muted-foreground">
            Shorts
          </span>
        </Link>
        
        <Link to="/upload" className="flex flex-col items-center gap-1 flex-1 py-1">
          <Button
            variant={location.pathname === '/upload' ? 'default' : 'ghost'}
            size="sm"
            className="h-12 w-12 p-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
          >
            <Plus className="h-6 w-6" />
          </Button>
          <span className="text-xs mt-1 text-muted-foreground">
            Upload
          </span>
        </Link>
        
        <Link to="/studio" className="flex flex-col items-center gap-1 flex-1 py-1">
          <Button
            variant={location.pathname === '/studio' ? 'default' : 'ghost'}
            size="sm"
            className="h-10 w-10 p-0 rounded-full"
          >
            <Video className="h-5 w-5" />
          </Button>
          <span className="text-xs mt-1 text-muted-foreground">
            Studio
          </span>
        </Link>
        
        <Link to={user ? "/profile" : "/auth"} className="flex flex-col items-center gap-1 flex-1 py-1">
          <Button
            variant={location.pathname === '/profile' || location.pathname === '/auth' ? 'default' : 'ghost'}
            size="sm"
            className="h-10 w-10 p-0 rounded-full"
          >
            <User className="h-5 w-5" />
          </Button>
          <span className="text-xs mt-1 text-muted-foreground">
            Profile
          </span>
        </Link>
      </div>
    </div>
  );
};

export default MobileNav;