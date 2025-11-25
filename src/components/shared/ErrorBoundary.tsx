import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Check if it's an authentication error
    if (error.message?.toLowerCase().includes('session') || 
        error.message?.toLowerCase().includes('authentication') ||
        error.message?.toLowerCase().includes('unauthorized')) {
      // Session errors are already handled by the API layer
      console.log('Session error detected - API layer will handle redirect');
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f5ede1] dark:bg-[#1a1917] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#e6beb5] flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-[#c74444]" />
              </div>
              <h1 className="font-['Sniglet:Regular',_sans-serif] text-[20px] text-black dark:text-white">
                Something went wrong
              </h1>
            </div>

            <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/70 dark:text-white/70 mb-6">
              {this.state.error?.message?.includes('session') || 
               this.state.error?.message?.includes('authentication') 
                ? 'Your session may have expired. Please try signing in again.'
                : 'An unexpected error occurred. You can try to recover or reload the page.'}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 p-3 bg-[#f5ede1] dark:bg-[#1a1917] rounded border border-[#211f1c]/20">
                <summary className="font-['Sniglet:Regular',_sans-serif] text-[11px] cursor-pointer mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-[10px] overflow-auto whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-2">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-[#b8c8cb] h-[40px] rounded-[6px] border border-[#211f1c] shadow-[2px_2px_0px_0px_#000000] font-['Sniglet:Regular',_sans-serif] text-[12px] text-black hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 bg-[#e6beb5] h-[40px] rounded-[6px] border border-[#211f1c] shadow-[2px_2px_0px_0px_#000000] font-['Sniglet:Regular',_sans-serif] text-[12px] text-black hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] transition-all flex items-center justify-center gap-2"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
