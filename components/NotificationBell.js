"use client";
import { useEffect, useState } from "react";

export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json()).then((d) => setItems(d.notifications || [])).catch(() => {});
  }, []);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative text-lg px-1" aria-label="Notifications">
        🔔
        {items.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-warn text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
            {items.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-panel border border-gray-800 rounded-xl shadow-2xl z-40 max-h-80 overflow-y-auto">
          {items.length === 0 && <p className="p-4 text-xs text-gray-500">Nothing to flag right now.</p>}
          {items.map((n) => (
            <a key={n.id} href={n.actionHref} className="block p-3 border-b border-gray-800 last:border-0 hover:bg-white/5">
              <p className="text-xs text-gray-300">{n.message}</p>
              <p className="text-[10px] text-accent mt-1">{n.actionLabel} →</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
