"use client";
import { useEffect, useState } from "react";
import { BusyButton } from "@/components/Spinner";
import { useToast, safeFetch } from "@/components/Toast";

const PERIODS = ["day", "week", "month", "year"];

export default function ReportsPage() {
  const { showError } = useToast();
  const [period, setPeriod] = useState("day");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [provider, setProvider] = useState("gemini");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories || []));
  }, []);

  async function generate() {
    setBusy(true);
    setSummary("");
    const data = await safeFetch(
      "/api/reports",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ period, date, provider, categoryId: categoryId || undefined }) },
      showError,
      generate
    );
    if (data) { setSummary(data.summary); setLabel(data.label); }
    setBusy(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-2">AI Summary</h1>
      <p className="text-sm text-gray-400 mb-6">Day, week, month, or year — optionally filtered to one category — with concrete improvement suggestions.</p>

      <div className="bg-panel rounded-xl p-4 mb-6 space-y-3">
        <div className="flex gap-1 flex-wrap">
          {PERIODS.map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs capitalize ${period === p ? "bg-accent text-bg" : "bg-bg text-gray-400"}`}>{p}</button>
          ))}
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-bg border border-gray-700 rounded-lg p-2 text-sm" />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="bg-bg border border-gray-700 rounded-lg p-2 text-sm w-full">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex items-center justify-between">
          <div className="flex gap-1 text-xs">
            <button onClick={() => setProvider("gemini")} className={`px-2 py-1 rounded ${provider === "gemini" ? "bg-accent text-bg" : "bg-bg text-gray-400"}`}>Gemini (free)</button>
            <button onClick={() => setProvider("claude")} className={`px-2 py-1 rounded ${provider === "claude" ? "bg-accent text-bg" : "bg-bg text-gray-400"}`}>Claude</button>
          </div>
          <BusyButton busy={busy} onClick={generate} className="bg-accent text-bg font-medium px-4 py-2 rounded-lg text-sm">{busy ? "Generating..." : "Generate"}</BusyButton>
        </div>
      </div>

      {summary && (
        <div className="bg-panel rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">{label}{categoryId && ` — ${categories.find((c) => c.id === categoryId)?.name}`}</p>
          <div className="whitespace-pre-wrap text-sm text-gray-200">{summary}</div>
        </div>
      )}
    </div>
  );
}
