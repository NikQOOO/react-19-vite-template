import React from 'react';

type TFallbackRender = React.ReactElement | React.ReactNode;

class ErrorBoundary extends React.Component<{
  fallback?: TFallbackRender;
  fallbackCB?: () => TFallbackRender;
  children: React.ReactNode;
}> {
  state = {
    error: null,
  };

  // 当子组件抛出异常，这里会接收到并且调用
  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    const { fallback, fallbackCB, children } = this.props;
    if (error) {
      if (fallbackCB) {
        return fallbackCB();
      }
      return fallback;
    }
    return children;
  }
}

export default ErrorBoundary;
