import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Text } from './Text';
import { Icons } from '../Icons';

// =============================================================================
// 统一错误边界组件 - ErrorBoundary v2.0
// =============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryProps {
  /** 子组件 */
  children: ReactNode;
  /** 错误回退UI */
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode;
  /** 错误处理回调 */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** 是否显示重试按钮 */
  showRetry?: boolean;
  /** 自定义错误标题 */
  errorTitle?: string;
  /** 自定义错误描述 */
  errorDescription?: string;
  /** 测试ID */
  'data-testid'?: string;
}

/**
 * 统一的错误边界组件
 *
 * 特性：
 * - 自动捕获React组件树中的JavaScript错误
 * - 显示用户友好的错误界面
 * - 支持错误重试
 * - 错误信息上报
 * - 开发环境显示详细错误信息
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * <ErrorBoundary
 *   fallback={(error, errorInfo, retry) => (
 *     <CustomErrorUI error={error} retry={retry} />
 *   )}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId?: number;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 生成错误ID用于追踪
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 更新状态包含错误信息
    this.setState({
      error,
      errorInfo
    });

    // 调用错误处理回调
    this.props.onError?.(error, errorInfo);

    // 在开发环境中打印错误详情
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Boundary: ${this.state.errorId}`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.groupEnd();
    }

    // 上报错误到监控服务
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // 这里可以集成错误监控服务，如Sentry
    const errorReport = {
      id: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // 发送到错误监控服务
    try {
      // 示例：发送到监控API
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // });
      console.log('Error reported:', errorReport);
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  };

  private handleRetry = () => {
    // 清除之前的重试定时器
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    // 重置错误状态
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined
    });
  };

  render() {
    if (this.state.hasError) {
      // 使用自定义回退UI
      if (this.props.fallback && this.state.error && this.state.errorInfo) {
        return this.props.fallback(
          this.state.error,
          this.state.errorInfo,
          this.handleRetry
        );
      }

      // 默认错误UI
      return (
        <Card
          variant="glass"
          className="max-w-md mx-auto my-8"
          data-testid={this.props['data-testid']}
        >
          <div className="text-center space-y-4">
            {/* 错误图标 */}
            <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
              <Icons.Error size={32} className="text-red-400" />
            </div>

            {/* 错误标题 */}
            <div>
              <Text variant="h3" color="primary" className="mb-2">
                {this.props.errorTitle || '出错了'}
              </Text>
              <Text variant="body" color="secondary">
                {this.props.errorDescription || '应用程序遇到了意外错误，请稍后重试。'}
              </Text>
            </div>

            {/* 开发环境显示错误详情 */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                <summary className="cursor-pointer text-sm font-medium text-gray-300 mb-2">
                  错误详情 (开发环境)
                </summary>
                <div className="space-y-2 text-xs font-mono text-gray-400">
                  <div>
                    <strong>错误:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>堆栈:</strong>
                      <pre className="whitespace-pre-wrap mt-1 text-xs">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong>组件堆栈:</strong>
                      <pre className="whitespace-pre-wrap mt-1 text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3 justify-center">
              {this.props.showRetry !== false && (
                <Button
                  variant="primary"
                  onClick={this.handleRetry}
                  leftIcon={<Icons.Restore size={16} />}
                >
                  重试
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => window.location.reload()}
              >
                刷新页面
              </Button>
            </div>

            {/* 错误ID */}
            {this.state.errorId && (
              <Text variant="caption" color="muted" className="text-xs">
                错误ID: {this.state.errorId}
              </Text>
            )}
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// Hook版本的错误边界
// =============================================================================

interface UseErrorBoundaryReturn {
  error: Error | null;
  resetError: () => void;
  captureError: (error: Error, errorInfo?: ErrorInfo) => void;
}

/**
 * 错误边界Hook
 *
 * 用于函数组件中的错误处理
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const { error, resetError } = useErrorBoundary();
 *
 *   if (error) {
 *     return <ErrorUI error={error} onRetry={resetError} />;
 *   }
 *
 *   return <div>My component content</div>;
 * };
 * ```
 */
export const useErrorBoundary = (): UseErrorBoundaryReturn => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error, errorInfo?: ErrorInfo) => {
    setError(error);

    // 错误上报逻辑
    if (errorInfo) {
      console.error('Captured error:', error, errorInfo);
    }
  }, []);

  return {
    error,
    resetError,
    captureError
  };
};

export { ErrorBoundary };
export default ErrorBoundary;
