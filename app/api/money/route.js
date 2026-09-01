import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const logs = await prisma.moneyLog.findMany({ where: { userId }, orderBy: { date: "asc" }, take: 90 });

  let cumulativeSaved = 0;
  const withRunningTotal = logs.map((l) => {
    cumulativeSaved += l.saved;
    return { ...l, cumulativeSaved };
  });

  return NextResponse.json({ logs: withRunningTotal });
}

// POST { spent, saved, category, notes }
export async function POST(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { spent, saved, category, notes } = await req.json();
  const date = new Date(new Date().toDateString());

  const log = await prisma.moneyLog.create({
    data: { userId, date, spent: Number(spent) || 0, saved: Number(saved) || 0, category, notes },
  });
  return NextResponse.json({ log });
}
