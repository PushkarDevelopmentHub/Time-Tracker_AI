"use client";
import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showError = useCallback((message, onRetry) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, onRetry }]);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showError }}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[90%] max-w-sm">
        {toasts.map((t) => (
          <div key={t.id} className="bg-panel border border-warn/40 rounded-xl p-3 shadow-xl flex items-start gap-2">
            <span className="text-warn text-sm mt-0.5">⚠️</span>
            <div className="flex-1">
              <p className="text-sm text-gray-200">{t.message}</p>
              <div className="flex gap-2 mt-2">
                {t.onRetry && (
                  <button
                    onClick={() => { t.onRetry(); dismiss(t.id); }}
                    className="text-xs bg-accent text-bg px-2.5 py-1 rounded-lg font-medium"
                  >
                    Retry
                  </button>
                )}
                <button onClick={() => dismiss(t.id)} className="text-xs text-gray-400 px-2.5 py-1">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

// Wraps fetch: on network error or non-2xx, calls onError with a message + retry fn
// instead of leaving a busy spinner stuck forever.
export async function safeFetch(url, options, showError, retryFn) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showError(data.error || `Something went wrong (${res.status}). Please try again.`, retryFn);
      return null;
    }
    return await res.json();
  } catch {
    showError("Couldn't reach the server — check your connection.", retryFn);
    return null;
  }
}
