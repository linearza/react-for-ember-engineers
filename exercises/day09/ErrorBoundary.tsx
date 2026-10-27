import { Component, type ErrorInfo, type ReactNode } from 'react';

/*
DAY 9 — error boundaries are still class components. There is no hook for this.
TODO:
  - static getDerivedStateFromError(error) → { error }
  - when state.error is set, render this.props.fallback({ error, reset })
  - reset(): call this.props.onReset?.() and clear the error, so the children render again
  - componentDidCatch is where you'd report to Sentry etc.
Ember: an `error` substate, but it can wrap ANY subtree, not just a route.
*/

interface ErrorBoundaryProps {
  fallback: (props: { error: Error; reset: () => void }) => ReactNode;
  onReset?: () => void;
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  componentDidCatch(error: Error, info: ErrorInfo) {
    void error;
    void info;
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    return this.props.children;
  }
}
