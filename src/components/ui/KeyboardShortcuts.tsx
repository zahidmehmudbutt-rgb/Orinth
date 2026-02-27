import { useEffect, useState, useCallback } from "react";
import { Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Shortcut {
  keys: string[];
  description: string;
}

const shortcuts: Shortcut[] = [
  { keys: ["Esc"], description: "Close dialogs / modals" },
  { keys: ["Shift", "?"], description: "Show shortcuts help" },
  { keys: ["Ctrl", "K"], description: "Quick search" },
  { keys: ["Tab"], description: "Navigate to next element" },
  { keys: ["Shift", "Tab"], description: "Navigate to previous element" },
  { keys: ["Enter"], description: "Confirm / Submit" },
  { keys: ["\u2191", "\u2193"], description: "Navigate lists" },
];

function KeyBadge({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
      {children}
    </kbd>
  );
}

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Shift + ? (which is Shift + /)
      if (e.shiftKey && e.key === "?") {
        // Don't trigger when typing in inputs/textareas
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }

        e.preventDefault();
        setOpen((prev) => !prev);
      }
    },
    [],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Quick reference for available keyboard shortcuts.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.description}
              className="flex items-center justify-between gap-4"
            >
              <span className="text-sm">{shortcut.description}</span>
              <div className="flex shrink-0 items-center gap-1">
                {shortcut.keys.map((key, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && (
                      <span className="text-xs text-muted-foreground">+</span>
                    )}
                    <KeyBadge>{key}</KeyBadge>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
