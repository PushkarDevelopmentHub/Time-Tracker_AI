import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

// POST { date, reason } -> mark a leave day
export async function POST(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { date, reason } = await req.json();
  const leave = await prisma.leaveDay.upsert({
    where: { userId_date: { userId, date: new Date(new Date(date).toDateString()) } },
    update: { reason },
    create: { userId, date: new Date(new Date(date).toDateString()), reason },
  });
  return NextResponse.json({ leave });
}

// DELETE ?date=YYYY-MM-DD -> unmark a leave day
export async function DELETE(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const date = new Date(new Date(searchParams.get("date")).toDateString());
  await prisma.leaveDay.delete({ where: { userId_date: { userId, date } } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
