import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { FadeIn } from "@/components/ui/motion-wrapper";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero relative overflow-hidden">
      <div className="floating-shapes">
        <div className="floating-shape" />
        <div className="floating-shape" />
        <div className="floating-shape" />
      </div>
      <FadeIn className="text-center relative z-10">
        <div className="text-8xl font-bold text-gradient mb-4">404</div>
        <p className="text-xl text-muted-foreground mb-8">Oops! Page not found</p>
        <Button asChild>
          <Link to="/" className="inline-flex items-center gap-2">
            <Home className="w-4 h-4" />
            Return to Home
          </Link>
        </Button>
      </FadeIn>
    </div>
  );
};

export default NotFound;
