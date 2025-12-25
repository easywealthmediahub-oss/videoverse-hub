import { Link, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

interface SidebarProps {
  isOpen: boolean;
}

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

const Sidebar = ({ isOpen }: SidebarProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin, loading } = useUserRole();

  const NavItem = ({
    icon: Icon,
    label,
    path,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    path: string;
  }) => {
    const isActive = location.pathname === path;
    
    return (
      <Link
        to={path}
        className={cn(
          "flex items-center gap-5 px-3 py-2.5 rounded-lg transition-colors hover:bg-accent",
          isActive && "bg-accent font-medium"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {isOpen && <span className="text-sm">{label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-background border-r border-border transition-all duration-200 overflow-y-auto z-40",
        isOpen ? "w-60" : "w-[72px]"
      )}
    >
      <nav className="p-2">
        {/* Main Links */}
        <div className="pb-3">
          {mainLinks.map((link) => (
            <NavItem key={link.path} {...link} />
          ))}
        </div>

        {isOpen && (
          <>
            {/* Library */}
            <div className="border-t border-border pt-3 pb-3">
              <h3 className="px-3 mb-2 text-sm font-medium text-muted-foreground">
                Library
              </h3>
              {libraryLinks.map((link) => (
                <NavItem key={link.path} {...link} />
              ))}
            </div>

            {/* Creator Tools */}
            {user && (
              <div className="border-t border-border pt-3 pb-3">
                <h3 className="px-3 mb-2 text-sm font-medium text-muted-foreground">
                  Creator Tools
                </h3>
                <NavItem icon={LayoutDashboard} label="Studio" path="/studio" />
              </div>
            )}

            {/* Admin */}
            {user && isAdmin && (
              <div className="border-t border-border pt-3 pb-3">
                <h3 className="px-3 mb-2 text-sm font-medium text-muted-foreground">
                  Admin
                </h3>
                <NavItem icon={Settings} label="Admin Panel" path="/admin" />
              </div>
            )}

            {/* Explore */}
            <div className="border-t border-border pt-3">
              <h3 className="px-3 mb-2 text-sm font-medium text-muted-foreground">
                Explore
              </h3>
              {exploreLinks.map((link) => (
                <NavItem key={link.path} {...link} />
              ))}
            </div>
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
