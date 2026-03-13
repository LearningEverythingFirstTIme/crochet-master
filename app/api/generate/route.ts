import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getClaudeClient } from "@/lib/claude/client";
import { SYSTEM_PROMPT, buildMessages } from "@/lib/claude/prompts";
import type { GenerateRequest } from "@/lib/types/pattern";
import { FieldValue } from "firebase-admin/firestore";

const RATE_LIMIT_AUTH_PER_DAY = 20;

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
  const today = new Date().toISOString().split("T")[0];
  const sessionRef = db.collection("sessions").doc(`${uid}_${today}`);

  const sessionSnap = await sessionRef.get();
  const generationCount = sessionSnap.exists
    ? (sessionSnap.data()?.generationCount ?? 0)
    : 0;

  const rateLimit = isAnonymous ? 3 : RATE_LIMIT_AUTH_PER_DAY;
  if (generationCount >= rateLimit) {
    return new Response(
      JSON.stringify({
        error: "rate_limit",
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

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        const stream = claude.messages.stream({
          model: "claude-opus-4-5",
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: buildMessages(input),
        });

        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const text = chunk.delta.text;
            accumulatedMarkdown += text;
            controller.enqueue(new TextEncoder().encode(text));
          }
        }

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
