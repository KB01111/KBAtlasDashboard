// src/app/api/data-integration/connections/[id]/route.ts
import { NextResponse } from "next/server";

// --- In-memory store (Should match the one in the parent route) ---
// In a real app, this would interact with a database.
interface Connection {
  id: string;
  name: string;
  type: "gmail" | "lunar" | "bokio" | "api" | "file";
  credentials: Record<string, any>; 
  status: "connected" | "disconnected" | "error";
  createdAt: Date;
}

// This needs to be shared or replaced by a DB call.
// For now, assume it's accessible (this is a simplification).
let connectionsStore: Connection[] = []; 
// ---------------------------------------------------------------------

/**
 * GET /api/data-integration/connections/[id]
 * Retrieves a specific data source connection by ID.
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const connection = connectionsStore.find(conn => conn.id === id);

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    // Return connection details (excluding credentials for security)
    const { credentials, ...connectionToReturn } = connection;
    return NextResponse.json(connectionToReturn);

  } catch (error) {
    console.error(`Error fetching connection ${params.id}:`, error);
    return NextResponse.json({ error: "Failed to fetch connection" }, { status: 500 });
  }
}

/**
 * DELETE /api/data-integration/connections/[id]
 * Deletes a specific data source connection by ID.
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const initialLength = connectionsStore.length;
    connectionsStore = connectionsStore.filter(conn => conn.id !== id);

    if (connectionsStore.length === initialLength) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    console.log("Deleted connection:", id);
    return NextResponse.json({ message: "Connection deleted successfully" }, { status: 200 });

  } catch (error) {
    console.error(`Error deleting connection ${params.id}:`, error);
    return NextResponse.json({ error: "Failed to delete connection" }, { status: 500 });
  }
}

/**
 * PUT /api/data-integration/connections/[id]
 * Updates a specific data source connection by ID.
 * (Basic implementation - can be expanded based on needs)
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const connectionIndex = connectionsStore.findIndex(conn => conn.id === id);

    if (connectionIndex === -1) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    const body = await request.json();
    
    // --- TODO: Add validation for update payload (e.g., using Zod) ---
    // For now, just update name and potentially credentials
    const { name, credentials } = body;

    if (name) {
      connectionsStore[connectionIndex].name = name;
    }
    if (credentials) {
      // --- TODO: Secure Credential Handling for Update ---
      // 1. Encrypt new credentials before storing
      connectionsStore[connectionIndex].credentials = { ...credentials }; // Placeholder
      // ---------------------------------------------------
    }
    
    // Optionally update status or other fields based on payload

    console.log("Updated connection:", id);
    const { credentials: _, ...updatedConnection } = connectionsStore[connectionIndex];
    return NextResponse.json(updatedConnection);

  } catch (error) {
    console.error(`Error updating connection ${params.id}:`, error);
    return NextResponse.json({ error: "Failed to update connection" }, { status: 500 });
  }
}

