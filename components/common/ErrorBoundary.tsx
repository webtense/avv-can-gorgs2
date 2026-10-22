'use client';

import { Component, ReactNode } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';

interface ErrorBoundaryInnerProps {
  children: ReactNode;
  title: string;
  message: string;
  retryLabel: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundaryInner extends Component<
  ErrorBoundaryInnerProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary capturó un error:', error);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 px-6 py-12 text-center"
        >
          <h2 className="font-serif text-xl text-slate-900">
            {this.props.title}
          </h2>
          <p className="max-w-md text-sm text-slate-600">
            {this.props.message}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            {this.props.retryLabel}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function ErrorBoundary({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <ErrorBoundaryInner
      title={t('common.errorBoundary.title')}
      message={t('common.errorBoundary.message')}
      retryLabel={t('common.errorBoundary.retry')}
    >
      {children}
    </ErrorBoundaryInner>
  );
}
