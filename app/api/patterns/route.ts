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
  let q = db
    .collection("patterns")
    .where("uid", "==", uid)
    .where("isSaved", "==", true)
    .orderBy("createdAt", "desc")
    .limit(pageLimit);

  if (cursor) {
    const cursorDoc = await db.collection("patterns").doc(cursor).get();
    if (cursorDoc.exists) {
      q = q.startAfter(cursorDoc) as typeof q;
    }
  }

  const snap = await q.get();
  const patterns = snap.docs.map((d) => {
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
    snap.docs.length === pageLimit
      ? snap.docs[snap.docs.length - 1].id
      : null;

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

  const { patternId } = await request.json();
  if (!patternId) {
    return new Response("patternId is required", { status: 400 });
  }

  const db = adminDb();
  const patternRef = db.collection("patterns").doc(patternId);
  const snap = await patternRef.get();

  if (!snap.exists) {
    return new Response("Pattern not found", { status: 404 });
  }

  if (snap.data()?.uid !== uid) {
    return new Response("Forbidden", { status: 403 });
  }

  await patternRef.update({
    isSaved: true,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return Response.json({ success: true });
}
