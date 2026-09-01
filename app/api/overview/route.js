import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const today = new Date(new Date().toDateString());
  const year = new Date().getFullYear();

  const [day, goals, timeLog, routines, hobbies] = await Promise.all([
    prisma.dayLog.findUnique({ where: { userId_date: { userId, date: today } }, include: { meals: true } }),
    prisma.goal.findMany({ where: { userId, year, completed: false }, orderBy: { progress: "desc" }, take: 5 }),
    prisma.timeLog.findMany({ where: { userId, date: today } }),
    prisma.routine.findMany({ where: { userId } }),
    prisma.hobbyLog.findMany({ where: { userId, date: today } }),
  ]);

  const wastedMins = timeLog.reduce((s, t) => s + t.wastedMins, 0);
  const productiveMins = timeLog.reduce((s, t) => s + t.productiveMins, 0);

  return NextResponse.json({
    day,
    goals,
    wastedMins,
    productiveMins,
    routines,
    hobbies,
    goalCount: await prisma.goal.count({ where: { userId, year } }),
  });
}
