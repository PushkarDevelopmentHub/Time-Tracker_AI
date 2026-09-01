import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const year = new Date().getFullYear();
  const goals = await prisma.goal.findMany({ where: { userId, year }, orderBy: { progress: "desc" } });
  return NextResponse.json({ goals });
}

// POST { title, category, targetDate }
export async function POST(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { title, category, targetDate } = await req.json();
  const year = new Date().getFullYear();

  const goal = await prisma.goal.create({
    data: { userId, title, category, year, targetDate: targetDate ? new Date(targetDate) : null },
  });
  return NextResponse.json({ goal });
}

// PATCH { id, progress, completed }
export async function PATCH(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id, progress, completed } = await req.json();
  const goal = await prisma.goal.update({
    where: { id },
    data: { progress, completed: completed ?? progress >= 100 },
  });
  return NextResponse.json({ goal });
}
