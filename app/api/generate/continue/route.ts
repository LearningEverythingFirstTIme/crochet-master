import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { getClaudeClient } from "@/lib/claude/client";
import { SYSTEM_PROMPT } from "@/lib/claude/prompts";

const MAX_CONTINUE_ATTEMPTS = 3;

export async function POST(request: NextRequest) {
  // 1. Verify auth token
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const token = authHeader.slice(7);
    await adminAuth().verifyIdToken(token);
  } catch (err) {
    console.error("[/api/generate/continue] verifyIdToken failed:", err);
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Parse request
  let partialContent: string;
  let attempt: number;
  try {
    const body = await request.json();
    partialContent = body.partialContent;
    attempt = body.attempt || 1;
    if (!partialContent?.trim()) {
      return new Response("Partial content is required", { status: 400 });
    }
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (attempt > MAX_CONTINUE_ATTEMPTS) {
    return new Response(
      JSON.stringify({ error: "max_attempts", message: "Maximum continuation attempts reached" }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. Stream continuation
  const claude = getClaudeClient();

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        // Send continuation marker first
        controller.enqueue(new TextEncoder().encode("\n\n---CONTINUING---\n\n"));

        const stream = claude.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 8000,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Continue this crochet pattern from where it left off. The pattern so far:\n\n${partialContent}\n\nContinue exactly where this left off. Do not repeat any content already written. Complete the remaining sections and end with **END OF PATTERN**.`,
            },
          ],
        });

        let accumulated = "";
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const text = chunk.delta.text;
            accumulated += text;
            controller.enqueue(new TextEncoder().encode(text));
          }
        }

        controller.close();
        console.log(`[Generate/Continue] Attempt ${attempt}: ${accumulated.length} chars added`);
      } catch (err) {
        console.error("Continue stream error:", err);
        controller.error(err);
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Continue-Attempt": String(attempt),
    },
  });
}
