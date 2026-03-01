export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizeClasses[size]} border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin`}></div>
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner />
    </div>
  );
}

export function LoadingButton({ children, loading }: { children: React.ReactNode; loading?: boolean }) {
  return (
    <button
      disabled={loading}
      className="relative"
    >
      {loading && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </span>
      )}
      <span className={loading ? 'opacity-70' : ''}>{children}</span>
    </button>
  );
}
