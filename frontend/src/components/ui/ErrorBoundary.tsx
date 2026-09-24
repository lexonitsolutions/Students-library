import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
    try {
      sessionStorage.setItem('last_app_error', JSON.stringify({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      }));
    } catch {
      // ignore
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-4 text-on-surface">
          <div className="w-full max-w-lg rounded-2xl border border-error/30 bg-surface-container p-6 shadow-xl">
            <div className="flex items-center gap-3 text-error mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-error/10">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h1 className="text-lg font-bold">Something went wrong</h1>
                <p className="text-xs text-on-surface-variant">The application encountered an unexpected error.</p>
              </div>
            </div>

            <div className="my-4 rounded-xl bg-surface-container-lowest p-3 border border-card-border overflow-x-auto text-left">
              <p className="text-xs font-mono font-semibold text-error break-all">
                {this.state.error?.name}: {this.state.error?.message || 'Unknown error'}
              </p>
              {this.state.error?.stack && (
                <pre className="mt-2 text-[11px] font-mono text-on-surface-variant/80 max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={this.handleGoHome}
                className="gap-1.5 text-xs"
              >
                <Home size={14} />
                Return to Dashboard
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={this.handleReset}
                className="gap-1.5 text-xs"
              >
                <RefreshCw size={14} />
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
