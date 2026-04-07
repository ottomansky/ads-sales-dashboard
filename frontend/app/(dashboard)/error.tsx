'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="max-w-lg">
        <h2 className="text-lg font-semibold text-red-600 mb-2">Something went wrong</h2>
        <pre className="text-xs text-left bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 overflow-auto max-h-48 text-gray-700 whitespace-pre-wrap">
          {error?.message || 'Unknown error'}
          {'\n\n'}
          {error?.stack || ''}
        </pre>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-md bg-brand-primary text-white text-sm font-medium hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
