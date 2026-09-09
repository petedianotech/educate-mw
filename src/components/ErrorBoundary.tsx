import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Educate MW ErrorBoundary caught]', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.removeItem('mw_cached_profile_v2');
      localStorage.removeItem('mw_user_msce_grades_v3');
      localStorage.removeItem('mw_library_materials_cache');
      sessionStorage.clear();
    } catch {
      // Ignore storage errors
    }
    window.location.href = '/';
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          id="error-boundary-screen"
          className="min-h-screen w-full flex items-center justify-center p-4 bg-gray-950 text-gray-100 font-sans select-none"
          role="alert"
        >
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center">
            {/* Header Icon */}
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6 text-amber-400">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight mb-2">
              Educate MW Recovered Safely
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 font-medium leading-relaxed mb-6">
              A temporary display glitch occurred. Your study progress and data are safe. Tap below to refresh your session.
            </p>

            {/* Action Buttons */}
            <div className="w-full space-y-2.5">
              <button
                id="btn-error-reload"
                onClick={this.handleReload}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reload Application
              </button>

              <button
                id="btn-error-home"
                onClick={this.handleGoHome}
                className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-750 text-gray-200 active:scale-[0.98] font-bold text-xs rounded-xl border border-gray-700/60 transition-all flex items-center justify-center gap-2"
              >
                Return to Dashboard
              </button>

              <button
                id="btn-error-clearcache"
                onClick={this.handleResetCache}
                className="w-full py-2.5 px-4 text-gray-400 hover:text-gray-200 text-[11px] font-semibold transition-colors"
              >
                Clear Local Cache & Restart
              </button>
            </div>

            {/* Diagnostic Details Toggle */}
            <div className="mt-6 pt-4 border-t border-gray-800 w-full text-left">
              <button
                type="button"
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="text-[11px] text-gray-500 hover:text-gray-400 font-medium flex items-center justify-between w-full"
              >
                <span>Diagnostic Info</span>
                <span>{this.state.showDetails ? '▲ Hide' : '▼ View'}</span>
              </button>
              {this.state.showDetails && (
                <pre className="mt-2 p-3 bg-black/50 border border-gray-800/80 rounded-xl text-[10px] text-red-400 overflow-x-auto max-h-36 whitespace-pre-wrap break-all select-text font-mono">
                  {this.state.error?.toString() || 'Unknown error'}
                </pre>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
