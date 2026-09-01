import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();

  const day = await prisma.dayLog.upsert({
    where: { userId_date: { userId, date: new Date(body.date) } },
    update: {
      workDone: body.workDone,
      summary: body.notes,
    },
    create: {
      userId,
      date: new Date(body.date),
      workDone: body.workDone,
      summary: body.notes,
      meals: {
        create: (body.meals || [])
          .filter((m) => m.name)
          .map((m) => ({ name: m.name })),
      },
    },
  });

  if (body.wastedMins) {
    await prisma.timeLog.create({
      data: { userId, date: new Date(body.date), wastedMins: body.wastedMins },
    });
  }

  return NextResponse.json({ ok: true, day });
}
