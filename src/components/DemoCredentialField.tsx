import { useEffect, useRef, useState, type ReactNode } from "react";
import { KeyRound } from "lucide-react";
import type { DemoCredential } from "@/lib/demo-credentials";

interface DemoCredentialFieldProps {
  credential: DemoCredential;
  /** Fills both the identifier and password fields on the parent form. */
  onFill: () => void;
  children: ReactNode;
}

/**
 * Wraps a login input and reveals the portal's demo account beneath it when the
 * field receives focus. Selecting the entry fills the whole form.
 *
 * Focus is tracked on the wrapper rather than the input itself: the fill button
 * lives inside the same container, so moving focus to it does not count as
 * leaving the field and the dropdown survives long enough for the click.
 *
 * Escape is handled on the document rather than via onKeyDown, so the wrapper
 * stays a plain container instead of a non-native interactive element.
 */
export function DemoCredentialField({ credential, onFill, children }: DemoCredentialFieldProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onFocusCapture={() => setOpen(true)}
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      {children}

      {open && (
        <div
          className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-lg border border-border bg-popover shadow-card-hover"
          role="group"
          aria-label={`${credential.label} demo account`}
        >
          <p className="px-3 pb-1.5 pt-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {credential.label} demo account
          </p>
          <button
            type="button"
            // Keep focus on the input. Safari does not focus buttons on click, so
            // without this the wrapper would see focus leave, close the dropdown
            // on mousedown, and the click would never land.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onFill();
              setOpen(false);
            }}
            className="flex w-full items-start gap-2.5 border-t border-border px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
          >
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-foreground">
                {credential.identifierLabel}: {credential.identifier}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                Password: {credential.password}
              </span>
            </span>
            <span className="shrink-0 self-center text-[11px] font-medium text-primary">Use</span>
          </button>
        </div>
      )}
    </div>
  );
}
