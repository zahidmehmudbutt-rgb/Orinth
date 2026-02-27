import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
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
  descriptionKey: string;
}

const shortcuts: Shortcut[] = [
  { keys: ["Esc"], descriptionKey: "keyboardShortcuts.closeDialogs" },
  { keys: ["Shift", "?"], descriptionKey: "keyboardShortcuts.showHelp" },
  { keys: ["Ctrl", "K"], descriptionKey: "keyboardShortcuts.quickSearch" },
  { keys: ["Tab"], descriptionKey: "keyboardShortcuts.nextElement" },
  { keys: ["Shift", "Tab"], descriptionKey: "keyboardShortcuts.prevElement" },
  { keys: ["Enter"], descriptionKey: "keyboardShortcuts.confirmSubmit" },
  { keys: ["\u2191", "\u2193"], descriptionKey: "keyboardShortcuts.navigateLists" },
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
  const { t } = useTranslation();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === "?") {
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
            {t("keyboardShortcuts.title")}
          </DialogTitle>
          <DialogDescription>
            {t("keyboardShortcuts.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.descriptionKey}
              className="flex items-center justify-between gap-4"
            >
              <span className="text-sm">{t(shortcut.descriptionKey)}</span>
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
