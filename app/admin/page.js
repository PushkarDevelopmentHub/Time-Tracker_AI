"use client";
import { useEffect, useState } from "react";

const TYPES = ["day", "goal", "routine", "schedule", "leave", "media", "time", "money", "health", "mood", "hobby"];

export default function AdminPage() {
  const [type, setType] = useState("day");
  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetch(`/api/admin?type=${type}`).then((r) => r.json()).then((d) => setRecords(d.records || []));
  }, [type]);

  async function remove(id) {
    await fetch(`/api/admin?type=${type}&id=${id}`, { method: "DELETE" });
    setRecords(records.filter((r) => r.id !== id));
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-2">Admin</h1>
      <p className="text-sm text-gray-400 mb-6">
        Full control — browse and permanently delete anything you've logged.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-3 py-1 rounded-full text-xs capitalize ${
              type === t ? "bg-accent text-bg" : "bg-panel text-gray-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-panel rounded-xl divide-y divide-gray-800">
        {records.map((r) => (
          <div key={r.id} className="p-3 flex items-center justify-between gap-3 text-sm">
            <pre className="text-xs text-gray-400 overflow-x-auto flex-1">
              {JSON.stringify(r, null, 0)}
            </pre>
            <button
              onClick={() => remove(r.id)}
              className="text-warn text-xs shrink-0 border border-warn/40 rounded px-2 py-1"
            >
              Delete
            </button>
          </div>
        ))}
        {records.length === 0 && <p className="p-4 text-sm text-gray-500">No records.</p>}
      </div>
    </div>
  );
}
