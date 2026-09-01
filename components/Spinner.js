export default function Spinner({ size = 16 }) {
  return (
    <svg
      className="animate-spin"
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Wraps a button: shows spinner + disables while `busy` is true.
export function BusyButton({ busy, onClick, children, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {busy && <Spinner size={14} />}
      {children}
    </button>
  );
}
