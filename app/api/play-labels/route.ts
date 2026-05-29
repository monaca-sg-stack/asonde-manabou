import { NextResponse } from "next/server";
import {
  classifyPlayResponse,
  DEFAULT_SIMILARITY_THRESHOLD,
} from "@/lib/classifyPlayResponse";
import type { TagScore } from "@/lib/labels";

type Body = {
  text?: unknown;
  similarityThreshold?: unknown;
};

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured", scores: [] as TagScore[] },
      { status: 501 }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text : "";
  const rawTh = body.similarityThreshold;
  const similarityThreshold =
    typeof rawTh === "number" && Number.isFinite(rawTh) ? rawTh : DEFAULT_SIMILARITY_THRESHOLD;

  try {
    const scores = await classifyPlayResponse(text, {
      apiKey,
      similarityThreshold,
    });
    return NextResponse.json({ scores });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Classification failed";
    return NextResponse.json({ error: message, scores: [] }, { status: 500 });
  }
}
