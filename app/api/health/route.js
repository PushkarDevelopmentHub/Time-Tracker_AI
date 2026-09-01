import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [health, moods] = await Promise.all([
    prisma.healthLog.findMany({ where: { userId }, orderBy: { date: "asc" }, take: 90 }),
    prisma.moodLog.findMany({ where: { userId }, orderBy: { date: "asc" }, take: 90 }),
  ]);
  return NextResponse.json({ health, moods });
}

// POST { heightCm, weightKg, notes, mood }
export async function POST(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { heightCm, weightKg, notes, mood } = await req.json();
  const date = new Date(new Date().toDateString());

  let bmi = null;
  if (heightCm && weightKg) {
    const m = heightCm / 100;
    bmi = Math.round((weightKg / (m * m)) * 10) / 10;
  }

  const health = await prisma.healthLog.create({
    data: { userId, date, heightCm, weightKg, bmi, notes },
  });

  if (mood) {
    await prisma.moodLog.create({ data: { userId, date, mood } });
  }

  return NextResponse.json({ health });
}
