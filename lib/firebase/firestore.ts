import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
  type QueryConstraint,
} from "firebase/firestore";
import { getFirebaseDb } from "./client";
import type { Pattern, PatternSummary } from "../types/pattern";

function patternFromDoc(
  docSnap: DocumentSnapshot | QueryDocumentSnapshot
): Pattern {
  const data = docSnap.data()!;
  return { id: docSnap.id, ...data } as Pattern;
}

export async function getPattern(patternId: string): Promise<Pattern | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, "patterns", patternId));
  if (!snap.exists()) return null;
  return patternFromDoc(snap);
}

export async function getUserPatterns(
  uid: string,
  pageLimit = 20,
  cursor?: DocumentSnapshot
): Promise<{ patterns: PatternSummary[]; nextCursor: DocumentSnapshot | null }> {
  const db = getFirebaseDb();
  const constraints: QueryConstraint[] = [
    where("uid", "==", uid),
    where("isSaved", "==", true),
    orderBy("createdAt", "desc"),
    limit(pageLimit),
  ];

  if (cursor) {
    constraints.push(startAfter(cursor));
  }

  const q = query(collection(db, "patterns"), ...constraints);
  const snap = await getDocs(q);

  const patterns: PatternSummary[] = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      uid: data.uid,
      title: data.title,
      description: data.description,
      sourceType: data.sourceType,
      sourceImageUrl: data.sourceImageUrl ?? null,
      status: data.status,
      createdAt: data.createdAt,
      isSaved: data.isSaved,
      difficultyLevel: data.pattern?.difficultyLevel ?? null,
      estimatedTime: data.pattern?.estimatedTime ?? null,
    };
  });

  const nextCursor =
    snap.docs.length === pageLimit ? snap.docs[snap.docs.length - 1] : null;

  return { patterns, nextCursor };
}

export async function updatePattern(
  patternId: string,
  data: Partial<Pattern>
): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, "patterns", patternId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePattern(patternId: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, "patterns", patternId));
}
