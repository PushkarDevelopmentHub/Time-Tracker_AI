import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { generateFreeHourIdea } from "@/lib/ai";

export async function POST(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { provider = "gemini" } = await req.json();

  const since = new Date();
  since.setDate(since.getDate() - 7);
  const recentBlocks = await prisma.scheduleBlock.findMany({
    where: { userId, date: { gte: since } },
    include: { category: true },
    orderBy: { date: "desc" },
    take: 30,
  });

  try {
    const idea = await generateFreeHourIdea(
      recentBlocks.map((b) => ({ activity: b.activity, category: b.category?.name })),
      provider
    );
    return NextResponse.json({ idea });
  } catch (e) {
    return NextResponse.json({ error: e.message || "AI request failed" }, { status: 500 });
  }
}
