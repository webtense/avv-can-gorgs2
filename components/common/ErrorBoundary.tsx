'use client';

import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
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
            Alguna cosa ha anat malament
          </h2>
          <p className="max-w-md text-sm text-slate-600">
            No hem pogut carregar aquest contingut. Prova de nou en uns
            instants.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            Tornar a provar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
