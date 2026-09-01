"use client";
import { useState } from "react";
import { BusyButton } from "@/components/Spinner";
import { useToast, safeFetch } from "@/components/Toast";

export default function QuickAdd() {
  const { showError } = useToast();
  const [text, setText] = useState("");
  const [provider, setProvider] = useState("gemini");
  const [result, setResult] = useState("");
  const [idea, setIdea] = useState("");
  const [busy, setBusy] = useState(false);
  const [busy2, setBusy2] = useState(false);

  async function submit() {
    if (!text) return;
    setBusy(true);
    setResult("");
    const data = await safeFetch(
      "/api/quick-add",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, provider }) },
      showError,
      submit
    );
    if (data) setResult(`Logged under: ${data.category}`);
    setText("");
    setBusy(false);
  }

  async function freeHourIdea() {
    setBusy2(true);
    const data = await safeFetch(
      "/api/free-hour",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider }) },
      showError,
      freeHourIdea
    );
    if (data) setIdea(data.idea);
    setBusy2(false);
  }

  return (
    <div className="bg-panel rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-gray-300">Quick add (just describe it)</h2>
        <div className="flex gap-1 text-xs">
          <button onClick={() => setProvider("gemini")} className={`px-2 py-1 rounded ${provider === "gemini" ? "bg-accent text-bg" : "bg-bg text-gray-400"}`}>Gemini</button>
          <button onClick={() => setProvider("claude")} className={`px-2 py-1 rounded ${provider === "claude" ? "bg-accent text-bg" : "bg-bg text-gray-400"}`}>Claude</button>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. 'Gym 3pm to 4pm' or 'Read for 30 min'"
        rows={2}
        className="w-full bg-bg border border-gray-700 rounded-lg p-2 text-sm mb-3"
      />

      <div className="flex gap-2 flex-wrap">
        <BusyButton busy={busy} onClick={submit} className="bg-accent text-bg font-medium px-3 py-2 rounded-lg text-sm">
          {busy ? "Logging..." : "Log it"}
        </BusyButton>
        <BusyButton busy={busy2} onClick={freeHourIdea} className="bg-bg border border-gray-700 px-3 py-2 rounded-lg text-sm">
          {busy2 ? "Thinking..." : "🎲 Got a free hour \u2014 give me something to do"}
        </BusyButton>
      </div>

      {result && <p className="text-xs text-accent2 mt-2">{result}</p>}
      {idea && <p className="text-sm text-gray-300 mt-3 border-t border-gray-700 pt-3">{idea}</p>}
    </div>
  );
}
