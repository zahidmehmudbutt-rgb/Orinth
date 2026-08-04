import { Sparkles } from "lucide-react";

/**
 * Slim banner announcing that this is a live demo and that credentials are
 * pre-filled. A visitor who lands here otherwise meets a login wall with no
 * obvious way through, and leaves without seeing the product.
 *
 * Deliberately not translated: this addresses someone evaluating the build,
 * not an end user of the school.
 */
export const DemoBanner = () => (
  <div className="border-b border-border bg-primary/[0.06]">
    <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-2 text-center">
      <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
      <span className="text-xs font-medium text-foreground">Live demo</span>
      <span className="text-xs text-muted-foreground">
        — open any portal below; the demo login is filled in for you when you tap the email field.
      </span>
      <a
        href="#portals"
        className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
      >
        Choose a portal
      </a>
    </div>
  </div>
);
