import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

const MODELS = {
  day: "dayLog",
  goal: "goal",
  routine: "routine",
  media: "media",
  time: "timeLog",
  money: "moneyLog",
  health: "healthLog",
  mood: "moodLog",
  hobby: "hobbyLog",
  schedule: "scheduleBlock",
  leave: "leaveDay",
};

// DELETE ?type=goal&id=xxx
export async function DELETE(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  const model = MODELS[type];
  if (!model) return NextResponse.json({ error: "unknown type" }, { status: 400 });

  // scope delete to this user's own record only
  const record = await prisma[model].findUnique({ where: { id } });
  if (!record || record.userId !== userId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await prisma[model].delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// GET ?type=goal -> list everything of that type for the admin table
export async function GET(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "day";
  const model = MODELS[type];
  if (!model) return NextResponse.json({ error: "unknown type" }, { status: 400 });

  const records = await prisma[model].findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 200,
  }).catch(() =>
    prisma[model].findMany({ where: { userId }, take: 200 }) // goal has no `date`
  );

  return NextResponse.json({ records });
}
