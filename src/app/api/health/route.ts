// src/app/api/health/route.ts
import { NextResponse } from "next/server";

/**
 * GET /api/health
 * A simple health check endpoint for the Next.js application.
 */
export async function GET(request: Request) {
  try {
    // Optionally add checks for database connection, etc.
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() }, { status: 200 });
  } catch (error: any) {
    console.error("Health check failed:", error);
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  }
}

