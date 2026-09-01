import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

// GET ?period=day|week|month|year&date=YYYY-MM-DD&format=json|csv
export async function GET(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "week";
  const format = searchParams.get("format") || "json";
  const anchor = new Date(searchParams.get("date") || new Date());

  let start, end;
  if (period === "day") {
    start = new Date(anchor.toDateString());
    end = start;
  } else if (period === "week") {
    const day = anchor.getDay();
    start = new Date(anchor);
    start.setDate(anchor.getDate() - day);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
  } else if (period === "year") {
    start = new Date(anchor.getFullYear(), 0, 1);
    end = new Date(anchor.getFullYear(), 11, 31);
  } else {
    start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  }

  const blocks = await prisma.scheduleBlock.findMany({
    where: { userId, date: { gte: start, lte: end } },
    include: { items: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  if (format === "csv") {
    const header = "date,startTime,endTime,activity,notes,items\n";
    const rows = blocks.map((b) =>
      [
        b.date.toISOString().slice(0, 10),
        b.startTime,
        b.endTime,
        `"${(b.activity || "").replace(/"/g, '""')}"`,
        `"${(b.notes || "").replace(/"/g, '""')}"`,
        `"${b.items.map((i) => i.text).join("; ").replace(/"/g, '""')}"`,
      ].join(",")
    );
    const csv = header + rows.join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="life-tracker-${period}-${start.toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ blocks, start, end });
}
