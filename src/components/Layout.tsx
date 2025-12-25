import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  useEffect(() => {
    const handleResize = () => {
      // On mobile screens, close sidebar by default
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />
      <main
        className={cn(
          "pt-14 transition-all duration-200",
          sidebarOpen && window.innerWidth >= 768 ? "ml-60" : "ml-[72px]"
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;
