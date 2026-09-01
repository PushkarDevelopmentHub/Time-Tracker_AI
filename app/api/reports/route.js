import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { generatePeriodSummary } from "@/lib/ai";

// POST { period: "day"|"week"|"month"|"year", date: "YYYY-MM-DD", provider }
export async function POST(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { period, date, provider = "gemini", categoryId } = await req.json();
  const anchor = new Date(date || new Date());

  let start, end, label;
  if (period === "day") {
    start = new Date(anchor.toDateString());
    end = start;
    label = start.toLocaleDateString();
  } else if (period === "week") {
    const day = anchor.getDay();
    start = new Date(anchor);
    start.setDate(anchor.getDate() - day);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
    label = `week of ${start.toLocaleDateString()}`;
  } else if (period === "year") {
    start = new Date(anchor.getFullYear(), 0, 1);
    end = new Date(anchor.getFullYear(), 11, 31);
    label = `${anchor.getFullYear()}`;
  } else {
    start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    label = start.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }

  const [days, goals, timeLogs, moneyLogs, healthLogs, hobbies, blocks] = await Promise.all([
    prisma.dayLog.findMany({ where: { userId, date: { gte: start, lte: end } }, include: { meals: true } }),
    prisma.goal.findMany({ where: { userId } }),
    prisma.timeLog.findMany({ where: { userId, date: { gte: start, lte: end } } }),
    prisma.moneyLog.findMany({ where: { userId, date: { gte: start, lte: end } } }),
    prisma.healthLog.findMany({ where: { userId, date: { gte: start, lte: end } } }),
    prisma.hobbyLog.findMany({ where: { userId, date: { gte: start, lte: end } } }),
    prisma.scheduleBlock.findMany({
      where: { userId, date: { gte: start, lte: end }, ...(categoryId ? { categoryId } : {}) },
      include: { items: true, category: true },
    }),
  ]);

  let summary;
  try {
    summary = await generatePeriodSummary(label, { days, goals, timeLogs, moneyLogs, healthLogs, hobbies, blocks }, provider);
  } catch (e) {
    return NextResponse.json({ error: e.message || "AI request failed" }, { status: 500 });
  }

  return NextResponse.json({ summary, label });
}
