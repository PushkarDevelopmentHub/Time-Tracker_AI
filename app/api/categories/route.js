import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { generateCategories } from "@/lib/ai";

export async function GET(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const categories = await prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } });
  return NextResponse.json({ categories });
}

// POST { name } -> create one category
// POST { bulkText: "1. DSA\n2. System Design\n3. Interview Prep" } -> AI/parses a list into many categories
export async function POST(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();

  if (body.aiGenerate) {
    const names = await generateCategories(body.aiGenerate, body.provider || "gemini");
    const created = [];
    for (const name of names) {
      const cat = await prisma.category.upsert({
        where: { userId_name: { userId, name } },
        update: {},
        create: { userId, name },
      });
      created.push(cat);
    }
    return NextResponse.json({ categories: created });
  }

  if (body.bulkText) {
    // Simple, reliable parse: strip numbering/bullets, one category per line — no AI call needed for this,
    // since it's just structuring text the user already typed as a list.
    const names = body.bulkText
      .split("\n")
      .map((l) => l.replace(/^\s*\d+[\.\)]\s*/, "").replace(/^[-*]\s*/, "").trim())
      .filter(Boolean);

    const created = [];
    for (const name of names) {
      const cat = await prisma.category.upsert({
        where: { userId_name: { userId, name } },
        update: {},
        create: { userId, name },
      });
      created.push(cat);
    }
    return NextResponse.json({ categories: created });
  }

  if (!body.name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  const category = await prisma.category.upsert({
    where: { userId_name: { userId, name: body.name } },
    update: {},
    create: { userId, name: body.name },
  });
  return NextResponse.json({ category });
}

// PATCH { id, name } -> rename a category
export async function PATCH(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id, name } = await req.json();
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat || cat.userId !== userId) return NextResponse.json({ error: "not found" }, { status: 404 });
  const updated = await prisma.category.update({ where: { id }, data: { name } });
  return NextResponse.json({ category: updated });
}

export async function DELETE(req) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat || cat.userId !== userId) return NextResponse.json({ error: "not found" }, { status: 404 });
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
