import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

function toMins(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// GET ?period=week|month|year&date=YYYY-MM-DD
export async function GET(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "week";
  const anchor = new Date(searchParams.get("date") || new Date());

  if (period === "year") {
    const months = [];
    for (let m = 0; m < 12; m++) {
      const start = new Date(anchor.getFullYear(), m, 1);
      const end = new Date(anchor.getFullYear(), m + 1, 0);
      const count = await prisma.scheduleBlock.count({ where: { userId, date: { gte: start, lte: end } } });
      months.push({ label: start.toLocaleDateString(undefined, { month: "long" }), date: start.toISOString().slice(0, 10), blockCount: count });
    }
    return NextResponse.json({ period, items: months });
  }

  let start, end;
  if (period === "week") {
    const day = anchor.getDay();
    start = new Date(anchor);
    start.setDate(anchor.getDate() - day);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
  } else {
    start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  }

  const days = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const dayOnly = new Date(cursor.toDateString());
    const blocks = await prisma.scheduleBlock.findMany({ where: { userId, date: dayOnly } });
    const covered = new Set();
    for (const b of blocks) for (let m = toMins(b.startTime); m < toMins(b.endTime); m += 15) covered.add(m);
    days.push({
      date: dayOnly.toISOString().slice(0, 10),
      label: dayOnly.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
      blockCount: blocks.length,
      workedMins: covered.size * 15,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return NextResponse.json({ period, items: days });
}
