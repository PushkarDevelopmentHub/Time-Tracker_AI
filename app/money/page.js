"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { BusyButton } from "@/components/Spinner";
import { useToast, safeFetch } from "@/components/Toast";

export default function MoneyPage() {
  const { showError } = useToast();
  const [form, setForm] = useState({ spent: "", saved: "", category: "", notes: "" });
  const [logs, setLogs] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, []);
  function load() {
    fetch("/api/money").then((r) => r.json()).then((d) => setLogs(d.logs || []));
  }

  async function save() {
    setBusy(true);
    const data = await safeFetch(
      "/api/money",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) },
      showError,
      save
    );
    setBusy(false);
    if (data) {
      setForm({ spent: "", saved: "", category: "", notes: "" });
      load();
    }
  }

  const spendChart = logs.map((l) => ({
    date: new Date(l.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    spent: l.spent,
  }));
  const savingsChart = logs.map((l) => ({
    date: new Date(l.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    savings: l.cumulativeSaved,
  }));

  const totalSpent = logs.reduce((s, l) => s + l.spent, 0);
  const totalSaved = logs.reduce((s, l) => s + l.saved, 0);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-2">Money</h1>
      <p className="text-sm text-gray-400 mb-6">Track what you spend and save each day — separate from health/BMI.</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-panel rounded-xl p-3"><p className="text-[11px] text-gray-500">Total spent</p><p className="text-lg font-semibold text-warn">₹{totalSpent.toLocaleString()}</p></div>
        <div className="bg-panel rounded-xl p-3"><p className="text-[11px] text-gray-500">Total saved</p><p className="text-lg font-semibold text-accent2">₹{totalSaved.toLocaleString()}</p></div>
      </div>

      <div className="bg-panel rounded-xl p-4 mb-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount spent today" value={form.spent} onChange={(v) => setForm({ ...form, spent: v })} />
          <Field label="Amount saved today" value={form.saved} onChange={(v) => setForm({ ...form, saved: v })} />
        </div>
        <Field label="Category (optional, e.g. Food, Rent, Shopping)" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
        <Field label="Notes (optional)" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
        <BusyButton busy={busy} onClick={save} className="bg-accent text-bg font-medium px-4 py-2 rounded-lg text-sm">
          {busy ? "Saving..." : "Log today"}
        </BusyButton>
      </div>

      {spendChart.length > 0 && (
        <div className="bg-panel rounded-xl p-4 mb-6">
          <h2 className="text-sm text-gray-400 mb-2">Daily spend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={spendChart}>
              <XAxis dataKey="date" stroke="#666" fontSize={11} />
              <YAxis stroke="#666" fontSize={11} />
              <Tooltip />
              <Bar dataKey="spent" fill="#e0533d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {savingsChart.length > 0 && (
        <div className="bg-panel rounded-xl p-4">
          <h2 className="text-sm text-gray-400 mb-2">Savings over time (cumulative)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={savingsChart}>
              <XAxis dataKey="date" stroke="#666" fontSize={11} />
              <YAxis stroke="#666" fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="savings" stroke="#22a06b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-bg border border-gray-700 rounded-lg p-2 text-sm" />
    </div>
  );
}
