"use client";
import { useEffect, useState } from "react";
import { BusyButton } from "@/components/Spinner";

export default function SettingsPage() {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/onboarding").then((r) => r.json()).then((d) => {
      setForm(
        d.profile || {
          heightCm: "", weightKg: "", currentSalary: "",
          officeStartTime: "09:30", officeEndTime: "18:30", officeDays: "Mon,Tue,Wed,Thu,Fri",
          sleepStartTime: "23:30", sleepEndTime: "06:00",
        }
      );
    });
  }, []);

  async function save() {
    setBusy(true);
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        heightCm: Number(form.heightCm) || null,
        weightKg: Number(form.weightKg) || null,
        currentSalary: Number(form.currentSalary) || null,
      }),
    });
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!form) return <p className="text-sm text-gray-500">Loading...</p>;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-6">Settings</h1>

      <div className="bg-panel rounded-xl p-4 space-y-4">
        <Row label="Height (cm)"><input value={form.heightCm || ""} onChange={set("heightCm")} className="input" /></Row>
        <Row label="Weight (kg)"><input value={form.weightKg || ""} onChange={set("weightKg")} className="input" /></Row>
        <Row label="Current salary">
          <input value={form.currentSalary || ""} onChange={set("currentSalary")} className="input" />
          <p className="text-[11px] text-gray-500 mt-1">Changing this (e.g. after a hike) is logged with today's date — past months keep the old value.</p>
        </Row>
        <div className="grid grid-cols-2 gap-3">
          <Row label="Office start"><input value={form.officeStartTime || ""} onChange={set("officeStartTime")} className="input" /></Row>
          <Row label="Office end"><input value={form.officeEndTime || ""} onChange={set("officeEndTime")} className="input" /></Row>
        </div>
        <Row label="Office days"><input value={form.officeDays || ""} onChange={set("officeDays")} className="input" /></Row>
        <div className="grid grid-cols-2 gap-3">
          <Row label="Sleep start"><input value={form.sleepStartTime || ""} onChange={set("sleepStartTime")} className="input" /></Row>
          <Row label="Sleep end"><input value={form.sleepEndTime || ""} onChange={set("sleepEndTime")} className="input" /></Row>
        </div>

        <BusyButton busy={busy} onClick={save} className="w-full justify-center bg-accent text-bg font-medium py-3 rounded-xl text-sm">
          {busy ? "Saving..." : "Save changes"}
        </BusyButton>
        {saved && <p className="text-xs text-accent2 text-center">Saved.</p>}
      </div>

      <style jsx global>{`.input { width:100%; background: var(--bg); border:1px solid #333; border-radius:0.5rem; padding:0.5rem; font-size:0.875rem; }`}</style>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {children}
    </div>
  );
}
