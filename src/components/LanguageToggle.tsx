import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

interface LanguageToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

export const LanguageToggle = memo(function LanguageToggle({ className, ...rest }: LanguageToggleProps) {
  const { i18n } = useTranslation();
  const isUrdu = i18n.language === "ur" || i18n.language?.startsWith("ur-");

  const toggleLanguage = () => {
    i18n.changeLanguage(isUrdu ? "en" : "ur");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-9 w-9 ${className ?? ""}`}
      onClick={toggleLanguage}
      title={isUrdu ? "English" : "اردو"}
      {...rest}
    >
      <Languages className="h-4 w-4" />
      <span className="sr-only">
        {isUrdu ? "Switch to English" : "اردو میں تبدیل کریں"}
      </span>
    </Button>
  );
});
