import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { generateRoutine } from "@/lib/ai";

export async function GET(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const routines = await prisma.routine.findMany({ where: { userId } });
  return NextResponse.json({ routines });
}

// POST { planText, durationDays, provider } -> AI builds routine items, saved as Routines
export async function POST(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { planText, durationDays = 7, provider = "gemini" } = await req.json();
  const result = await generateRoutine(planText, durationDays, provider);

  const created = [];
  for (const item of result.items || []) {
    const r = await prisma.routine.create({
      data: {
        userId,
        name: `${item.name}${item.time ? ` (${item.time})` : ""}`,
        frequency: item.frequency || "daily",
      },
    });
    created.push(r);
  }

  return NextResponse.json({ routines: created, raw: result.raw || null });
}

// PATCH { id, done } -> mark today's routine done/not done (creates/updates a RoutineLog)
export async function PATCH(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id, done } = await req.json();
  const today = new Date(new Date().toDateString());

  const existing = await prisma.routineLog.findFirst({ where: { routineId: id, date: today } });
  const log = existing
    ? await prisma.routineLog.update({ where: { id: existing.id }, data: { done } })
    : await prisma.routineLog.create({ data: { routineId: id, date: today, done } });

  if (done) {
    await prisma.routine.update({ where: { id }, data: { streak: { increment: 1 } } });
  }

  return NextResponse.json({ log });
}
