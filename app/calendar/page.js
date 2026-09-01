"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PERIODS = ["week", "month", "year"];

export default function CalendarPage() {
  const router = useRouter();
  const [period, setPeriod] = useState("week");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/calendar?period=${period}&date=${date}`)
      .then((r) => r.json())
      .then((d) => { setItems(d.items || []); setLoading(false); });
  }, [period, date]);

  function openDay(itemDate) {
    router.push(`/schedule?date=${itemDate}`);
  }

  function openMonth(itemDate) {
    setPeriod("month");
    setDate(itemDate);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-2">Calendar</h1>
      <p className="text-sm text-gray-400 mb-6">See your Week, Month, or Year at a glance — click any entry for the full day.</p>

      <div className="flex gap-1 mb-4">
        {PERIODS.map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs capitalize ${period === p ? "bg-accent text-bg" : "bg-panel text-gray-400"}`}>{p}</button>
        ))}
      </div>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-panel border border-gray-700 rounded-lg p-2 text-sm mb-6" />

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="bg-panel rounded-xl divide-y divide-gray-800">
          {items.map((it) => (
            <button
              key={it.date}
              onClick={() => (period === "year" ? openMonth(it.date) : openDay(it.date))}
              className="w-full text-left p-3 flex items-center justify-between hover:bg-white/5"
            >
              <span className="text-sm">{it.label}</span>
              <span className="text-xs text-gray-500">
                {period === "year"
                  ? `${it.blockCount} entries`
                  : `${it.blockCount} blocks · ${Math.floor(it.workedMins / 60)}h ${it.workedMins % 60}m`}
              </span>
            </button>
          ))}
          {items.length === 0 && <p className="p-4 text-sm text-gray-500">Nothing here.</p>}
        </div>
      )}
    </div>
  );
}
