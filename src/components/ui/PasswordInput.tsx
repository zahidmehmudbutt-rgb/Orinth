import { forwardRef, useState } from "react";
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  label?: string;
  error?: string;
  showStrength?: boolean;
  showIcon?: boolean;
}

function getStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score >= 5) return { score, label: "Strong", color: "bg-green-500" };
  if (score >= 3) return { score, label: "Medium", color: "bg-yellow-500" };
  return { score, label: "Weak", color: "bg-red-500" };
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, showStrength = false, showIcon = true, id, className, value, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const fieldId = id || "password";
    const errorId = `${fieldId}-error`;
    const passwordValue = typeof value === "string" ? value : "";
    const strength = showStrength && passwordValue ? getStrength(passwordValue) : null;

    return (
      <div className="space-y-2">
        {label && <Label htmlFor={fieldId}>{label}</Label>}
        <div className="relative">
          {showIcon && (
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          )}
          <Input
            ref={ref}
            id={fieldId}
            type={visible ? "text" : "password"}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            value={value}
            className={cn(
              "h-12 pr-12 bg-background/50 dark:bg-background/30",
              showIcon && "pl-10",
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
            {...props}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setVisible(!visible)}
            tabIndex={-1}
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>

        {showStrength && strength && passwordValue.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all duration-300",
                    i <= strength.score ? strength.color : "bg-muted"
                  )}
                />
              ))}
            </div>
            <p className={cn("text-xs", strength.score >= 5 ? "text-green-500" : strength.score >= 3 ? "text-yellow-600" : "text-red-500")}>
              Password strength: {strength.label}
            </p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {[
                { check: passwordValue.length >= 8, text: "8+ characters" },
                { check: /[A-Z]/.test(passwordValue), text: "Uppercase letter" },
                { check: /[a-z]/.test(passwordValue), text: "Lowercase letter" },
                { check: /[0-9]/.test(passwordValue), text: "Number" },
                { check: /[^a-zA-Z0-9]/.test(passwordValue), text: "Special character" },
              ].map((req) => (
                <span key={req.text} className={cn("flex items-center gap-1", req.check ? "text-green-600" : "text-muted-foreground")}>
                  {req.check ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {req.text}
                </span>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p id={errorId} role="alert" className="text-sm text-destructive flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
