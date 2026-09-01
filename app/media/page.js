"use client";
import { useEffect, useState } from "react";

export default function MediaPage() {
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [markHidden, setMarkHidden] = useState(false);

  useEffect(() => {
    fetch("/api/media?hidden=false").then((r) => r.json()).then((d) => setItems(d.media || []));
  }, []);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    const initRes = await fetch("/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name }),
    });
    const { signedUrl, path } = await initRes.json();

    // Supabase's signed upload URL accepts a direct PUT of the file.
    await fetch(signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });

    const confirmRes = await fetch("/api/media", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path,
        type: file.type.startsWith("video") ? "video" : "photo",
        category: "daily",
        isHidden: markHidden,
      }),
    });
    const { media } = await confirmRes.json();
    if (!markHidden) setItems([media, ...items]);
    setUploading(false);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Photos & Video</h1>

      <div className="bg-panel rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <input type="file" accept="image/*,video/*" onChange={handleUpload} className="text-sm" />
        <label className="flex items-center gap-2 text-sm text-gray-400">
          <input type="checkbox" checked={markHidden} onChange={(e) => setMarkHidden(e.target.checked)} />
          Save to private folder instead
        </label>
        {uploading && <span className="text-xs text-accent2">Uploading...</span>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((m) => (
          <div key={m.id} className="bg-panel rounded-lg overflow-hidden aspect-square">
            {m.type === "video" ? (
              <video src={m.url} className="w-full h-full object-cover" controls />
            ) : (
              <img src={m.url} className="w-full h-full object-cover" alt={m.caption || ""} />
            )}
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <p className="text-sm text-gray-500">No photos or videos yet — upload your first one above.</p>
      )}
    </div>
  );
}
