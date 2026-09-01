import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

// POST { sourceDate: "YYYY-MM-DD", targetDays: 7|30 }
export async function POST(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { sourceDate, targetDays = 7 } = await req.json();

  const source = new Date(new Date(sourceDate).toDateString());
  const sourceBlocks = await prisma.scheduleBlock.findMany({
    where: { userId, date: source },
    include: { items: true },
  });

  if (sourceBlocks.length === 0) {
    return NextResponse.json({ error: "No schedule found on the source date to copy" }, { status: 400 });
  }

  let createdDays = 0;
  for (let i = 1; i <= targetDays; i++) {
    const targetDate = new Date(source);
    targetDate.setDate(source.getDate() + i);

    for (const b of sourceBlocks) {
      await prisma.scheduleBlock.create({
        data: {
          userId,
          date: targetDate,
          startTime: b.startTime,
          endTime: b.endTime,
          activity: b.activity,
          notes: b.notes,
          items: { create: b.items.map((it) => ({ text: it.text })) },
        },
      });
    }
    createdDays++;
  }

  return NextResponse.json({ ok: true, createdDays });
}
