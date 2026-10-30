import React from 'react';

interface DetailErrorBoundaryProps {
  children: React.ReactNode;
  onClose: () => void;
}

interface DetailErrorBoundaryState {
  error: Error | null;
  componentStack: string;
}

// 상세 화면 렌더링 오류를 잡아 에러 내용을 화면에 표시합니다.
export class DetailErrorBoundary extends React.Component<DetailErrorBoundaryProps, DetailErrorBoundaryState> {
  declare props: DetailErrorBoundaryProps;
  declare setState: React.Component<DetailErrorBoundaryProps, DetailErrorBoundaryState>['setState'];
  state: DetailErrorBoundaryState = { error: null, componentStack: '' };

  static getDerivedStateFromError(error: Error): Partial<DetailErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[DetailView 오류]', error, info.componentStack);
    this.setState({ componentStack: info.componentStack ?? '' });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 z-[90] bg-white flex flex-col items-center justify-center p-6 text-center space-y-3">
          <p className="text-sm font-black text-stone-900">상세 화면을 여는 중 오류가 발생했어요</p>
          <pre className="max-w-full overflow-auto text-[11px] text-rose-600 bg-rose-50 rounded-xl p-3 whitespace-pre-wrap break-all">
            {this.state.error.name}: {this.state.error.message}
            {'\n'}
            {this.state.error.stack?.split('\n').slice(0, 12).join('\n')}
            {'\n\n[컴포넌트 스택]\n'}
            {this.state.componentStack.split('\n').slice(0, 12).join('\n')}
          </pre>
          <button
            type="button"
            onClick={() => {
              this.setState({ error: null });
              this.props.onClose();
            }}
            className="px-4 py-2 rounded-xl bg-stone-950 text-white text-xs font-black cursor-pointer"
          >
            닫기
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
