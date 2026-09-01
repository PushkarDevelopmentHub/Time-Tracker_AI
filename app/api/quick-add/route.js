import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { categorizeQuickEntry } from "@/lib/ai";

function toMins(t) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }

// POST { text: "Gym today done 1hr" or "Gym 3pm to 4pm", provider, photoUrl?: string }
export async function POST(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { text, provider = "gemini", photoUrl } = await req.json();
  let parsed;
  try {
    parsed = await categorizeQuickEntry(text, provider);
  } catch (e) {
    return NextResponse.json({ error: e.message || "AI request failed" }, { status: 500 });
  }
  const today = new Date(new Date().toDateString());

  // If a real time range was mentioned, log it as a proper schedule block (with conflict check).
  if (parsed.startTime && parsed.endTime) {
    const existing = await prisma.scheduleBlock.findMany({ where: { userId, date: today } });
    const conflict = existing.find(
      (b) => toMins(parsed.startTime) < toMins(b.endTime) && toMins(parsed.endTime) > toMins(b.startTime)
    );
    if (conflict) {
      return NextResponse.json({
        error: `You already have "${conflict.activity}" at ${conflict.startTime}\u2013${conflict.endTime} \u2014 change the time or edit that entry instead.`,
      }, { status: 409 });
    }
    const block = await prisma.scheduleBlock.create({
      data: { userId, date: today, startTime: parsed.startTime, endTime: parsed.endTime, activity: parsed.title, notes: parsed.details, photoUrl: photoUrl || null },
    });
    return NextResponse.json({ ok: true, category: "schedule", saved: block });
  }

  let saved;
  switch (parsed.category) {
    case "routine":
    case "work":
      saved = await prisma.dayLog.upsert({
        where: { userId_date: { userId, date: today } },
        update: { workDone: true, summary: parsed.details || parsed.title },
        create: { userId, date: today, workDone: true, summary: parsed.details || parsed.title },
      });
      break;
    case "meal": {
      const day = await prisma.dayLog.upsert({ where: { userId_date: { userId, date: today } }, update: {}, create: { userId, date: today } });
      saved = await prisma.meal.create({ data: { dayLogId: day.id, name: parsed.title } });
      break;
    }
    case "time_wasted":
      saved = await prisma.timeLog.create({ data: { userId, date: today, wastedMins: parsed.durationMins || 0, notes: parsed.details } });
      break;
    case "money":
      saved = await prisma.moneyLog.create({ data: { userId, date: today, notes: parsed.details } });
      break;
    case "health":
      saved = await prisma.healthLog.create({ data: { userId, date: today, notes: parsed.details } });
      break;
    case "mood":
      saved = await prisma.moodLog.create({ data: { userId, date: today, mood: parsed.title, notes: parsed.details } });
      break;
    case "hobby":
      saved = await prisma.hobbyLog.create({ data: { userId, date: today, name: parsed.title, notes: parsed.details } });
      break;
    default:
      saved = await prisma.dayLog.upsert({
        where: { userId_date: { userId, date: today } },
        update: { summary: text },
        create: { userId, date: today, summary: text },
      });
  }

  if (photoUrl) {
    await prisma.media.create({ data: { userId, type: "photo", category: "daily", url: photoUrl, date: today, caption: text } });
  }

  return NextResponse.json({ ok: true, category: parsed.category, saved });
}
