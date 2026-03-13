import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth state is managed client-side by AuthProvider.
// API routes handle their own token verification via Firebase Admin.
// This proxy file is a placeholder for future server-side route guards.
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/patterns/:path*"],
};
