import { Link, useLocation } from "react-router-dom";
import { Home, Zap, PlusCircle, PlaySquare, Library } from "lucide-react";
import { cn } from "@/lib/utils";

const MobileBottomNav = () => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Zap, label: "Shorts", path: "/shorts" },
    { icon: PlusCircle, label: "", path: "/upload", isCreate: true },
    { icon: PlaySquare, label: "Subscriptions", path: "/subscriptions" },
    { icon: Library, label: "Library", path: "/history" },
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
