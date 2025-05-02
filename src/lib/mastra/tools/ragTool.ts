// src/lib/mastra/tools/ragTool.ts
import { z } from "zod";
import { createTool } from "@mastra/core";
import { queryRAG } from "@/lib/ragService"; // Assuming ragService is in src/lib

export const companyDataRetrieverTool = createTool({
  id: "companyDataRetriever",
  inputSchema: z.object({
    query: z.string().describe("The question to ask about company data (e.g., policies, reports). Use this for internal knowledge."),
  }),
  description: "Retrieves relevant information from internal company documents to answer questions.",
  execute: async ({ input }) => {
    console.log(`RAG Tool execution: Querying company data for: ${input.query}`);
    try {
      const relevantDocs = await queryRAG(input.query, 3); // Get top 3 results
      if (!relevantDocs || relevantDocs.length === 0) {
        return "No relevant information found in company documents.";
      }
      // Format the results for the LLM
      const context = relevantDocs.map((doc, index) => `Document ${index + 1}:\n${doc}`).join("\n\n");
      return `Based on company documents:\n${context}`;
    } catch (error) {
      console.error("Error executing RAG tool:", error);
      return "Sorry, I encountered an error while searching company documents.";
    }
  },
});

