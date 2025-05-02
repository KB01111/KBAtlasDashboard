// src/app/api/data-integration/connections/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

// --- In-memory store for connections (Replace with database later) ---
interface Connection {
  id: string;
  name: string;
  type: "gmail" | "lunar" | "bokio" | "api" | "file"; // Example types
  credentials: Record<string, any>; // Store encrypted credentials securely
  status: "connected" | "disconnected" | "error";
  createdAt: Date;
}

let connectionsStore: Connection[] = [];
// ---------------------------------------------------------------------

// --- Zod schema for validation ---
const connectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["gmail", "lunar", "bokio", "api", "file"], { message: "Invalid connection type" }),
  credentials: z.record(z.any()).describe("Credentials object (e.g., API key, tokens). Will be encrypted."),
  // status will be set internally
});
// ---------------------------------

/**
 * GET /api/data-integration/connections
 * Retrieves a list of all data source connections.
 */
export async function GET(request: Request) {
  try {
    // In a real app, fetch from database
    // For now, return the in-memory store (omitting sensitive credentials)
    const connectionsList = connectionsStore.map(({ credentials, ...rest }) => rest);
    return NextResponse.json(connectionsList);
  } catch (error) {
    console.error("Error fetching connections:", error);
    return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 });
  }
}

/**
 * POST /api/data-integration/connections
 * Creates a new data source connection.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = connectionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.errors }, { status: 400 });
    }

    const { name, type, credentials } = validation.data;

    // --- TODO: Secure Credential Handling ---
    // 1. Encrypt credentials before storing
    // 2. Store in a secure database, not in-memory
    const encryptedCredentials = { ...credentials }; // Placeholder
    // ----------------------------------------

    const newConnection: Connection = {
      id: crypto.randomUUID(), // Generate a unique ID
      name,
      type,
      credentials: encryptedCredentials, // Store encrypted credentials
      status: "disconnected", // Initial status
      createdAt: new Date(),
    };

    connectionsStore.push(newConnection);
    console.log("Added new connection:", newConnection.id);

    // Return the newly created connection (excluding credentials)
    const { credentials: _, ...connectionToReturn } = newConnection;
    return NextResponse.json(connectionToReturn, { status: 201 });

  } catch (error) {
    console.error("Error creating connection:", error);
    return NextResponse.json({ error: "Failed to create connection" }, { status: 500 });
  }
}

