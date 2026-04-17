import React, { Component, type ErrorInfo, type ReactNode } from 'react';

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
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-xl border border-red-200 p-8 max-w-lg w-full shadow-sm">
            <h1 className="text-xl font-semibold text-red-600 mb-2">Application Error</h1>
            <p className="text-slate-600 text-sm mb-4">
              Something went wrong. Please refresh the page.
            </p>
            <pre className="bg-slate-50 rounded p-3 text-xs text-slate-700 overflow-auto max-h-48">
              {this.state.error.message}
            </pre>
            <button
              className="mt-4 btn-primary"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
