import { Helmet } from "react-helmet-async";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FadeIn } from "@/components/ui/motion-wrapper";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

function NotFoundIllustration() {
  return (
    <svg
      className="w-72 h-72 sm:w-80 sm:h-80"
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Background circle */}
      <circle cx="200" cy="150" r="130" className="fill-primary/5" />
      <circle cx="200" cy="150" r="100" className="fill-primary/[0.03]" />

      {/* Decorative floating circles */}
      <circle cx="60" cy="60" r="8" className="fill-primary/10" />
      <circle cx="340" cy="80" r="12" className="fill-primary/10" />
      <circle cx="50" cy="220" r="6" className="fill-muted-foreground/10" />
      <circle cx="350" cy="230" r="10" className="fill-muted-foreground/10" />
      <circle cx="320" cy="50" r="5" className="fill-primary/15" />
      <circle cx="80" cy="250" r="9" className="fill-primary/10" />

      {/* Decorative lines */}
      <line
        x1="55"
        y1="120"
        x2="75"
        y2="120"
        className="stroke-primary/15"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="325"
        y1="160"
        x2="355"
        y2="160"
        className="stroke-primary/15"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="340"
        y1="170"
        x2="360"
        y2="170"
        className="stroke-muted-foreground/10"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Main "404" text - stylized with outlined and filled characters */}
      {/* "4" left */}
      <text
        x="110"
        y="175"
        className="fill-primary/20 stroke-primary/40"
        strokeWidth="1.5"
        fontSize="96"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
        textAnchor="middle"
      >
        4
      </text>

      {/* "0" center */}
      <text
        x="200"
        y="175"
        className="fill-primary/10 stroke-primary/30"
        strokeWidth="1.5"
        fontSize="96"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
        textAnchor="middle"
      >
        0
      </text>

      {/* "4" right */}
      <text
        x="290"
        y="175"
        className="fill-primary/20 stroke-primary/40"
        strokeWidth="1.5"
        fontSize="96"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
        textAnchor="middle"
      >
        4
      </text>

      {/* Magnifying glass over the "0" */}
      <circle
        cx="200"
        cy="145"
        r="38"
        className="stroke-primary/30"
        strokeWidth="3"
        fill="none"
      />
      <line
        x1="227"
        y1="173"
        x2="252"
        y2="198"
        className="stroke-primary/30"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Question mark inside magnifying glass */}
      <text
        x="200"
        y="158"
        className="fill-primary/40"
        fontSize="36"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
        textAnchor="middle"
      >
        ?
      </text>

      {/* Broken path / road decorations at bottom */}
      <line
        x1="120"
        y1="220"
        x2="170"
        y2="220"
        className="stroke-muted-foreground/15"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="195"
        y1="220"
        x2="210"
        y2="220"
        className="stroke-muted-foreground/15"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="230"
        y1="220"
        x2="280"
        y2="220"
        className="stroke-muted-foreground/15"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Small dots scattered */}
      <circle cx="150" cy="80" r="3" className="fill-primary/10" />
      <circle cx="260" cy="90" r="2" className="fill-primary/15" />
      <circle cx="130" cy="240" r="3" className="fill-muted-foreground/10" />
      <circle cx="270" cy="240" r="2" className="fill-muted-foreground/10" />
    </svg>
  );
}

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (import.meta.env.DEV)
      console.error(
        "404 Error: User attempted to access non-existent route:",
        location.pathname,
      );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 relative overflow-hidden">
      <Helmet>
        <title>Page Not Found — School Smart Pakistan</title>
      </Helmet>

      {/* Gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute w-[500px] h-[500px] -top-40 -right-40 rounded-full bg-primary/5 blur-[100px] animate-[mesh-drift_20s_ease-in-out_infinite]" />
        <div className="absolute w-[400px] h-[400px] -bottom-32 -left-32 rounded-full bg-accent/5 blur-[100px] animate-[mesh-drift_25s_ease-in-out_infinite_-8s]" />
      </div>
      {/* Dot grid background */}
      <div className="pointer-events-none absolute inset-0 bg-dot-grid" />

      <FadeIn className="relative z-10 flex flex-col items-center text-center max-w-lg">
        {/* Illustration */}
        <div className="animate-float mb-6">
          <NotFoundIllustration />
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-bold heading-gradient mb-3">
          {t("notFound.title", "Page Not Found")}
        </h1>

        {/* Description */}
        <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-md leading-relaxed">
          {t(
            "notFound.description",
            "Sorry, the page you are looking for doesn't exist or has been moved. Let's get you back on track.",
          )}
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button asChild size="lg" className="btn-glow">
            <Link to="/" className="inline-flex items-center gap-2">
              <Home className="w-4 h-4" />
              {t("notFound.backHome", "Go Home")}
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("notFound.goBack", "Go Back")}
          </Button>
        </div>
      </FadeIn>
    </div>
  );
};

export default NotFound;
