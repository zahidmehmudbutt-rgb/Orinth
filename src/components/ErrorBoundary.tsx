import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Translation } from "react-i18next";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught:", error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Translation>
          {(t) => (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
              <div className="max-w-md w-full text-center space-y-6">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    {t("errorBoundary.title")}
                  </h1>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t("errorBoundary.description")}
                  </p>
                  {import.meta.env.DEV && this.state.error && (
                    <pre className="mt-4 p-3 bg-muted rounded-lg text-xs text-left text-destructive overflow-auto max-h-32">
                      {this.state.error.message}
                    </pre>
                  )}
                </div>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => window.location.reload()}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t("errorBoundary.refreshPage")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => (window.location.href = "/")}
                    className="gap-2"
                  >
                    <Home className="w-4 h-4" />
                    {t("errorBoundary.home")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Translation>
      );
    }

    return this.props.children;
  }
}
