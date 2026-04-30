'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>出了点问题</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {this.state.error?.message || '组件加载失败'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--accent-info)' }}
          >
            重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
