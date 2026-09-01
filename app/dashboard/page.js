"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import QuickAdd from "@/components/QuickAdd";
import Spinner from "@/components/Spinner";

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/onboarding").then((r) => r.json()).then((d) => {
      if (!d.profile?.onboarded) {
        router.push("/onboarding");
        return;
      }
      fetch("/api/overview").then((r) => r.json()).then(setData);
    });
  }, []);

  if (!data) {
    return (
      <div className="flex justify-center py-24 text-gray-500">
        <Spinner size={28} />
      </div>
    );
  }

  const { day, goals, wastedMins, productiveMins, hobbies, goalCount } = data;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {day?.workDone ? "Work logged today ✓" : "No work logged yet today"}
        </p>
      </header>

      <QuickAdd />

      {/* Combined "today" card — everything in one place */}
      <section className="bg-panel rounded-xl p-4 md:p-6 mb-6">
        <h2 className="text-sm font-medium text-gray-300 mb-3">Today, all in one place</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MiniStat label="Work" value={day?.workDone ? "Done" : "Pending"} />
          <MiniStat label="Meals logged" value={day?.meals?.length || 0} />
          <MiniStat label="Productive min" value={productiveMins} accent />
          <MiniStat label="Wasted min" value={wastedMins} warn />
        </div>
        {hobbies?.length > 0 && (
          <p className="text-xs text-gray-400 mt-3">Hobby today: {hobbies.map((h) => h.name).join(", ")}</p>
        )}
        {day?.summary && <p className="text-sm text-gray-300 mt-3 border-t border-gray-800 pt-3">{day.summary}</p>}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-panel rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-medium text-gray-300">Your goals ({goalCount}/50)</h2>
            <Link href="/goals" className="text-xs text-accent">View all →</Link>
          </div>
          {goals.length === 0 && <p className="text-xs text-gray-500">No active goals yet.</p>}
          {goals.map((g) => (
            <div key={g.id} className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span>{g.title}</span>
                <span className="text-gray-500">{g.progress}%</span>
              </div>
              <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${g.progress}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-panel rounded-xl p-4">
          <h2 className="text-sm font-medium text-gray-300 mb-3">Quick links</h2>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/daily" className="text-sm bg-bg rounded-lg p-3 hover:bg-accent/10">📝 Log today</Link>
            <Link href="/routine" className="text-sm bg-bg rounded-lg p-3 hover:bg-accent/10">📅 Routine</Link>
            <Link href="/timelog" className="text-sm bg-bg rounded-lg p-3 hover:bg-accent/10">⏱ Day timeline</Link>
            <Link href="/reports" className="text-sm bg-bg rounded-lg p-3 hover:bg-accent/10">🤖 AI summary</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniStat({ label, value, accent, warn }) {
  return (
    <div className="bg-bg rounded-lg p-3">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className={`text-lg font-semibold mt-0.5 ${accent ? "text-accent2" : warn ? "text-warn" : ""}`}>{value}</p>
    </div>
  );
}
