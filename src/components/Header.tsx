import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";

export const Header = () => {
  return (
    <header className="w-full bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">School Smart Pakistan</h1>
            <p className="text-xs text-muted-foreground">School Management System</p>
          </div>
        </Link>
      </div>
    </header>
  );
};
