import { NextRequest } from "next/server";
import { adminAuth, adminDb, adminStorage } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

type Params = { params: Promise<{ patternId: string }> };

async function getAuthUid(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(authHeader.slice(7));
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  const { patternId } = await params;
  const uid = await getAuthUid(request);
  if (!uid) return new Response("Unauthorized", { status: 401 });

  const db = adminDb();
  const snap = await db.collection("patterns").doc(patternId).get();

  if (!snap.exists) return new Response("Not found", { status: 404 });

  const data = snap.data()!;
  if (data.uid !== uid && !data.isPublic) {
    return new Response("Forbidden", { status: 403 });
  }

  const pattern = {
    id: snap.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
  };

  return Response.json(pattern);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { patternId } = await params;
  const uid = await getAuthUid(request);
  if (!uid) return new Response("Unauthorized", { status: 401 });

  const db = adminDb();
  const snap = await db.collection("patterns").doc(patternId).get();

  if (!snap.exists) return new Response("Not found", { status: 404 });
  if (snap.data()?.uid !== uid) return new Response("Forbidden", { status: 403 });

  const body = await request.json();
  const allowedFields = ["title", "isPublic", "completedSections"];
  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  await db.collection("patterns").doc(patternId).update(updates);
  return Response.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { patternId } = await params;
  const uid = await getAuthUid(request);
  if (!uid) return new Response("Unauthorized", { status: 401 });

  const db = adminDb();
  const snap = await db.collection("patterns").doc(patternId).get();

  if (!snap.exists) return new Response("Not found", { status: 404 });
  if (snap.data()?.uid !== uid) return new Response("Forbidden", { status: 403 });

  // Delete associated Storage file if present
  const sourceImageUrl = snap.data()?.sourceImageUrl;
  if (sourceImageUrl) {
    try {
      const storagePath = snap.data()?.storagePath;
      if (storagePath) {
        await adminStorage().bucket().file(storagePath).delete();
      }
    } catch {
      // Best-effort deletion — don't fail the request
    }
  }

  await db.collection("patterns").doc(patternId).delete();
  return Response.json({ success: true });
}
