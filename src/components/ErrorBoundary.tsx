import { Component, type ReactNode, type ErrorInfo } from "react";

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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
          <h1 style={{ color: "#dc2626", fontSize: "1.5rem" }}>Something went wrong</h1>
          <p style={{ color: "#666", marginTop: "0.5rem" }}>The app encountered an error. Please try refreshing the page.</p>
          <pre style={{ background: "#f3f4f6", padding: "1rem", borderRadius: "0.5rem", marginTop: "1rem", overflow: "auto", fontSize: "0.875rem", color: "#111" }}>
            {this.state.error?.message}
            {"\n\n"}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer" }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
