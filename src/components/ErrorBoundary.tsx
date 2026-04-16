import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ManpowerDashboard] Render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-ink-50 flex items-center justify-center p-8">
          <div className="card max-w-lg w-full p-8 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertTriangle size={28} className="text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-ink-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-ink-500 mb-4">
              {this.state.error.message}
            </p>
            <pre className="bg-ink-100 rounded-lg p-3 text-left text-xs text-ink-600 overflow-auto mb-5 max-h-40">
              {this.state.error.stack?.split('\n').slice(0, 8).join('\n')}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary mx-auto"
            >
              <RefreshCw size={15} /> Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
