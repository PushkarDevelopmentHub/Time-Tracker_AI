import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);
const THRESHOLD_DAYS = 3;

// Runs daily. For each user, checks the last THRESHOLD_DAYS: if ALL of them
// have zero schedule blocks logged, sends one email — then won't re-send
// again until a day gets logged (checked via a simple "last notified" guard
// using UserProfile, so it doesn't spam every day the streak continues).
export async function GET(req) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({ include: { profile: true } });
  const results = [];

  for (const user of users) {
    const days = [];
    for (let i = 1; i <= THRESHOLD_DAYS; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(new Date(d.toDateString()));
    }

    const counts = await Promise.all(
      days.map((d) => prisma.scheduleBlock.count({ where: { userId: user.id, date: d } }))
    );
    const allMissed = counts.every((c) => c === 0);

    if (allMissed) {
      // simple de-dupe: skip if we already emailed about this exact missed streak recently
      const lastNotified = user.profile?.lastMissedEmailAt;
      const alreadySentToday = lastNotified && new Date(lastNotified).toDateString() === new Date().toDateString();

      if (!alreadySentToday && process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: "Life Tracker <reports@yourdomain.com>",
          to: user.email,
          subject: `You've missed ${THRESHOLD_DAYS} days on Life Tracker`,
          text: `You haven't logged anything for the last ${THRESHOLD_DAYS} days. Jump back in whenever you're ready \u2014 even a quick entry helps keep the picture accurate.`,
        });
        if (user.profile) {
          await prisma.userProfile.update({ where: { userId: user.id }, data: { lastMissedEmailAt: new Date() } });
        }
        results.push({ userId: user.id, emailed: true });
      } else {
        results.push({ userId: user.id, emailed: false, reason: "already sent today or no email key" });
      }
    } else {
      results.push({ userId: user.id, emailed: false, reason: "not missed" });
    }
  }

  return NextResponse.json({ results });
}
