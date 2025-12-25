import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <h1 className="text-[150px] font-bold text-muted-foreground/20 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-primary/10 rounded-full p-8">
              <svg 
                viewBox="0 0 24 24" 
                className="w-16 h-16 text-primary"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
                <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" />
                <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" />
              </svg>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-3">
          Page not found
        </h2>
        <p className="text-muted-foreground mb-8">
          Sorry, we couldn't find the page you're looking for. The page might have been removed, renamed, or doesn't exist.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default" className="gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              Go to Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/search">
              <Search className="w-4 h-4" />
              Search Videos
            </Link>
          </Button>
        </div>

        <Button 
          variant="ghost" 
          className="mt-6 gap-2 text-muted-foreground"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4" />
          Go back
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
