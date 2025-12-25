import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Search, Upload, Bell, User, LogOut, LayoutDashboard, Settings, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, signOut } = useAuth();
  const { profile, channel } = useProfile();
  const { isAdmin } = useUserRole();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-14 px-4 bg-background border-b border-border">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="hover:bg-accent">
          <Menu className="h-5 w-5" />
        </Button>
        <Link to="/" className="flex items-center gap-1">
          <div 
            className={`rounded-full p-1.5 flex items-center justify-center w-8 h-8 ${settings.logo_background_color || 'bg-primary'}`}
            style={settings.logo_background_color && !settings.logo_background_color.startsWith('bg-') ? { backgroundColor: settings.logo_background_color } : {}}
          >
            {settings.logo_url ? (
              <img 
                src={settings.logo_url} 
                alt="Logo" 
                className="w-5 h-5 rounded-full object-cover" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; // prevents looping
                  target.style.display = 'none';
                  
                  // If logo URL is a single character, display it as text
                  if (settings.logo_url.length === 1) {
                    const parent = target.parentElement;
                    if (parent) {
                      const span = document.createElement('span');
                      span.textContent = settings.logo_url;
                      span.className = 'text-lg font-bold text-primary-foreground';
                      parent.appendChild(span);
                    }
                  } else {
                    // Fallback to default SVG
                    const parent = target.parentElement;
                    if (parent) {
                      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                      svg.setAttribute('viewBox', '0 0 24 24');
                      svg.setAttribute('className', 'h-5 w-5 text-primary-foreground fill-current');
                      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                      path.setAttribute('d', 'M10 8l6 4-6 4V8z');
                      svg.appendChild(path);
                      parent.appendChild(svg);
                    }
                  }
                }}
              />
            ) : (
              // If no logo URL, try to get the first letter of site name
              settings.site_name && settings.site_name.length > 0 ? (
                <span className="text-lg font-bold text-primary-foreground">
                  {settings.site_name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary-foreground fill-current">
                  <path d="M10 8l6 4-6 4V8z" />
                </svg>
              )
            )}
          </div>
          <span className="ml-1 text-xl font-semibold tracking-tight text-foreground">
            {settings.site_name || 'VideoHub'}
          </span>
        </Link>
      </div>

      <form onSubmit={handleSearch} className="hidden sm:flex items-center flex-1 max-w-2xl mx-4">
        <div className="flex w-full">
          <Input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-r-none border-r-0 focus-visible:ring-0"
          />
          <Button type="submit" variant="secondary" className="rounded-l-none border border-l-0 border-input px-6">
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </form>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        
        {user ? (
          <>
            <Link to="/upload">
              <Button variant="ghost" size="icon">
                <Upload className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground">{profile?.display_name || profile?.username}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                {channel && (
                  <DropdownMenuItem asChild>
                    <Link to={`/channel/${channel.id}`} className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" /> Your channel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/studio" className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" /> Studio
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" /> Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="flex items-center gap-2 text-destructive">
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;
