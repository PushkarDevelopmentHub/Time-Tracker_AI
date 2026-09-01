import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

// Turns "HH:MM" into minutes since midnight
function toMins(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// GET ?date=YYYY-MM-DD -> blocks + auto-calculated totals (worked/wasted/sleep) for the day
export async function GET(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = new Date(searchParams.get("date") || new Date().toDateString());
  const dayOnly = new Date(date.toDateString());

  const [blocks, profile, leave] = await Promise.all([
    prisma.scheduleBlock.findMany({
      where: { userId, date: dayOnly },
      include: { items: true, category: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.leaveDay.findUnique({ where: { userId_date: { userId, date: dayOnly } } }),
  ]);

  // Auto-fill office block if profile has office hours, it's a working day, and no leave taken,
  // and nothing already logged that overlaps it.
  let autoOffice = null;
  if (profile?.officeStartTime && profile?.officeEndTime && !leave) {
    const days = (profile.officeDays || "Mon,Tue,Wed,Thu,Fri").split(",");
    const dayName = dayOnly.toLocaleDateString("en-US", { weekday: "short" });
    const alreadyCovered = blocks.some(
      (b) => toMins(b.startTime) <= toMins(profile.officeStartTime) && toMins(b.endTime) >= toMins(profile.officeEndTime)
    );
    if (days.includes(dayName) && !alreadyCovered) {
      autoOffice = { startTime: profile.officeStartTime, endTime: profile.officeEndTime, activity: "Office (auto)", isOffice: true };
    }
  }

  const allBlocks = autoOffice ? [...blocks, autoOffice] : blocks;

  // Auto-calc: split into office time (separate bucket, not "productive") vs.
  // personal covered time vs. sleep vs. whatever's left over = wasted.
  const officeCovered = new Set();
  const personalCovered = new Set();
  for (const b of allBlocks) {
    const target = b.isOffice ? officeCovered : personalCovered;
    for (let m = toMins(b.startTime); m < toMins(b.endTime); m += 15) target.add(m);
  }
  let sleepMins = 0;
  if (profile?.sleepStartTime && profile?.sleepEndTime) {
    let s = toMins(profile.sleepStartTime);
    let e = toMins(profile.sleepEndTime);
    sleepMins = e >= s ? e - s : 24 * 60 - s + e; // handles overnight sleep
  }
  const officeMins = officeCovered.size * 15;
  const workedMins = personalCovered.size * 15; // personal productive time only, office excluded
  const wastedMins = Math.max(0, 24 * 60 - workedMins - officeMins - sleepMins);

  return NextResponse.json({
    blocks,
    autoOffice,
    onLeave: !!leave,
    totals: { workedMins, officeMins, wastedMins, sleepMins },
  });
}

// POST { startTime, endTime, activity, notes, items: ["..."] }
export async function POST(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { date, startTime, endTime, activity, notes, items = [], categoryId, photoUrl } = await req.json();

  if (!startTime || !endTime || !activity) {
    return NextResponse.json({ error: "startTime, endTime, and activity are required" }, { status: 400 });
  }
  if (toMins(endTime) <= toMins(startTime)) {
    return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
  }

  // Server-side conflict check too, in case the client-side check was bypassed.
  const dayOnly = new Date((date ? new Date(date) : new Date()).toDateString());
  const existing = await prisma.scheduleBlock.findMany({ where: { userId, date: dayOnly } });
  const conflict = existing.find((b) => toMins(startTime) < toMins(b.endTime) && toMins(endTime) > toMins(b.startTime));
  if (conflict) {
    return NextResponse.json({ error: `Overlaps "${conflict.activity}" (${conflict.startTime}\u2013${conflict.endTime}). Change the time or edit that entry.` }, { status: 409 });
  }

  const block = await prisma.scheduleBlock.create({
    data: {
      userId,
      date: dayOnly,
      startTime,
      endTime,
      activity,
      notes,
      categoryId: categoryId || null,
      photoUrl: photoUrl || null,
      items: { create: items.filter(Boolean).map((text) => ({ text })) },
    },
    include: { items: true, category: true },
  });

  return NextResponse.json({ block });
}

// PATCH { itemId, done, photoUrl } -> update a sub-item (check it off / attach photo)
export async function PATCH(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { itemId, done, photoUrl } = await req.json();
  const item = await prisma.scheduleItem.update({
    where: { id: itemId },
    data: { ...(done !== undefined ? { done } : {}), ...(photoUrl ? { photoUrl } : {}) },
  });
  return NextResponse.json({ item });
}

// DELETE ?id=xxx
export async function DELETE(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const block = await prisma.scheduleBlock.findUnique({ where: { id } });
  if (!block || block.userId !== userId) return NextResponse.json({ error: "not found" }, { status: 404 });
  await prisma.scheduleBlock.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
