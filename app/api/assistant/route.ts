import { NextResponse } from "next/server";
import { askAssistant, type ChatMessage } from "@/lib/mistral";

const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 1000;

function isValidHistory(value: unknown): value is ChatMessage[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= MAX_MESSAGES &&
    value.every(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.length > 0 &&
        m.content.length <= MAX_MESSAGE_LENGTH
    )
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const messages = body?.messages;

  if (!isValidHistory(messages)) {
    return NextResponse.json({ error: "Invalid message history." }, { status: 400 });
  }

  try {
    const reply = await askAssistant(messages);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[assistant] error:", err);
    return NextResponse.json(
      { error: "The assistant is unavailable right now. Please try again shortly." },
      { status: 502 }
    );
  }
}
