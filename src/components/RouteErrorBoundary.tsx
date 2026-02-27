import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Translation } from "react-i18next";

interface Props {
  children: ReactNode;
  /** Label shown in the error card, e.g. "Dashboard" */
  section?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Inline error boundary for route sections / feature areas.
 * Shows a compact retry card instead of taking over the whole screen.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(`[RouteErrorBoundary${this.props.section ? ` - ${this.props.section}` : ""}]`, error, info.componentStack);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Translation>
          {(t) => (
            <div className="flex items-center justify-center min-h-[400px] p-6">
              <div className="max-w-sm w-full text-center space-y-4">
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {t("errorBoundary.sectionError", "Something went wrong")}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {this.props.section
                      ? t("errorBoundary.sectionErrorDesc", "The {{section}} section encountered an error.", { section: this.props.section })
                      : t("errorBoundary.description")}
                  </p>
                  {import.meta.env.DEV && this.state.error && (
                    <pre className="mt-3 p-2 bg-muted rounded text-xs text-left text-destructive overflow-auto max-h-24">
                      {this.state.error.message}
                    </pre>
                  )}
                </div>
                <Button onClick={this.handleRetry} size="sm" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  {t("errorBoundary.tryAgain", "Try Again")}
                </Button>
              </div>
            </div>
          )}
        </Translation>
      );
    }

    return this.props.children;
  }
}
