"use client";
import { useEffect, useState } from "react";

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    fetch("/api/goals").then((r) => r.json()).then((d) => setGoals(d.goals || []));
  }, []);

  async function addGoal() {
    if (!title) return;
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category }),
    });
    const data = await res.json();
    if (data.goal) {
      setGoals([data.goal, ...goals]);
      setTitle("");
      setCategory("");
    }
  }

  async function updateProgress(id, progress) {
    await fetch("/api/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, progress }),
    });
    setGoals(goals.map((g) => (g.id === id ? { ...g, progress, completed: progress >= 100 } : g)));
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-2">Goal Maker</h1>
      <p className="text-sm text-gray-400 mb-6">{goals.length} goal{goals.length !== 1 ? "s" : ""} this year</p>

      <div className="bg-panel rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New goal, e.g. 'Run a 10k'"
          className="flex-1 bg-bg border border-gray-700 rounded-lg p-2 text-sm"
        />
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category (optional)"
          className="sm:w-40 bg-bg border border-gray-700 rounded-lg p-2 text-sm"
        />
        <button onClick={addGoal} className="bg-accent text-bg font-medium px-4 py-2 rounded-lg text-sm">
          Add
        </button>
      </div>

      <div className="space-y-3">
        {goals.map((g) => (
          <div key={g.id} className="bg-panel rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <span className="font-medium">{g.title}</span>
              <span className="text-xs text-gray-400">{g.category}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={g.progress}
              onChange={(e) => updateProgress(g.id, Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-400 mt-1">{g.progress}% {g.completed && "✓ done"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
