import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { generateDailySummary } from "@/lib/ai";

// POST { date, provider } -> generates + saves an AI summary for that day
export async function POST(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { date, provider = "gemini" } = await req.json();
  const dayOnly = new Date((date ? new Date(date) : new Date()).toDateString());

  const [day, blocks, timeLogs] = await Promise.all([
    prisma.dayLog.findUnique({ where: { userId_date: { userId, date: dayOnly } }, include: { meals: true } }),
    prisma.scheduleBlock.findMany({ where: { userId, date: dayOnly }, include: { items: true } }),
    prisma.timeLog.findMany({ where: { userId, date: dayOnly } }),
  ]);

  let aiSummary;
  try {
    aiSummary = await generateDailySummary({ day, blocks, timeLogs }, provider);
  } catch (e) {
    return NextResponse.json({ error: e.message || "AI request failed" }, { status: 500 });
  }

  const saved = await prisma.dayLog.upsert({
    where: { userId_date: { userId, date: dayOnly } },
    update: { aiSummary },
    create: { userId, date: dayOnly, aiSummary },
  });

  return NextResponse.json({ aiSummary, day: saved });
}
