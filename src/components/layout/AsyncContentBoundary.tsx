import { Component, type ReactNode } from 'react'

interface AsyncContentBoundaryProps {
  readonly children: ReactNode
  readonly className?: string
  readonly message?: string
}

interface AsyncContentBoundaryState {
  readonly hasError: boolean
}

export class AsyncContentBoundary extends Component<
  AsyncContentBoundaryProps,
  AsyncContentBoundaryState
> {
  state: AsyncContentBoundaryState = { hasError: false }

  static getDerivedStateFromError(): AsyncContentBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('Failed to load an AII application section:', error)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <section
        className={
          this.props.className ??
          'rounded-xl border border-amber-200 bg-amber-50 p-6'
        }
        role="alert"
      >
        <p className="text-sm leading-6 text-slate-700">
          {this.props.message ??
            'This section could not be loaded. Check the connection and reload AII.'}
        </p>
        <button
          className="mt-3 min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
          onClick={() => window.location.reload()}
          type="button"
        >
          Reload AII
        </button>
      </section>
    )
  }
}
