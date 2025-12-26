import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function Shop() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Shop</h1>
          <p className="text-lg text-muted-foreground mb-8">Welcome to our shop! More content coming soon.</p>
          
          {user ? (
            <div className="space-y-4">
              <p className="text-foreground">You are logged in. Browse our products below.</p>
              <Button asChild>
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-foreground">Please sign in to access the shop.</p>
              <Button asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}