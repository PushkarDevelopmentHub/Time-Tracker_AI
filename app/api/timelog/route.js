import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

// GET ?date=YYYY-MM-DD -> everything logged that day, chronological
export async function GET(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = new Date(searchParams.get("date") || new Date().toDateString());
  const dayOnly = new Date(date.toDateString());

  const [day, blocks, moods, hobbies, media, timeLogs, moneyLogs] = await Promise.all([
    prisma.dayLog.findUnique({ where: { userId_date: { userId, date: dayOnly } }, include: { meals: true } }),
    prisma.scheduleBlock.findMany({ where: { userId, date: dayOnly }, include: { items: true, category: true } }),
    prisma.moodLog.findMany({ where: { userId, date: dayOnly } }),
    prisma.hobbyLog.findMany({ where: { userId, date: dayOnly } }),
    prisma.media.findMany({ where: { userId, date: dayOnly, isHidden: false } }),
    prisma.timeLog.findMany({ where: { userId, date: dayOnly } }),
    prisma.moneyLog.findMany({ where: { userId, date: dayOnly } }),
  ]);

  const timeline = [
    ...blocks.map((b) => ({ type: "task", time: b.startTime, ...b })),
    ...hobbies.map((h) => ({ type: "hobby", ...h })),
    ...moods.map((m) => ({ type: "mood", ...m })),
    ...(day?.meals || []).map((m) => ({ type: "meal", ...m })),
    ...media.map((m) => ({ type: "media", ...m })),
  ];

  return NextResponse.json({ day, timeline, timeLogs, moneyLogs });
}
