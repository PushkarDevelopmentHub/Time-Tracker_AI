"use client";
import { useEffect, useState } from "react";
import { BusyButton } from "@/components/Spinner";

export default function RoutinePage() {
  const [plan, setPlan] = useState("");
  const [days, setDays] = useState(7);
  const [routines, setRoutines] = useState([]);
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState({});

  useEffect(() => {
    fetch("/api/routine").then((r) => r.json()).then((d) => setRoutines(d.routines || []));
  }, []);

  async function generate() {
    if (!plan) return;
    setBusy(true);
    const res = await fetch("/api/routine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planText: plan, durationDays: days, provider: "gemini" }),
    });
    const data = await res.json();
    setRoutines([...routines, ...(data.routines || [])]);
    setPlan("");
    setBusy(false);
  }

  async function toggle(id) {
    const done = !checked[id];
    setChecked({ ...checked, [id]: done });
    await fetch("/api/routine", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, done }),
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-2">Your Routine</h1>
      <p className="text-sm text-gray-400 mb-6">
        Describe your plan in your own words — AI turns it into a structured routine.
      </p>

      <div className="bg-panel rounded-xl p-4 mb-6 space-y-3">
        <textarea
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          rows={4}
          placeholder="e.g. 'Weekdays: 6-7am workout, 7-8am system design, 8pm-9pm passion hour rotating AI project/drawing/guitar, 9-11:30pm DSA. Weekends: long run + passion block on Sunday.'"
          className="w-full bg-bg border border-gray-700 rounded-lg p-2 text-sm"
        />
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-400">Run for</label>
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-20 bg-bg border border-gray-700 rounded-lg p-2 text-sm"
          />
          <span className="text-xs text-gray-400">days</span>
          <BusyButton busy={busy} onClick={generate} className="ml-auto bg-accent text-bg font-medium px-4 py-2 rounded-lg text-sm">
            {busy ? "Building..." : "Generate with AI"}
          </BusyButton>
        </div>
      </div>

      <div className="bg-panel rounded-xl divide-y divide-gray-800">
        {routines.map((r) => (
          <label key={r.id} className="flex items-center gap-3 p-3 text-sm cursor-pointer">
            <input type="checkbox" checked={!!checked[r.id]} onChange={() => toggle(r.id)} />
            <span className="flex-1">{r.name}</span>
            <span className="text-xs text-gray-500">🔥 {r.streak}</span>
          </label>
        ))}
        {routines.length === 0 && <p className="p-4 text-sm text-gray-500">No routine yet — build one above.</p>}
      </div>
    </div>
  );
}
