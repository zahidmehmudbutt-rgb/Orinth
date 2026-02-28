import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Menu, X, ChevronDown, Download, Share } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const navLinkKeys = [
  { labelKey: "header.features", href: "#features" },
  { labelKey: "header.portals", href: "#portals" },
  { labelKey: "header.faq", href: "#faq" },
];

const portalLinkKeys = [
  { labelKey: "roles.student", href: "/student/login" },
  { labelKey: "roles.teacher", href: "/teacher/login" },
  { labelKey: "roles.classTeacher", href: "/class-teacher/login" },
  { labelKey: "roles.coordinator", href: "/coordinator/login" },
  { labelKey: "roles.principal", href: "/principal/login" },
  { labelKey: "roles.parent", href: "/parent/login" },
];

export const Header = () => {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const { canInstall, install, isIOS, isStandalone } = usePWAInstall();
  const [showIOSTip, setShowIOSTip] = useState(false);

  // Track scroll for header shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mobile menu: Escape key handler + focus trap
  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        hamburgerRef.current?.focus();
        return;
      }

      if (e.key !== "Tab" || !mobileMenuRef.current) return;

      const focusableSelector = 'a[href], button, [tabindex]:not([tabindex="-1"])';
      const focusableElements = mobileMenuRef.current.querySelectorAll(focusableSelector);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Focus first link when menu opens
    const timer = setTimeout(() => {
      const firstFocusable = mobileMenuRef.current?.querySelector('a[href], button') as HTMLElement;
      firstFocusable?.focus();
    }, 50);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <header className={`w-full bg-card/80 dark:bg-card/70 backdrop-blur-xl border-b sticky top-0 z-50 transition-all duration-300 ${scrolled ? "border-border dark:border-white/[0.08] shadow-card-hover" : "border-transparent"}`}>
      {/* Skip to main content - visible on focus for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium"
      >
        {t("header.skipToContent")}
      </a>
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
          {navLinkKeys.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="nav-link-animated px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t(link.labelKey)}
            </a>
          ))}
        </nav>

        {/* Desktop Right Side */}
        <div className="hidden lg:flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />

          {/* Install App Button */}
          {!isStandalone && canInstall && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={install}>
              <Download className="w-3.5 h-3.5" />
              {t("header.installApp")}
            </Button>
          )}
          {!isStandalone && isIOS && !canInstall && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowIOSTip((v) => !v)}
            >
              <Share className="w-3.5 h-3.5" />
              {t("header.installApp")}
            </Button>
          )}

          {/* Login Dropdown — Radix DropdownMenu for full keyboard accessibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 group">
                {t("header.login")}
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-data-[state=open]:rotate-180" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("header.loginPortals")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {portalLinkKeys.map((link) => (
                <DropdownMenuItem key={link.href} asChild>
                  <Link to={link.href} className="w-full cursor-pointer">
                    {t(link.labelKey)} {t("header.portal")}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Right Side */}
        <div className="flex lg:hidden items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <Button
            ref={hamburgerRef}
            variant="ghost"
            size="icon"
            aria-label={t("header.toggleMenu")}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* iOS Install Tip */}
      {showIOSTip && (
        <div className="absolute top-full right-4 mt-2 w-72 bg-card border border-border rounded-xl shadow-lg p-4 z-50">
          <p className="text-sm font-medium text-foreground mb-2">{t("header.installIOS")}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("header.iosInstallTip")}
          </p>
          <Button size="sm" variant="ghost" className="mt-2 text-xs h-7" onClick={() => setShowIOSTip(false)}>
            {t("header.gotIt")}
          </Button>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          ref={mobileMenuRef}
          id="mobile-menu"
          role="navigation"
          aria-label={t("header.mobileNav")}
          className="lg:hidden border-t border-border bg-card/95 backdrop-blur-md"
        >
          <div className="container mx-auto px-4 py-4 space-y-1">
            {navLinkKeys.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                onClick={closeMobile}
              >
                {t(link.labelKey)}
              </a>
            ))}

            {/* Mobile Install Button */}
            {!isStandalone && canInstall && (
              <button
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-primary hover:bg-muted rounded-lg transition-colors"
                onClick={() => { install(); closeMobile(); }}
              >
                <Download className="w-4 h-4" />
                {t("header.installApp")}
              </button>
            )}
            {!isStandalone && isIOS && !canInstall && (
              <div className="px-3 py-2.5 text-sm text-muted-foreground rounded-lg bg-muted/50">
                <p className="font-medium text-foreground flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  {t("header.installApp")}
                </p>
                <p className="text-xs mt-1">
                  {t("header.iosInstallTip")}
                </p>
              </div>
            )}

            <div className="border-t border-border pt-3 mt-3">
              <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("header.loginPortals")}</p>
              {portalLinkKeys.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  onClick={closeMobile}
                >
                  {t(link.labelKey)}
                </Link>
              ))}
            </div>

          </div>
        </div>
      )}
    </header>
  );
};
