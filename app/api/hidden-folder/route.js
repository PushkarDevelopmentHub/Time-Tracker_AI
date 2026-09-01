import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

// POST { action: "set"|"verify", pin }
export async function POST(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { action, pin } = await req.json();

  if (action === "set") {
    const hiddenPinHash = await bcrypt.hash(pin, 10);
    await prisma.user.update({ where: { id: userId }, data: { hiddenPinHash } });
    return NextResponse.json({ ok: true });
  }

  if (action === "verify") {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user.hiddenPinHash) return NextResponse.json({ valid: false, reason: "no pin set" });
    const valid = await bcrypt.compare(pin, user.hiddenPinHash);
    return NextResponse.json({ valid });
  }

  return NextResponse.json({ error: "invalid action" }, { status: 400 });
}
