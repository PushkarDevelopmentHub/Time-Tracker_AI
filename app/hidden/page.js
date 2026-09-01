"use client";
import { useState } from "react";

export default function HiddenFolderPage() {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  async function unlock() {
    const res = await fetch("/api/hidden-folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", pin }),
    });
    const data = await res.json();
    if (data.valid) {
      setUnlocked(true);
      const mediaRes = await fetch("/api/media?hidden=true");
      const mediaData = await mediaRes.json();
      setItems(mediaData.media || []);
    } else {
      setError("Wrong PIN.");
    }
  }

  if (!unlocked) {
    return (
      <div className="max-w-sm mx-auto mt-24 bg-panel rounded-xl p-6 text-center">
        <h1 className="text-lg font-semibold mb-4">Private Folder</h1>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter PIN"
          className="w-full bg-bg border border-gray-700 rounded-lg p-2 mb-3 text-sm text-center"
        />
        <button onClick={unlock} className="w-full bg-accent text-bg py-2 rounded-lg text-sm">
          Unlock
        </button>
        {error && <p className="text-warn text-xs mt-2">{error}</p>}
        <p className="text-xs text-gray-500 mt-4">
          First time here? Set a PIN from Settings before this page will unlock.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Private Folder</h1>
      <p className="text-sm text-gray-400 mb-4">
        Only media marked "hidden" shows here — separate from your normal gallery.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((m) => (
          <div key={m.id} className="bg-panel rounded-lg overflow-hidden aspect-square">
            {m.type === "video" ? (
              <video src={m.url} className="w-full h-full object-cover" controls />
            ) : (
              <img src={m.url} className="w-full h-full object-cover" alt="" />
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500 col-span-full">Nothing here yet.</p>}
      </div>
    </div>
  );
}
