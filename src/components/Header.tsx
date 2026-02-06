import { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Menu, X, ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Portals", href: "#portals" },
  { label: "FAQ", href: "#faq" },
];

const portalLinks = [
  { label: "Student", href: "/student/login" },
  { label: "Teacher", href: "/teacher/login" },
  { label: "Class Teacher", href: "/class-teacher/login" },
  { label: "Coordinator", href: "/coordinator/login" },
  { label: "Principal", href: "/principal/login" },
  { label: "Parent", href: "/parent/login" },
];

export const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <header className="w-full bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-foreground leading-tight">School Smart</h1>
            <p className="text-xs text-muted-foreground leading-tight">Pakistan</p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Right Side */}
        <div className="hidden lg:flex items-center gap-2">
          <ThemeToggle />

          {/* Login Dropdown */}
          <div
            className="relative"
            onMouseLeave={() => setLoginOpen(false)}
          >
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setLoginOpen(!loginOpen)}
            >
              Login
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${loginOpen ? "rotate-180" : ""}`} />
            </Button>
            {loginOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-card-hover py-2 z-50">
                {portalLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    onClick={() => setLoginOpen(false)}
                  >
                    {link.label} Portal
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Mobile Right Side */}
        <div className="flex lg:hidden items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-card/95 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}

            <div className="border-t border-border pt-3 mt-3">
              <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Login Portals</p>
              {portalLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>

          </div>
        </div>
      )}
    </header>
  );
};
