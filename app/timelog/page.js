"use client";
import { useEffect, useState } from "react";
import { BusyButton } from "@/components/Spinner";

const ICONS = { task: "✅", hobby: "🎨", mood: "🙂", meal: "🍽", media: "📷" };

export default function TimeLogPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // new task form
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationMins, setDurationMins] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, [date]);

  function load() {
    setLoading(true);
    fetch(`/api/timelog?date=${date}`).then((r) => r.json()).then((d) => {
      setData(d);
      setLoading(false);
    });
  }

  async function addTask() {
    if (!title) return;
    setSaving(true);
    await fetch("/api/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        startTime,
        durationMins: Number(durationMins) || null,
        items: itemsText.split("\n").map((s) => s.trim()).filter(Boolean),
      }),
    });
    setTitle(""); setStartTime(""); setDurationMins(""); setItemsText("");
    setSaving(false);
    load();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-2">Full Day Timeline</h1>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="bg-panel border border-gray-700 rounded-lg p-2 text-sm mb-6"
      />

      <div className="bg-panel rounded-xl p-4 mb-6 space-y-2">
        <p className="text-sm font-medium text-gray-300 mb-1">Log a detailed activity</p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. DSA practice"
          className="w-full bg-bg border border-gray-700 rounded-lg p-2 text-sm"
        />
        <div className="flex gap-2">
          <input
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            placeholder="Start time, e.g. 9:00 PM"
            className="flex-1 bg-bg border border-gray-700 rounded-lg p-2 text-sm"
          />
          <input
            value={durationMins}
            onChange={(e) => setDurationMins(e.target.value)}
            placeholder="Minutes"
            className="w-28 bg-bg border border-gray-700 rounded-lg p-2 text-sm"
          />
        </div>
        <textarea
          value={itemsText}
          onChange={(e) => setItemsText(e.target.value)}
          rows={3}
          placeholder={"Sub-items, one per line — e.g.\nTwo Sum\nMerge Intervals\nBinary Search variant"}
          className="w-full bg-bg border border-gray-700 rounded-lg p-2 text-sm"
        />
        <BusyButton busy={saving} onClick={addTask} className="bg-accent text-bg font-medium px-4 py-2 rounded-lg text-sm">
          {saving ? "Saving..." : "Add to timeline"}
        </BusyButton>
        <p className="text-xs text-gray-500">Photo attach: use Quick Add on the dashboard, or upload on the Media page and it'll show here too.</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="bg-panel rounded-xl divide-y divide-gray-800">
          {data?.timeline?.length === 0 && <p className="p-4 text-sm text-gray-500">Nothing logged this day.</p>}
          {data?.timeline?.map((item, i) => (
            <div key={i} className="p-3 flex gap-3">
              <span className="text-lg">{ICONS[item.type]}</span>
              <div className="flex-1 text-sm">
                <p className="font-medium">
                  {item.title || item.name || item.mood || "Entry"}
                  {item.time && <span className="text-gray-500 font-normal"> · {item.time}</span>}
                  {item.durationMins && <span className="text-gray-500 font-normal"> · {item.durationMins} min</span>}
                </p>
                {item.items?.length > 0 && (
                  <ul className="text-xs text-gray-400 mt-1 list-disc list-inside">
                    {item.items.map((it) => (
                      <li key={it.id} className={it.done ? "line-through" : ""}>{it.text}</li>
                    ))}
                  </ul>
                )}
                {item.type === "media" && (
                  <img src={item.url} className="w-24 h-24 object-cover rounded-lg mt-1" alt="" />
                )}
                {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
