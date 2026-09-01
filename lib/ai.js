import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

let anthropic = null;
function getAnthropic() {
  if (!anthropic) anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return anthropic;
}
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// provider: "gemini" (default, free) | "claude" (optional, costs money)
async function callAI(provider, prompt, maxTokens = 500) {
  if (provider === "claude") {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("Claude isn't set up — add ANTHROPIC_API_KEY to .env, or switch back to Gemini.");
    }
    const msg = await getAnthropic().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    });
    return msg.content.map((c) => (c.type === "text" ? c.text : "")).join("\n");
  }
  const model = gemini.getGenerativeModel({ model: "gemini-3.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateDailySummary(dayData, provider = "gemini") {
  const prompt = `Here is one day of my personal tracking data:\n${JSON.stringify(dayData)}\n\nWrite a short (4-6 sentence) honest, encouraging-but-direct summary of the day, and one concrete suggestion for tomorrow.`;
  return callAI(provider, prompt, 400);
}

export async function generateMonthlySummary(monthData, provider = "gemini") {
  const prompt = `Here is a month of my personal tracking data (goals, time, money, health, work):\n${JSON.stringify(monthData)}\n\nWrite a monthly review: what improved, what didn't, and 3 specific things to improve next month. Keep it direct and practical.`;
  return callAI(provider, prompt, 800);
}

// Suggests something to do with a free hour — sharp, engaging, sometimes just for fun,
// grounded in what the user's actually been doing (study/work), not generic advice.
export async function generateFreeHourIdea(context, provider = "gemini") {
  const prompt = `The user has about 1 free hour right now. Here's what they've been working on / studying recently: ${JSON.stringify(context)}.
Suggest ONE specific, engaging thing to do with this hour that keeps their mind sharp \u2014 it can relate to their studies/work, or be a fun mental challenge/hobby unrelated to work. Be specific and concrete (not "read a book" but a specific short activity). 2-3 sentences, casual tone.`;
  return callAI(provider, prompt, 250);
}

export async function generatePeriodSummary(periodLabel, data, provider = "gemini") {
  const prompt = `Here is my personal tracking data for ${periodLabel}:\n${JSON.stringify(
    data
  )}\n\nWrite: 1) a clear summary of what happened, 2) specific patterns you notice (good and bad), 3) a short "Key areas to improve" list (max 5 bullet points, concrete and specific, not generic advice).`;
  return callAI(provider, prompt, 900);
}

// Builds a day/week/month routine from a free-text description of the user's plan.
export async function generateRoutine(planText, durationDays, provider = "gemini") {
  const prompt = `The user wants a personal routine built from this plan, in their own words:\n"${planText}"\n\nBuild it to run for ${durationDays} day(s). Respond with ONLY valid JSON, no markdown, in this shape:
{"items": [{"name": "...", "frequency": "daily|weekly", "time": "e.g. 6:00-7:00 AM", "notes": "..."}]}`;
  const raw = await callAI(provider, prompt, 900);
  const clean = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    return { items: [], raw };
  }
}
// Turns freeform text into a clean list of category names, via AI.
export async function generateCategories(text, provider = "gemini") {
  const prompt = `The user wants to create tracking categories from this text: "${text}"
Respond with ONLY valid JSON, no markdown: {"categories": ["Name1", "Name2", ...]}`;
  const raw = await callAI(provider, prompt, 200);
  const clean = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean).categories || [];
  } catch {
    return [];
  }
}
export async function categorizeQuickEntry(text, provider = "gemini") {
  const prompt = `Classify this personal log entry into exactly one category from: routine, work, goal, meal, time_wasted, money, health, mood, hobby, note.
Also extract a time range if one is mentioned (e.g. "3pm to 4pm", "9-10am") in 24-hour HH:MM format; use null if none is mentioned.
Entry: "${text}"
Respond with ONLY valid JSON, no markdown, no explanation, in this shape:
{"category": "...", "title": "...", "details": "...", "durationMins": null, "startTime": null, "endTime": null}`;
  const raw = await callAI(provider, prompt, 200);
  const clean = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    return { category: "note", title: text, details: "", durationMins: null };
  }
}
