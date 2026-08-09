'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

type OptionalRuntimeBoundaryProps = {
  name: string;
  children: ReactNode;
};

type OptionalRuntimeBoundaryState = {
  failed: boolean;
};

export class OptionalRuntimeBoundary extends Component<
  OptionalRuntimeBoundaryProps,
  OptionalRuntimeBoundaryState
> {
  state: OptionalRuntimeBoundaryState = { failed: false };

  static getDerivedStateFromError(): OptionalRuntimeBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Camada opcional isolada: ${this.props.name}`, error, info.componentStack);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
