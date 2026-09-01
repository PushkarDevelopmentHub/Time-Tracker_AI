import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { getUploadUrl, getPublicUrl } from "@/lib/storage";

// POST { filename } -> { signedUrl, token, path } for a direct browser upload
export async function POST(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { filename } = await req.json();
  const key = `${userId}/${Date.now()}-${filename}`;
  const upload = await getUploadUrl(key);
  return NextResponse.json(upload);
}

// GET ?hidden=false&category=daily -> list media
export async function GET(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const isHidden = searchParams.get("hidden") === "true";
  const category = searchParams.get("category");

  const media = await prisma.media.findMany({
    where: { userId, isHidden, ...(category ? { category } : {}) },
    orderBy: { date: "desc" },
    take: 100,
  });
  return NextResponse.json({ media });
}

// PUT { path, category, caption, type, isHidden } -> confirm record after browser upload completes
export async function PUT(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { path, category = "daily", caption, type = "photo", isHidden = false } = await req.json();
  const url = getPublicUrl(path);
  const media = await prisma.media.create({
    data: { userId, type, category, url, caption, isHidden, date: new Date(new Date().toDateString()) },
  });
  return NextResponse.json({ media });
}
