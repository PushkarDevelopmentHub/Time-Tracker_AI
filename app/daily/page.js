"use client";
import { useState } from "react";
import { BusyButton } from "@/components/Spinner";

export default function DailyPage() {
  const [meals, setMeals] = useState([{ name: "" }]);
  const [workDone, setWorkDone] = useState(false);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");

  async function submit() {
    setSaving(true);
    await fetch("/api/daily", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: new Date().toISOString().slice(0, 10),
        workDone,
        notes,
        meals,
      }),
    });
    setSaving(false);
    setSaved(true);
  }

  async function getAiSummary() {
    setAiBusy(true);
    setAiError("");
    try {
      const res = await fetch("/api/daily/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: new Date().toISOString().slice(0, 10), provider: "gemini" }),
      });
      const data = await res.json();
      if (data.aiSummary) setAiSummary(data.aiSummary);
      else setAiError(data.error || "Couldn't generate a summary — try again.");
    } catch {
      setAiError("Couldn't reach the AI. Check your GEMINI_API_KEY in .env.");
    }
    setAiBusy(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">Today's Log</h1>

      <div className="bg-panel rounded-xl p-4 mb-4 space-y-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={workDone} onChange={(e) => setWorkDone(e.target.checked)} />
          Did I do my planned work today?
        </label>

        <div>
          <p className="text-sm text-gray-400 mb-2">What did I eat?</p>
          {meals.map((m, i) => (
            <input
              key={i}
              value={m.name}
              onChange={(e) => {
                const copy = [...meals];
                copy[i].name = e.target.value;
                setMeals(copy);
              }}
              placeholder="e.g. Dal, rice, salad"
              className="w-full bg-bg border border-gray-700 rounded-lg p-2 mb-2 text-sm"
            />
          ))}
          <button onClick={() => setMeals([...meals, { name: "" }])} className="text-xs text-accent">+ add meal</button>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">Notes / reflection</p>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full bg-bg border border-gray-700 rounded-lg p-2 text-sm" />
        </div>

        <p className="text-xs text-gray-500">
          Time wasted is calculated automatically from your <a href="/schedule" className="text-accent">Day Schedule</a> — no manual entry needed.
        </p>

        <BusyButton busy={saving} onClick={submit} className="bg-accent text-bg font-medium px-4 py-2 rounded-lg text-sm">
          {saving ? "Saving..." : "Save today's log"}
        </BusyButton>
        {saved && <p className="text-xs text-accent2">Saved.</p>}
      </div>

      <div className="bg-panel rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium text-gray-300">AI summary for today</p>
          <BusyButton busy={aiBusy} onClick={getAiSummary} className="bg-bg border border-gray-700 px-3 py-1.5 rounded-lg text-xs">
            {aiBusy ? "Thinking..." : "Generate"}
          </BusyButton>
        </div>
        {aiError && <p className="text-warn text-xs">{aiError}</p>}
        {aiSummary && <p className="text-sm text-gray-300 whitespace-pre-wrap">{aiSummary}</p>}
      </div>
    </div>
  );
}
