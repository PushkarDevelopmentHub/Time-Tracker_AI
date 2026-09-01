"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const MOODS = ["great", "good", "okay", "low", "bad"];

export default function HealthPage() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [mood, setMood] = useState("");
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState([]);
  const [bmi, setBmi] = useState(null);

  useEffect(() => {
    fetch("/api/health").then((r) => r.json()).then((d) => setHistory(d.health || []));
  }, []);

  async function save() {
    const res = await fetch("/api/health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        heightCm: Number(height) || null,
        weightKg: Number(weight) || null,
        mood,
        notes,
      }),
    });
    const data = await res.json();
    setBmi(data.health.bmi);
    setHistory([...history, data.health]);
    setNotes("");
  }

  const chartData = history.map((h) => ({
    date: new Date(h.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    weight: h.weightKg,
    bmi: h.bmi,
  }));

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">Health & Mind</h1>

      <div className="bg-panel rounded-xl p-4 mb-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="Height (cm)"
            className="bg-bg border border-gray-700 rounded-lg p-2 text-sm"
          />
          <input
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Weight (kg)"
            className="bg-bg border border-gray-700 rounded-lg p-2 text-sm"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {MOODS.map((m) => (
            <button
              key={m}
              onClick={() => setMood(m)}
              className={`px-3 py-1 rounded-full text-xs capitalize ${
                mood === m ? "bg-accent text-bg" : "bg-bg text-gray-400"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How are you feeling? Anything to note?"
          rows={3}
          className="w-full bg-bg border border-gray-700 rounded-lg p-2 text-sm"
        />

        <button onClick={save} className="bg-accent text-bg font-medium px-4 py-2 rounded-lg text-sm">
          Log today
        </button>
        {bmi && <p className="text-xs text-accent2">Your BMI: {bmi}</p>}
      </div>

      {chartData.length > 1 && (
        <div className="bg-panel rounded-xl p-4">
          <h2 className="text-sm text-gray-400 mb-2">Weight trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" stroke="#666" fontSize={11} />
              <YAxis stroke="#666" fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#7c9dff" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
