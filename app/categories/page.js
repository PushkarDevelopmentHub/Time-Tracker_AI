"use client";
import { useEffect, useState } from "react";
import { BusyButton } from "@/components/Spinner";
import { useToast, safeFetch } from "@/components/Toast";

export default function CategoriesPage() {
  const { showError } = useToast();
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState("");
  const [aiText, setAiText] = useState("");
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => { load(); }, []);
  function load() {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories || []));
  }

  async function addCategory() {
    if (!newName) return;
    setBusy(true);
    const data = await safeFetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName }) }, showError, addCategory);
    setBusy(false);
    if (data) { setNewName(""); load(); }
  }

  async function generateAI() {
    if (!aiText) return;
    setAiBusy(true);
    const data = await safeFetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bulkText: aiText }) }, showError, generateAI);
    setAiBusy(false);
    if (data) { setAiText(""); load(); }
  }

  async function saveRename(id) {
    if (!editName) return;
    await safeFetch("/api/categories", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: editName }) }, showError, () => saveRename(id));
    setEditing(null);
    load();
  }

  async function remove(id) {
    if (!confirm("Delete this category? Tasks already tagged with it will keep showing it as text but lose the link.")) return;
    await safeFetch(`/api/categories?id=${id}`, { method: "DELETE" }, showError, () => remove(id));
    load();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-2">Categories</h1>
      <p className="text-sm text-gray-400 mb-6">Manage the categories you tag tasks with (e.g. DSA, System Design, Interview Prep).</p>

      <div className="bg-panel rounded-xl p-4 mb-4 space-y-2">
        <p className="text-sm font-medium text-gray-300">Add one</p>
        <div className="flex gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. DSA" className="flex-1 bg-bg border border-gray-700 rounded-lg p-2 text-sm" />
          <BusyButton busy={busy} onClick={addCategory} className="bg-accent text-bg font-medium px-4 py-2 rounded-lg text-sm">{busy ? "Adding..." : "Add"}</BusyButton>
        </div>
      </div>

      <div className="bg-panel rounded-xl p-4 mb-6 space-y-2">
        <p className="text-sm font-medium text-gray-300">Generate a batch</p>
        <div className="flex gap-2">
          <input value={aiText} onChange={(e) => setAiText(e.target.value)} placeholder="1. DSA 2. System Design 3. Interview Prep" className="flex-1 bg-bg border border-gray-700 rounded-lg p-2 text-sm" />
          <BusyButton busy={aiBusy} onClick={generateAI} className="bg-bg border border-gray-700 px-4 py-2 rounded-lg text-sm whitespace-nowrap">{aiBusy ? "..." : "Generate"}</BusyButton>
        </div>
      </div>

      <div className="bg-panel rounded-xl divide-y divide-gray-800">
        {categories.map((c) => (
          <div key={c.id} className="p-3 flex items-center justify-between gap-2">
            {editing === c.id ? (
              <>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 bg-bg border border-gray-700 rounded-lg p-2 text-sm" />
                <button onClick={() => saveRename(c.id)} className="text-xs text-accent2">Save</button>
                <button onClick={() => setEditing(null)} className="text-xs text-gray-500">Cancel</button>
              </>
            ) : (
              <>
                <span className="text-sm">{c.name}</span>
                <div className="flex gap-3">
                  <button onClick={() => { setEditing(c.id); setEditName(c.name); }} className="text-xs text-accent">Rename</button>
                  <button onClick={() => remove(c.id)} className="text-xs text-warn">Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
        {categories.length === 0 && <p className="p-4 text-sm text-gray-500">No categories yet — add one above.</p>}
      </div>
    </div>
  );
}
