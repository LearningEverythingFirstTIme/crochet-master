import { NextRequest } from "next/server";
import { adminAuth, adminStorage } from "@/lib/firebase/admin";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  let uid: string;
  try {
    const token = authHeader.slice(7);
    const decoded = await adminAuth().verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");
  const contentType = searchParams.get("contentType");

  if (!filename || !contentType) {
    return new Response("filename and contentType are required", { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(contentType)) {
    return new Response("Only JPEG, PNG, and WebP images are allowed", { status: 400 });
  }

  const timestamp = Date.now();
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `uploads/${uid}/${timestamp}_${safeFilename}`;

  const storage = adminStorage();
  const bucket = storage.bucket();
  const file = bucket.file(storagePath);

  const [uploadUrl] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    contentType,
    extensionHeaders: {
      "x-goog-content-length-range": `0,${MAX_SIZE_BYTES}`,
    },
  });

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

  return Response.json({ uploadUrl, storagePath, publicUrl });
}
