import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDailySummary } from "@/lib/ai";

// Scheduled for 23:30 daily via vercel.json. Generates and saves today's AI
// summary automatically for every user (currently just you) — this is the
// same engine as the manual "Generate" button on /daily, just run on a timer
// so you don't have to remember to press it.
export async function GET(req) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany();
  const today = new Date(new Date().toDateString());
  const results = [];

  for (const user of users) {
    const [day, blocks, timeLogs] = await Promise.all([
      prisma.dayLog.findUnique({ where: { userId_date: { userId: user.id, date: today } }, include: { meals: true } }),
      prisma.scheduleBlock.findMany({ where: { userId: user.id, date: today }, include: { items: true, category: true } }),
      prisma.timeLog.findMany({ where: { userId: user.id, date: today } }),
    ]);

    try {
      const aiSummary = await generateDailySummary({ day, blocks, timeLogs }, "gemini");
      await prisma.dayLog.upsert({
        where: { userId_date: { userId: user.id, date: today } },
        update: { aiSummary },
        create: { userId: user.id, date: today, aiSummary },
      });
      results.push({ userId: user.id, ok: true });
    } catch (e) {
      results.push({ userId: user.id, ok: false, error: e.message });
    }
  }

  return NextResponse.json({ results });
}
