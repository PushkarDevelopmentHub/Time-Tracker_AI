"use client";
import { useEffect, useState, useRef } from "react";
import { BusyButton } from "@/components/Spinner";
import { useToast, safeFetch } from "@/components/Toast";

function toMins(t) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }

export default function SchedulePage() {
  const { showError } = useToast();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ startTime: "", endTime: "", activity: "", notes: "", itemsText: "", categoryId: "", photoFile: null });
  const [saving, setSaving] = useState(false);
  const [repeatDays, setRepeatDays] = useState(7);
  const [repeating, setRepeating] = useState(false);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState("");
  const [aiCatText, setAiCatText] = useState("");
  const [reviewing, setReviewing] = useState(null); // holds pending block for confirm modal
  const fileRef = useRef();
  const csvRef = useRef();

  useEffect(() => { load(); loadCategories(); }, [date]);

  function load() {
    setLoading(true);
    fetch(`/api/schedule?date=${date}`).then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  }
  function loadCategories() {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories || []));
  }

  function checkConflict() {
    if (!data) return null;
    const s = toMins(form.startTime), e = toMins(form.endTime);
    return data.blocks.find((b) => {
      const bs = toMins(b.startTime), be = toMins(b.endTime);
      return s < be && e > bs;
    });
  }

  function openReview() {
    if (!form.startTime || !form.endTime || !form.activity) {
      showError("Fill start time, end time, and activity first.");
      return;
    }
    const conflict = checkConflict();
    if (conflict) {
      showError(`That time overlaps "${conflict.activity}" (${conflict.startTime}–${conflict.endTime}). Change the time, or edit that entry instead.`);
      return;
    }
    setReviewing({ ...form });
  }

  async function confirmSave() {
    setSaving(true);
    let photoUrl = null;
    if (form.photoFile) {
      photoUrl = await uploadPhoto(form.photoFile);
    }
    const result = await safeFetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        startTime: form.startTime, endTime: form.endTime, activity: form.activity, notes: form.notes,
        categoryId: form.categoryId || null,
        items: form.itemsText.split("\n").map((s) => s.trim()).filter(Boolean),
        photoUrl,
      }),
    }, showError, confirmSave);
    setSaving(false);
    if (result) {
      setForm({ startTime: "", endTime: "", activity: "", notes: "", itemsText: "", categoryId: "", photoFile: null });
      setReviewing(null);
      load();
    }
  }

  async function uploadPhoto(file) {
    const initRes = await fetch("/api/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: file.name }) });
    const { signedUrl, path } = await initRes.json();
    await fetch(signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    const confirmRes = await fetch("/api/media", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path, type: "photo", category: "daily" }) });
    const { media } = await confirmRes.json();
    return media?.url || null;
  }

  async function deleteBlock(id) {
    await safeFetch(`/api/schedule?id=${id}`, { method: "DELETE" }, showError, () => deleteBlock(id));
    load();
  }
  async function toggleItem(itemId, done) {
    await safeFetch("/api/schedule", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId, done: !done }) }, showError, () => toggleItem(itemId, done));
    load();
  }
  async function repeatSchedule() {
    setRepeating(true);
    const d = await safeFetch("/api/schedule/repeat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceDate: date, targetDays: repeatDays }) }, showError, repeatSchedule);
    setRepeating(false);
    if (d) alert(`Copied to ${d.createdDays} days.`);
  }
  async function markLeave() {
    await safeFetch("/api/leave", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, reason: "Leave" }) }, showError, markLeave);
    load();
  }
  function downloadTemplate() { window.open(`/api/schedule/template?date=${date}`, "_blank"); }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setUploadErrors([]);
    const text = await file.text();
    const res = await fetch("/api/schedule/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ csv: text }) });
    const d = await res.json();
    setUploading(false);
    if (!d.ok) setUploadErrors(d.errors || [d.error]);
    else { alert(`Saved ${d.savedCount} entries.`); load(); }
    fileRef.current.value = "";
  }

  async function addCategory() {
    if (!newCatName) return;
    await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCatName }) });
    setNewCatName("");
    loadCategories();
  }
  async function generateCategoriesAI() {
    if (!aiCatText) return;
    await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bulkText: aiCatText }) });
    setAiCatText("");
    loadCategories();
  }

  const totals = data?.totals || { workedMins: 0, officeMins: 0, wastedMins: 0, sleepMins: 0 };
  const allBlocks = data ? [...data.blocks, ...(data.autoOffice ? [data.autoOffice] : [])].sort((a, b) => a.startTime.localeCompare(b.startTime)) : [];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-2">Day Schedule</h1>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-panel border border-gray-700 rounded-lg p-2 text-sm mb-6" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="Office" mins={totals.officeMins} color="text-gray-400" />
        <Stat label="Personal productive" mins={totals.workedMins} color="text-accent2" />
        <Stat label="Wasted (auto)" mins={totals.wastedMins} color="text-warn" />
        <Stat label="Sleep" mins={totals.sleepMins} color="text-accent" />
      </div>
      {data?.onLeave && <p className="text-xs text-accent2 mb-4">Marked as leave today.</p>}

      {loading ? <p className="text-sm text-gray-500">Loading...</p> : (
        <div className="bg-panel rounded-xl overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-500 border-b border-gray-800"><th className="p-3">Time</th><th className="p-3">Activity</th><th className="p-3">Notes</th><th></th></tr></thead>
            <tbody>
              {allBlocks.map((b, i) => (
                <tr key={b.id || `auto-${i}`} className="border-b border-gray-800 last:border-0">
                  <td className="p-3 whitespace-nowrap text-gray-400">{b.startTime}–{b.endTime}</td>
                  <td className="p-3">
                    {b.category && <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded mr-1">{b.category.name}</span>}
                    {b.activity} {b.isOffice && <span className="text-[10px] text-gray-500">(auto)</span>}
                    {b.photoUrl && <img src={b.photoUrl} className="w-16 h-16 object-cover rounded-lg mt-1" alt="" />}
                    {b.items?.length > 0 && (
                      <ul className="mt-1 space-y-1">
                        {b.items.map((it) => (
                          <li key={it.id} className="flex items-center gap-2 text-xs text-gray-400">
                            <input type="checkbox" checked={it.done} onChange={() => toggleItem(it.id, it.done)} />
                            <span className={it.done ? "line-through" : ""}>{it.text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="p-3 text-xs text-gray-500">{b.notes}</td>
                  <td className="p-3">{b.id && <button onClick={() => deleteBlock(b.id)} className="text-warn text-xs">✕</button>}</td>
                </tr>
              ))}
              {allBlocks.length === 0 && <tr><td colSpan={4} className="p-4 text-sm text-gray-500">No blocks yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-panel rounded-xl p-4 mb-6 space-y-3">
        <p className="text-sm font-medium text-gray-300">Add a time block (15-min steps)</p>
        <div className="grid grid-cols-2 gap-2">
          <input type="time" step="900" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="input" />
          <input type="time" step="900" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="input" />
        </div>
        <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input">
          <option value="">No category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })} placeholder="What did you do?" className="input" />
        <textarea value={form.itemsText} onChange={(e) => setForm({ ...form, itemsText: e.target.value })} rows={3} placeholder={"Sub-items, one per line"} className="input" />
        <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes (optional)" className="input" />
        <div>
          <p className="text-xs text-gray-400 mb-1">Photo (optional)</p>
          <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, photoFile: e.target.files[0] })} className="text-xs" />
        </div>
        <button onClick={openReview} className="bg-accent text-bg font-medium px-4 py-2 rounded-lg text-sm">Review & Save</button>
      </div>

      <div className="bg-panel rounded-xl p-4 mb-6 space-y-3">
        <p className="text-sm font-medium text-gray-300">Categories</p>
        <div className="flex flex-wrap gap-1">
          {categories.map((c) => <span key={c.id} className="text-xs bg-bg px-2 py-1 rounded-full">{c.name}</span>)}
        </div>
        <div className="flex gap-2">
          <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="New category" className="input" />
          <button onClick={addCategory} className="text-xs bg-bg border border-gray-700 px-3 py-2 rounded-lg whitespace-nowrap">Add</button>
        </div>
        <div className="flex gap-2">
          <input value={aiCatText} onChange={(e) => setAiCatText(e.target.value)} placeholder="e.g. 1. DSA 2. System Design 3. Interview Prep" className="input" />
          <button onClick={generateCategoriesAI} className="text-xs bg-bg border border-gray-700 px-3 py-2 rounded-lg whitespace-nowrap">Generate list</button>
        </div>
      </div>

      <div className="bg-panel rounded-xl p-4 mb-6 space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-300 mb-2">Repeat this day's schedule</p>
          <div className="flex gap-2 items-center">
            <input type="number" value={repeatDays} onChange={(e) => setRepeatDays(Number(e.target.value))} className="w-20 input" />
            <span className="text-xs text-gray-400">days forward</span>
            <BusyButton busy={repeating} onClick={repeatSchedule} className="ml-auto bg-bg border border-gray-700 px-3 py-2 rounded-lg text-sm">{repeating ? "Copying..." : "Copy"}</BusyButton>
          </div>
        </div>
        <div className="flex justify-between items-center border-t border-gray-800 pt-4">
          <p className="text-sm text-gray-300">On leave today?</p>
          <button onClick={markLeave} className="text-xs bg-bg border border-gray-700 px-3 py-1.5 rounded-lg">Mark as leave</button>
        </div>
        <div className="border-t border-gray-800 pt-4">
          <p className="text-sm font-medium text-gray-300 mb-2">Fill offline instead</p>
          <div className="flex gap-2">
            <button onClick={downloadTemplate} className="text-xs bg-bg border border-gray-700 px-3 py-2 rounded-lg">Download template</button>
            <label className="text-xs bg-bg border border-gray-700 px-3 py-2 rounded-lg cursor-pointer">
              {uploading ? "Uploading..." : "Upload filled CSV"}
              <input ref={fileRef} type="file" accept=".csv" onChange={handleUpload} className="hidden" />
            </label>
          </div>
          {uploadErrors.length > 0 && <div className="mt-2 text-xs text-warn space-y-1">{uploadErrors.map((e, i) => <p key={i}>{e}</p>)}</div>}
        </div>
      </div>

      {/* Review-before-save modal */}
      {reviewing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-panel rounded-xl p-5 max-w-sm w-full">
            <h2 className="text-sm font-semibold mb-3">Confirm this entry</h2>
            <div className="text-sm space-y-1 mb-4">
              <p><span className="text-gray-500">Time:</span> {reviewing.startTime}–{reviewing.endTime}</p>
              <p><span className="text-gray-500">Activity:</span> {reviewing.activity}</p>
              {reviewing.categoryId && <p><span className="text-gray-500">Category:</span> {categories.find((c) => c.id === reviewing.categoryId)?.name}</p>}
              {reviewing.itemsText && <p><span className="text-gray-500">Sub-items:</span> {reviewing.itemsText.split("\n").filter(Boolean).length}</p>}
              {reviewing.notes && <p><span className="text-gray-500">Notes:</span> {reviewing.notes}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setReviewing(null)} className="flex-1 bg-bg border border-gray-700 py-2 rounded-lg text-sm">Edit</button>
              <BusyButton busy={saving} onClick={confirmSave} className="flex-1 justify-center bg-accent text-bg font-medium py-2 rounded-lg text-sm">{saving ? "Saving..." : "Save"}</BusyButton>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`.input { width:100%; background: var(--bg); border:1px solid #333; border-radius:0.5rem; padding:0.5rem; font-size:0.875rem; }`}</style>
    </div>
  );
}

function Stat({ label, mins, color }) {
  const h = Math.floor(mins / 60), m = mins % 60;
  return (<div className="bg-panel rounded-xl p-3"><p className="text-[11px] text-gray-500">{label}</p><p className={`text-lg font-semibold ${color}`}>{h}h {m}m</p></div>);
}
