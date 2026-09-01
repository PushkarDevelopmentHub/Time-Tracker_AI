import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

// GET -> a small feed of things the app wants to tell you right now
export async function GET(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const notifications = [];

  // missed-day check (last 3 days)
  for (let i = 1; i <= 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayOnly = new Date(d.toDateString());
    const count = await prisma.scheduleBlock.count({ where: { userId, date: dayOnly } });
    if (count === 0) {
      notifications.push({
        id: `missed-${dayOnly.toISOString().slice(0, 10)}`,
        type: "missed",
        message: `You didn't log anything on ${dayOnly.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}.`,
        actionHref: `/schedule?date=${dayOnly.toISOString().slice(0, 10)}`,
        actionLabel: "Fill it in",
      });
    }
  }

  // active goals with no recent progress update (simple heuristic: progress still 0)
  const staleGoals = await prisma.goal.findMany({ where: { userId, progress: 0, completed: false }, take: 3 });
  for (const g of staleGoals) {
    notifications.push({
      id: `goal-${g.id}`,
      type: "suggestion",
      message: `"${g.title}" hasn't been started yet — want to log some progress?`,
      actionHref: "/goals",
      actionLabel: "Open goals",
    });
  }

  return NextResponse.json({ notifications: notifications.slice(0, 5) });
}
