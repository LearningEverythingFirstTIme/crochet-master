import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(authHeader.slice(7));
    uid = decoded.uid;
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pageLimit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const cursor = searchParams.get("cursor");

  const db = adminDb();
  // Query only by uid — single-field index, auto-created by Firestore.
  // Sort and filter in memory to avoid composite index requirements.
  const baseQuery = db.collection("patterns").where("uid", "==", uid);

  let snap: FirebaseFirestore.QuerySnapshot;
  try {
    snap = await baseQuery.get();
  } catch (err) {
    console.error("[/api/patterns] Firestore query failed:", err);
    return new Response("Internal Server Error", { status: 500 });
  }

  const saved = snap.docs
    .filter((d) => d.data().isSaved === true)
    .sort((a, b) => {
      const aMs = a.data().createdAt?.toMillis?.() ?? 0;
      const bMs = b.data().createdAt?.toMillis?.() ?? 0;
      return bMs - aMs; // newest first
    });

  const pageDocs = saved.slice(0, pageLimit);

  const patterns = pageDocs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      uid: data.uid,
      title: data.title,
      description: data.description,
      sourceType: data.sourceType,
      sourceImageUrl: data.sourceImageUrl ?? null,
      status: data.status,
      createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      isSaved: data.isSaved,
      difficultyLevel: data.pattern?.difficultyLevel ?? null,
      estimatedTime: data.pattern?.estimatedTime ?? null,
    };
  });

  const nextCursor =
    saved.length > pageLimit ? pageDocs[pageDocs.length - 1].id : null;

  return Response.json({ patterns, nextCursor });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(authHeader.slice(7));
    uid = decoded.uid;
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const { title, description, rawMarkdown, sourceType, sourceImageUrl } = body;

  if (!rawMarkdown || typeof rawMarkdown !== "string") {
    return new Response(
      JSON.stringify({ message: "Pattern content (rawMarkdown) is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Extract title from markdown if not provided
  const derivedTitle =
    title?.trim() || extractTitleFromMarkdown(rawMarkdown) || "Untitled Pattern";
  const derivedDescription =
    description?.trim() ||
    extractDescriptionFromMarkdown(rawMarkdown) ||
    "";

  const db = adminDb();
  const docRef = db.collection("patterns").doc();
  await docRef.set({
    uid,
    title: derivedTitle,
    description: derivedDescription,
    pattern: { rawMarkdown },
    sourceType: sourceType || "text",
    sourceImageUrl: sourceImageUrl || null,
    status: "complete",
    isSaved: true,
    isPublic: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const doc = await docRef.get();
  const data = doc.data()!;

  return Response.json({
    id: doc.id,
    uid: data.uid,
    title: data.title,
    description: data.description,
    sourceType: data.sourceType,
    sourceImageUrl: data.sourceImageUrl,
    status: data.status,
    isSaved: data.isSaved,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
  });
}

// Helper functions
function extractTitleFromMarkdown(markdown: string): string | null {
  const lines = markdown.split("\n");
  for (const line of lines) {
    const match = line.match(/^#\s+(.+)$/);
    if (match) return match[1].trim();
  }
  return null;
}

function extractDescriptionFromMarkdown(markdown: string): string | null {
  const lines = markdown.split("\n").slice(0, 10);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (trimmed.length > 10 && trimmed.length < 200) {
      return trimmed;
    }
  }
  return null;
}
