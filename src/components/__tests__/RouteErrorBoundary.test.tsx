import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  Translation: ({ children }: { children: (t: (key: string, fallback?: string) => string) => React.ReactNode }) => {
    const t = (_key: string, fallback?: string) => fallback || _key;
    return children(t);
  },
}));

import { RouteErrorBoundary } from "../RouteErrorBoundary";

// Component that throws
function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("Test error");
  return <div>Child content</div>;
}

describe("RouteErrorBoundary", () => {
  beforeEach(() => {
    // Suppress React error boundary console.error in test output
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders children when there is no error", () => {
    render(
      <RouteErrorBoundary>
        <div>Hello world</div>
      </RouteErrorBoundary>
    );
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("shows error UI when a child throws", () => {
    render(
      <RouteErrorBoundary section="Dashboard">
        <ThrowingChild shouldThrow={true} />
      </RouteErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  it("includes section error description when section prop is provided", () => {
    render(
      <RouteErrorBoundary section="Student Dashboard">
        <ThrowingChild shouldThrow={true} />
      </RouteErrorBoundary>
    );
    // The mock t() returns the fallback string with {{section}} placeholder
    expect(
      screen.getByText(/section.*encountered an error/i)
    ).toBeInTheDocument();
  });

  it("recovers when Try Again is clicked", () => {
    const { rerender } = render(
      <RouteErrorBoundary section="Test">
        <ThrowingChild shouldThrow={true} />
      </RouteErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Re-render with non-throwing child before clicking retry
    rerender(
      <RouteErrorBoundary section="Test">
        <ThrowingChild shouldThrow={false} />
      </RouteErrorBoundary>
    );

    fireEvent.click(screen.getByText("Try Again"));
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });
});
