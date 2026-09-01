"use client";
import { useState } from "react";
import { BusyButton } from "@/components/Spinner";

const PERIODS = ["day", "week", "month", "year"];

export default function ExportPage() {
  const [period, setPeriod] = useState("week");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [blocks, setBlocks] = useState(null);
  const [busy, setBusy] = useState(false);

  async function view() {
    setBusy(true);
    const res = await fetch(`/api/export?period=${period}&date=${date}&format=json`);
    const d = await res.json();
    setBlocks(d.blocks || []);
    setBusy(false);
  }

  function download() {
    window.open(`/api/export?period=${period}&date=${date}&format=csv`, "_blank");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-2">Filter & Export</h1>
      <p className="text-sm text-gray-400 mb-6">View or download everything you've logged for any day, week, month, or year.</p>

      <div className="bg-panel rounded-xl p-4 mb-6 space-y-3">
        <div className="flex gap-1 flex-wrap">
          {PERIODS.map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs capitalize ${period === p ? "bg-accent text-bg" : "bg-bg text-gray-400"}`}>{p}</button>
          ))}
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-bg border border-gray-700 rounded-lg p-2 text-sm" />
        <div className="flex gap-2">
          <BusyButton busy={busy} onClick={view} className="bg-bg border border-gray-700 px-4 py-2 rounded-lg text-sm">
            {busy ? "Loading..." : "View"}
          </BusyButton>
          <button onClick={download} className="bg-accent text-bg font-medium px-4 py-2 rounded-lg text-sm">Download CSV</button>
        </div>
      </div>

      {blocks && (
        <div className="bg-panel rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                <th className="p-3">Date</th><th className="p-3">Time</th><th className="p-3">Activity</th><th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((b) => (
                <tr key={b.id} className="border-b border-gray-800 last:border-0">
                  <td className="p-3 whitespace-nowrap text-gray-400">{new Date(b.date).toLocaleDateString()}</td>
                  <td className="p-3 whitespace-nowrap text-gray-400">{b.startTime}–{b.endTime}</td>
                  <td className="p-3">{b.activity}</td>
                  <td className="p-3 text-xs text-gray-500">{b.notes}</td>
                </tr>
              ))}
              {blocks.length === 0 && <tr><td colSpan={4} className="p-4 text-sm text-gray-500">Nothing found for this period.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
