// src/app/api/data-integration/fetch/[id]/route.ts
import { NextResponse } from "next/server";
import { addDocumentsToRAG } from "@/lib/ragService"; // Import RAG service function
import { saveToTempFile, cleanupTempFile } from "@/utils/tempFileUtils"; // Import temp file utils
import { PrismaClient } from "@prisma/client";
import CryptoJS from "crypto-js";

const prisma = new PrismaClient();

// --- Decryption function ---
function decryptCredentials(encryptedCredentials: string): Record<string, any> {
  const encryptionKey = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error("CREDENTIAL_ENCRYPTION_KEY is not set in environment variables.");
  }
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedCredentials, encryptionKey);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return decryptedData;
  } catch (error) {
    console.error("Failed to decrypt credentials:", error);
    throw new Error("Failed to decrypt credentials.");
  }
}
// -------------------------

// URL for the unstructured processing service
const UNSTRUCTURED_SERVICE_URL = process.env.UNSTRUCTURED_SERVICE_URL || "http://localhost:5001/process";

/**
 * POST /api/data-integration/fetch/[id]
 * Triggers the data fetching, processing, and ingestion pipeline for a specific connection.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const connectionId = params.id;
  console.log(`Received fetch request for connection ID: ${connectionId}`);
  let tempFilePath: string | null = null; // Path to the temporary file holding fetched data
  let isInputFilePath = false; // Flag to indicate if the path is input or created

  try {
    // 1. Find Connection Details from Database
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      console.error(`Connection not found: ${connectionId}`);
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    // Decrypt credentials
    const credentials = decryptCredentials(connection.encryptedCredentials);

    console.log(`Starting fetch for connection: ${connection.name} (Type: ${connection.type})`);

    // 2. Fetch Data (Specific logic per type)
    let fetchedData: any = null; // This will hold raw data (e.g., API response)

    try {
      switch (connection.type) {
        case "gmail":
          console.log("Fetching Gmail data... (Requires OAuth token handling)");
          // TODO: Implement actual Gmail API call using stored OAuth tokens
          // This requires retrieving the user's session/token associated with this connection
          // For now, using placeholder
          fetchedData = [
            { id: "gmail1", subject: "Meeting Reminder", body: "Don't forget the meeting at 3 PM.", from: "colleague@example.com", date: new Date().toISOString() },
            { id: "gmail2", subject: "Project Update", body: "The project is on track. See attached report.", from: "manager@example.com", date: new Date().toISOString() }
          ];
          break;

        case "lunar":
          console.log("Fetching Lunar Bank data...");
          if (!credentials?.apiKey) throw new Error("Lunar API Key missing in decrypted credentials");
          // Actual Lunar API call (Example: fetch accounts)
          // Note: Endpoint and exact auth might differ. Refer to Lunar docs.
          const lunarApiUrl = "https://api.lunar.app/v1/accounts"; // Example endpoint
          const lunarResponse = await fetch(lunarApiUrl, { 
            headers: { 
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Accept': 'application/json'
            }
          });
          if (!lunarResponse.ok) {
            const errorBody = await lunarResponse.text();
            throw new Error(`Lunar API error: ${lunarResponse.status} ${lunarResponse.statusText} - ${errorBody}`);
          }
          fetchedData = await lunarResponse.json();
          console.log("Successfully fetched Lunar data.");
          break;

        case "bokio":
          console.log("Fetching Bokio data...");
          if (!credentials?.apiKey) throw new Error("Bokio API Key missing in decrypted credentials");
          // Actual Bokio API call (Example: fetch invoices - requires companyId)
          // Assuming companyId might be stored in credentials or needs another mechanism
          const companyId = credentials.companyId || process.env.BOKIO_DEFAULT_COMPANY_ID; // Example: Get companyId
          if (!companyId) throw new Error("Bokio Company ID missing");
          
          const bokioApiUrl = `https://api.bokio.se/companies/${companyId}/invoices`; // Example endpoint
          const bokioResponse = await fetch(bokioApiUrl, { 
            headers: { 
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Accept': 'application/json'
            }
          });
          if (!bokioResponse.ok) {
            const errorBody = await bokioResponse.text();
            throw new Error(`Bokio API error: ${bokioResponse.status} ${bokioResponse.statusText} - ${errorBody}`);
          }
          fetchedData = await bokioResponse.json();
          console.log("Successfully fetched Bokio data.");
          break;

        case "api":
          console.log("Fetching Generic API data...");
          if (!credentials?.baseUrl) throw new Error("API Base URL missing in decrypted credentials");
          const headers: Record<string, string> = { 'Accept': 'application/json' };
          if (credentials.apiKey) {
            // Determine auth type (Bearer, Basic, custom header) - assume Bearer for now
            headers['Authorization'] = `Bearer ${credentials.apiKey}`;
          }
          const apiResponse = await fetch(credentials.baseUrl, { headers });
          if (!apiResponse.ok) {
             const errorBody = await apiResponse.text();
            throw new Error(`API error: ${apiResponse.status} ${apiResponse.statusText} - ${errorBody}`);
          }
          fetchedData = await apiResponse.json();
          console.log("Successfully fetched Generic API data.");
          break;

        case "file":
          console.log("Processing File data...");
          if (!credentials?.filePath) {
             console.error("File path missing for file connection type.");
             return NextResponse.json({ error: "File path missing for file connection type." }, { status: 400 });
          }
          tempFilePath = credentials.filePath; // Use the provided path directly
          isInputFilePath = true; // Mark that this path wasn't created by us
          console.log(`Using provided file path: ${tempFilePath}`);
          break; // Skip saving to temp file

        default:
          console.error(`Unsupported connection type: ${connection.type}`);
          return NextResponse.json({ error: `Unsupported connection type: ${connection.type}` }, { status: 400 });
      }
    } catch (fetchError: any) {
      console.error(`Error fetching data for ${connection.type} (${connection.id}):`, fetchError);
      await prisma.connection.update({ where: { id: connectionId }, data: { status: 'error' } });
      return NextResponse.json({ error: `Failed to fetch data: ${fetchError.message}` }, { status: 500 });
    }

    // 2.5 Save fetched data (if not a file input) to a temporary file for unstructured
    if (!isInputFilePath && fetchedData) {
      try {
        tempFilePath = await saveToTempFile(fetchedData, `${connection.type}_${connectionId}_`);
      } catch (saveError) {
        console.error("Error saving fetched data to temp file:", saveError);
        await prisma.connection.update({ where: { id: connectionId }, data: { status: 'error' } });
        return NextResponse.json({ error: "Failed to save fetched data" }, { status: 500 });
      }
    }

    if (!tempFilePath) {
      console.log("No data or file path available to process.");
      // Update status? Maybe 'connected' but no new data?
      await prisma.connection.update({ where: { id: connectionId }, data: { status: 'connected' } }); // Assume success if no data
      return NextResponse.json({ message: "No data fetched or file path provided." }, { status: 200 });
    }

    // 3. Process Data via Unstructured Service
    console.log(`Sending file ${tempFilePath} to unstructured service at ${UNSTRUCTURED_SERVICE_URL}`);
    let processedElements: any[] = [];
    try {
      const unstructuredResponse = await fetch(UNSTRUCTURED_SERVICE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_path: tempFilePath }), // Send absolute path
      });

      if (!unstructuredResponse.ok) {
        const errorBody = await unstructuredResponse.text();
        throw new Error(`Unstructured service failed: ${unstructuredResponse.status} ${errorBody}`);
      }
      processedElements = await unstructuredResponse.json();
      console.log(`Received ${processedElements.length} elements from unstructured service.`);

    } catch (processingError: any) {
      console.error("Error calling unstructured service:", processingError);
      await prisma.connection.update({ where: { id: connectionId }, data: { status: 'error' } });
      return NextResponse.json({ error: `Failed to process data: ${processingError.message}` }, { status: 500 });
    } finally {
      // Clean up the temporary file if we created it
      if (tempFilePath && !isInputFilePath) {
        await cleanupTempFile(tempFilePath);
      }
    }

    // 4. Ingest Processed Data into RAG
    if (processedElements.length > 0) {
      console.log("Ingesting processed elements into RAG system...");
      try {
        const documentsToIngest = processedElements.map((el, index) => ({
          id: `${connectionId}_${Date.now()}_${index}`,
          text: el.text || JSON.stringify(el), 
          metadata: { 
            source_connection_id: connectionId,
            source_name: connection.name,
            source_type: connection.type,
            original_filename: isInputFilePath ? tempFilePath : null, 
            ...el.metadata 
           },
        }));
        
        await addDocumentsToRAG(documentsToIngest);
        console.log("Successfully ingested documents into RAG.");
        await prisma.connection.update({ where: { id: connectionId }, data: { status: 'connected' } });

      } catch (ingestionError: any) {
        console.error("Error ingesting documents into RAG:", ingestionError);
        await prisma.connection.update({ where: { id: connectionId }, data: { status: 'error' } });
        return NextResponse.json({ error: `Failed to ingest data: ${ingestionError.message}` }, { status: 500 });
      }
    } else {
      console.log("No elements processed by unstructured service, skipping ingestion.");
      await prisma.connection.update({ where: { id: connectionId }, data: { status: 'connected' } }); // Mark as connected even if no new data
    }

    return NextResponse.json({ message: `Successfully fetched and processed data for connection ${connectionId}` }, { status: 200 });

  } catch (error: any) {
    console.error(`Error in fetch process for connection ${connectionId}:`, error);
    // Ensure status is updated even if error is before DB interaction
    try {
      await prisma.connection.update({ where: { id: connectionId }, data: { status: 'error' } });
    } catch (dbError) {
      console.error(`Failed to update connection status to error for ${connectionId}:`, dbError);
    }
    // Clean up temp file in case of unexpected error before the finally block
    if (tempFilePath && !isInputFilePath) {
        await cleanupTempFile(tempFilePath);
    }
    return NextResponse.json({ error: `Failed fetch process: ${error.message}` }, { status: 500 });
  }
}

