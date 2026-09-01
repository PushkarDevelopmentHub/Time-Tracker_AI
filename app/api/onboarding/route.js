import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  return NextResponse.json({ profile });
}

// POST — first-time onboarding or later edits from Settings.
// { heightCm, weightKg, currentSalary, officeStartTime, officeEndTime, officeDays, sleepStartTime, sleepEndTime }
export async function POST(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();

  const existing = await prisma.userProfile.findUnique({ where: { userId } });

  // Salary changes get logged to history so past months keep the number that was true then.
  if (body.currentSalary && body.currentSalary !== existing?.currentSalary) {
    await prisma.salaryHistory.create({
      data: { userId, amount: body.currentSalary, effectiveFrom: new Date(new Date().toDateString()) },
    });
  }

  const profile = await prisma.userProfile.upsert({
    where: { userId },
    update: { ...body, onboarded: true },
    create: { userId, ...body, onboarded: true },
  });

  return NextResponse.json({ profile });
}
