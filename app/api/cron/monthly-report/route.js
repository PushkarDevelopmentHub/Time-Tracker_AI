import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { generateMonthlySummary } from "@/lib/ai";

const resend = new Resend(process.env.RESEND_API_KEY);

// Configure Vercel Cron (vercel.json) to hit this on the 1st of each month.
export async function GET(req) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);

  for (const user of users) {
    const [days, goals, timeLogs, moneyLogs] = await Promise.all([
      prisma.dayLog.findMany({ where: { userId: user.id, date: { gte: start, lte: end } } }),
      prisma.goal.findMany({ where: { userId: user.id } }),
      prisma.timeLog.findMany({ where: { userId: user.id, date: { gte: start, lte: end } } }),
      prisma.moneyLog.findMany({ where: { userId: user.id, date: { gte: start, lte: end } } }),
    ]);

    const summary = await generateMonthlySummary({ days, goals, timeLogs, moneyLogs });

    await resend.emails.send({
      from: "Life Tracker <reports@yourdomain.com>",
      to: user.email,
      subject: `Your ${start.toLocaleString("default", { month: "long" })} summary`,
      text: summary,
    });
  }

  return NextResponse.json({ ok: true, sent: users.length });
}
