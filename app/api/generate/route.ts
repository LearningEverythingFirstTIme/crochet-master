import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getClaudeClient } from "@/lib/claude/client";
import { SYSTEM_PROMPT, buildMessages } from "@/lib/claude/prompts";
import type { GenerateRequest } from "@/lib/types/pattern";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const RATE_LIMIT_AUTH_PER_DAY = 20;
const COOLDOWN_SECONDS = 60; // 1 request per minute, per user

export async function POST(request: NextRequest) {
  // 1. Verify auth token
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  let uid: string;
  let isAnonymous: boolean;

  try {
    const token = authHeader.slice(7);
    const decoded = await adminAuth().verifyIdToken(token);
    uid = decoded.uid;
    isAnonymous = decoded.firebase?.sign_in_provider === "anonymous";
  } catch (err) {
    console.error("[/api/generate] verifyIdToken failed:", err);
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Parse and validate input
  let input: GenerateRequest;
  try {
    input = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!input.description?.trim() && !input.image) {
    return new Response(
      "Either a description or an image is required",
      { status: 400 }
    );
  }

  // 3. Rate limiting
  const db = adminDb();

  // ── 3a. Per-minute throttle (applies to everyone, including anonymous) ──
  // Uses a Firestore transaction to atomically read + update the last request
  // timestamp, preventing bursts even if two requests arrive simultaneously.
  const throttleRef = db.collection("rate_limits").doc(uid);

  const throttleResult = await db.runTransaction(async (txn) => {
    const doc = await txn.get(throttleRef);
    const now = Date.now();
    const lastMs: number =
      doc.exists && doc.data()?.lastRequestAt instanceof Timestamp
        ? (doc.data()!.lastRequestAt as Timestamp).toMillis()
        : 0;

    const elapsedSeconds = (now - lastMs) / 1000;

    if (elapsedSeconds < COOLDOWN_SECONDS) {
      return { allowed: false, retryAfter: Math.ceil(COOLDOWN_SECONDS - elapsedSeconds) };
    }

    txn.set(throttleRef, { lastRequestAt: Timestamp.fromMillis(now), uid }, { merge: true });
    return { allowed: true, retryAfter: 0 };
  });

  if (!throttleResult.allowed) {
    return new Response(
      JSON.stringify({
        error: "rate_limit_cooldown",
        message: `Please wait ${throttleResult.retryAfter} second${throttleResult.retryAfter === 1 ? "" : "s"} before generating another pattern.`,
        retryAfter: throttleResult.retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(throttleResult.retryAfter),
        },
      }
    );
  }

  // ── 3b. Daily quota ──
  const today = new Date().toISOString().split("T")[0];
  const sessionRef = db.collection("sessions").doc(`${uid}_${today}`);

  const sessionSnap = await sessionRef.get();
  const generationCount = sessionSnap.exists
    ? (sessionSnap.data()?.generationCount ?? 0)
    : 0;

  const dailyLimit = isAnonymous ? 3 : RATE_LIMIT_AUTH_PER_DAY;
  if (generationCount >= dailyLimit) {
    return new Response(
      JSON.stringify({
        error: "rate_limit_daily",
        message: isAnonymous
          ? "Free limit reached. Sign in to generate more patterns."
          : "Daily limit reached. Try again tomorrow.",
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. Create a Firestore draft document
  const patternRef = input.patternId
    ? db.collection("patterns").doc(input.patternId)
    : db.collection("patterns").doc();

  const patternId = patternRef.id;
  const title = deriveTitle(input);

  await patternRef.set(
    {
      uid,
      title,
      description: input.description ?? "",
      sourceType: input.image ? "image" : "text",
      sourceImageUrl: null,
      status: "generating",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      isSaved: false,
      isPublic: false,
      pattern: null,
    },
    { merge: true }
  );

  // 5. Increment session counter (don't await — fire and forget)
  sessionRef.set(
    {
      uid,
      generationCount: FieldValue.increment(1),
      lastGeneratedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // 6. Stream Claude response
  const claude = getClaudeClient();
  let accumulatedMarkdown = "";
  let chunkCount = 0;

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        const stream = claude.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8000,
          system: SYSTEM_PROMPT,
          messages: buildMessages(input),
        });

        for await (const chunk of stream) {
          chunkCount++;
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const text = chunk.delta.text;
            accumulatedMarkdown += text;
            controller.enqueue(new TextEncoder().encode(text));
          }
        }

        // Small delay to ensure all chunks are processed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log(`[Generate] Stream complete: ${chunkCount} chunks, ${accumulatedMarkdown.length} chars`);
        controller.close();

        // 7. Update Firestore with completed pattern (background, don't block stream)
        patternRef
          .update({
            status: "complete",
            "pattern.rawMarkdown": accumulatedMarkdown,
            title: extractTitle(accumulatedMarkdown) ?? title,
            updatedAt: FieldValue.serverTimestamp(),
          })
          .catch(console.error);
      } catch (err) {
        console.error("Stream error:", err);
        controller.error(err);
        patternRef
          .update({ status: "error", updatedAt: FieldValue.serverTimestamp() })
          .catch(console.error);
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Pattern-Id": patternId,
    },
  });
}

function deriveTitle(input: GenerateRequest): string {
  if (input.description?.trim()) {
    const words = input.description.trim().split(/\s+/).slice(0, 6);
    return words.join(" ") + (input.description.trim().split(/\s+/).length > 6 ? "..." : "");
  }
  return "Crochet Pattern";
}

function extractTitle(markdown: string): string | null {
  const match = markdown.match(/\*\*Title\*\*:\s*(.+)/);
  return match ? match[1].trim() : null;
}
