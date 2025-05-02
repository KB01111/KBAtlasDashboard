// src/lib/ragService.ts
import { ChromaClient, OpenAIEmbeddingFunction } from "chromadb";
import { generateText } from "ai"; // Using Vercel AI SDK
import { openai } from "@ai-sdk/openai"; // Using Vercel AI SDK OpenAI provider
import path from "path";

// Define the path for persistent ChromaDB storage
const CHROMA_DATA_PATH = path.resolve("./chroma_data"); // Use absolute path relative to project root

// Initialize ChromaDB client for persistence
console.log(`Initializing ChromaDB client with path: ${CHROMA_DATA_PATH}`);
const client = new ChromaClient({ path: CHROMA_DATA_PATH });

// Initialize OpenAI Embedding Function using Vercel AI SDK provider
// Note: ChromaDB's OpenAIEmbeddingFunction might expect direct OpenAI API key/config.
// We need to adapt it or create a custom embedding function using Vercel AI SDK.

// Custom Embedding Function using Vercel AI SDK
class VercelAIEmbeddingFunction {
  private model: any; // Type according to Vercel AI SDK

  constructor(model: any) {
    this.model = model;
  }

  // ChromaDB expects an `generate` method
  public async generate(texts: string[]): Promise<number[][]> {
    try {
      // Use the Vercel AI SDK to generate embeddings
      // Note: The exact method might differ based on Vercel AI SDK version/API
      // Assuming a hypothetical `generateEmbeddings` function or similar
      // This part needs verification against the actual Vercel AI SDK capabilities for embeddings.
      
      // Use the actual Vercel AI SDK embedding generation
      const { embeddings } = await this.model.embed({ texts }); 
      
      if (!embeddings || embeddings.length !== texts.length) {
        throw new Error("Failed to generate embeddings or mismatch in count.");
      }
      return embeddings;
    } catch (error) {
      console.error("Error generating embeddings with Vercel AI SDK:", error);
      // Fallback or re-throw depending on desired behavior
      // For now, re-throwing to make the failure explicit
      throw error;
    }
  }
}

// Use the Vercel AI SDK OpenAI model for embeddings
// Ensure OPENAI_API_KEY is set in the environment
const embedder = new VercelAIEmbeddingFunction(openai.embedding("text-embedding-3-small")); // Adjust model name if needed

const COLLECTION_NAME = "company_data";

// Function to get or create the Chroma collection
async function getCompanyDataCollection() {
  try {
    const collection = await client.getOrCreateCollection({
      name: COLLECTION_NAME,
      embeddingFunction: embedder, // Use our custom Vercel AI SDK embedder
      metadata: { "hnsw:space": "cosine" } // Optional: specify distance function
    });
    console.log(`Chroma collection '${COLLECTION_NAME}' ready (persistent).`);
    return collection;
  } catch (error) {
    console.error("Error getting/creating Chroma collection:", error);
    throw error;
  }
}

// Function to add processed documents (chunks) to ChromaDB
export async function addDocumentsToRAG(docs: Array<{ id: string; text: string; metadata: object }>) {
  if (!docs || docs.length === 0) {
    console.log("No documents provided to add to RAG.");
    return;
  }
  
  const collection = await getCompanyDataCollection();
  
  try {
    await collection.add({
      ids: docs.map(doc => doc.id),
      documents: docs.map(doc => doc.text),
      metadatas: docs.map(doc => doc.metadata),
    });
    console.log(`Added ${docs.length} documents to Chroma collection '${COLLECTION_NAME}'.`);
  } catch (error) {
    console.error("Error adding documents to Chroma:", error);
    // Consider adding retry logic or more specific error handling
    throw error;
  }
}

// Function to query the RAG system
export async function queryRAG(queryText: string, nResults: number = 5) {
  const collection = await getCompanyDataCollection();
  
  try {
    const results = await collection.query({
      queryTexts: [queryText],
      nResults: nResults,
      include: ["metadatas", "documents"] // Include metadata and documents for context
    });
    console.log(`Query results from Chroma for "${queryText}":`, results.documents?.[0].length);
    // Return documents and metadata for the first query
    return {
        documents: results.documents?.[0] ?? [],
        metadatas: results.metadatas?.[0] ?? []
    };
  } catch (error) {
    console.error("Error querying Chroma:", error);
    throw error;
  }
}

// Example usage (for testing purposes, call from an API route or similar)
/*
async function testRAG() {
  try {
    await addDocumentsToRAG([
      { id: "doc1", text: "The company policy for vacation is 20 days per year.", metadata: { source: "hr_manual.pdf" } },
      { id: "doc2", text: "Quarterly reports are due by the 15th of the following month.", metadata: { source: "finance_guide.docx" } },
    ]);
    
    const relevantDocs = await queryRAG("How many vacation days do we get?");
    console.log("Relevant documents found:", relevantDocs);
  } catch (error) {
    console.error("RAG test failed:", error);
  }
}
// testRAG();
*/

