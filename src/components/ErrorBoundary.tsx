import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uncaught error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-6">
          <div className="max-w-sm w-full text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="text-sm text-zinc-400">
              {this.state.error.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-100 transition"
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
