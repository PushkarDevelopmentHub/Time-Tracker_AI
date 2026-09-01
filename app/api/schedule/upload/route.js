import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

function toMins(t) {
  const m = /^(\d{1,2}):(\d{2})$/.exec((t || "").trim());
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

// POST { csv: "raw file text" } -> validates every row before saving anything
export async function POST(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { csv } = await req.json();
  if (!csv) return NextResponse.json({ error: "No file content received" }, { status: 400 });

  const lines = csv.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  const header = lines[0]?.toLowerCase();
  if (!header || !header.startsWith("date,starttime,endtime,activity")) {
    return NextResponse.json({
      error: "Wrong file format — first row must be: date,startTime,endTime,activity,notes",
    }, { status: 400 });
  }

  const rows = lines.slice(1);
  const errors = [];
  const valid = [];

  rows.forEach((line, i) => {
    const rowNum = i + 2; // account for header, 1-indexed
    const parts = line.split(",");
    const [date, startTime, endTime, activity, notes] = parts;

    if (!date || isNaN(new Date(date).getTime())) {
      errors.push(`Row ${rowNum}: invalid or missing date "${date || ""}"`);
      return;
    }
    const s = toMins(startTime);
    const e = toMins(endTime);
    if (s === null) {
      errors.push(`Row ${rowNum}: invalid startTime "${startTime || ""}" (use HH:MM)`);
      return;
    }
    if (e === null) {
      errors.push(`Row ${rowNum}: invalid endTime "${endTime || ""}" (use HH:MM)`);
      return;
    }
    if (e <= s) {
      errors.push(`Row ${rowNum}: endTime must be after startTime`);
      return;
    }
    if (!activity || !activity.trim()) {
      errors.push(`Row ${rowNum}: activity is required`);
      return;
    }

    valid.push({
      date: new Date(new Date(date).toDateString()),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      activity: activity.trim(),
      notes: notes ? notes.trim() : null,
    });
  });

  // Only save if there are zero errors — avoids partial/confusing imports.
  if (errors.length > 0) {
    return NextResponse.json({ ok: false, errors, savedCount: 0 }, { status: 400 });
  }

  for (const row of valid) {
    await prisma.scheduleBlock.create({ data: { userId, ...row } });
  }

  return NextResponse.json({ ok: true, savedCount: valid.length, errors: [] });
}
