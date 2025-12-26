import { Link, useLocation } from 'react-router-dom';
import { Home, Film, PlusSquare, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { channel: profileChannel } = useProfile();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Film, label: "Shorts", path: "/shorts" },
    { icon: PlusSquare, label: "", path: "/upload", isCreate: true },
    { icon: ShoppingBag, label: "Shop", path: "/shop" },
    { label: "You", path: user ? '/profile' : '/auth', isAvatar: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.isCreate) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center -mt-3"
              >
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
              </Link>
            );
          }

          if (item.isAvatar) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1",
                  location.pathname === item.path ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img 
                    src={profileChannel?.avatar_url || `https://ui-avatars.com/api/?name=${profileChannel?.name || user?.email?.split('@')[0]}&background=0D8ABC&color=fff`} 
                    alt="User Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          }
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-foreground")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
