import type { FC, ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import ToastNotification from './ToastNotification';

interface ErrorBoundaryState {
  hasError: boolean;
}

class ToastErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Toast Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

const ToastContainer: FC = () => {
  const { toasts, removeToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
      {toasts.map((toast, index) => {
        if (!toast || !toast.id) return null;
        
        return (
          <div
            key={toast.id}
            className="animate-in slide-in-from-right-full duration-300 pointer-events-auto"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <ToastErrorBoundary>
              <ToastNotification
                toast={toast}
                onClose={() => removeToast(toast.id)}
              />
            </ToastErrorBoundary>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;