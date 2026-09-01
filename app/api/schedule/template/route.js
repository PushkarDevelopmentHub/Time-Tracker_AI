import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";

// GET ?date=YYYY-MM-DD -> CSV file download
export async function GET(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  const header = "date,startTime,endTime,activity,notes\n";
  const example = `${date},09:00,09:15,Example: Deep work,Optional notes\n`;
  const csv = header + example;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="schedule-template-${date}.csv"`,
    },
  });
}
