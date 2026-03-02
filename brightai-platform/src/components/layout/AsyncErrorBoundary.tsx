import { Component, type ErrorInfo, type ReactNode } from "react";

type AsyncErrorBoundaryProps = {
  children: ReactNode;
  title: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
};

type AsyncErrorBoundaryState = {
  hasError: boolean;
};

class AsyncErrorBoundary extends Component<
  AsyncErrorBoundaryProps,
  AsyncErrorBoundaryState
> {
  constructor(props: AsyncErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    // تسجيل الخطأ في وحدة التحكم لتسهيل تتبع مشاكل التحميل غير المتزامن.
    console.error("خطأ تحميل غير متزامن:", error);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
    this.props.onRetry?.();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        className={
          this.props.className ||
          "flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-900/10 p-6 text-center"
        }
      >
        <h3 className="text-lg font-bold text-rose-200">{this.props.title}</h3>
        <p className="max-w-lg text-sm text-rose-100/90">{this.props.message}</p>
        <button
          type="button"
          onClick={this.handleRetry}
          className="rounded-xl border border-rose-400/40 bg-rose-400/15 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-400/25"
        >
          {this.props.retryLabel || "إعادة المحاولة"}
        </button>
      </div>
    );
  }
}

export default AsyncErrorBoundary;
