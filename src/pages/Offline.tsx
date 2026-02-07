import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const Offline = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero relative overflow-hidden">
      <div className="floating-shapes">
        <div className="floating-shape" />
        <div className="floating-shape" />
        <div className="floating-shape" />
      </div>
      <div className="text-center relative z-10 px-4">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">You're Offline</h1>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          Please check your internet connection and try again.
        </p>
        <Button onClick={() => window.location.reload()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
};

export default Offline;
