import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import MobileBottomNav from "./MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
  hideBottomNav?: boolean;
}

const Layout = ({ children, hideBottomNav = false }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      {!isMobile && <Sidebar isOpen={sidebarOpen} />}
      <main
        className={cn(
          "pt-14 transition-all duration-200",
          isMobile ? "ml-0 pb-16" : (sidebarOpen ? "ml-60" : "ml-[72px]")
        )}
      >
        {children}
      </main>
      {isMobile && !hideBottomNav && <MobileBottomNav />}
    </div>
  );
};

export default Layout;
