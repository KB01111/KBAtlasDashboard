// src/lib/mastra.ts
import { Mastra } from "@mastra/core";
// Use Vercel AI SDK for model interaction
import { openai } from "@ai-sdk/openai"; 
import { z } from "zod";
import { createTool, Agent } from "@mastra/core";

// Import tools
import { apiConnectorTool } from "./mastra/tools/apiConnectorTool";
import { gmailTool } from "./mastra/tools/gmailTool";
import { companyDataRetrieverTool } from "./mastra/tools/ragTool"; // Import the RAG tool

// Define a simple example tool for now (can be removed later if not needed)
const sayHelloTool = createTool({
  id: "sayHello",
  inputSchema: z.object({
    name: z.string().describe("The name of the person to say hello to."),
  }),
  description: "Says hello to a given person.",
  execute: async ({ input }) => {
    console.log(`Tool execution: Saying hello to ${input.name}`);
    return `Hello, ${input.name}!`;
  },
});

// Define the agent with all tools, including the RAG tool
const dashboardAgentTools = {
  sayHello: sayHelloTool,
  apiConnector: apiConnectorTool,
  gmailReader: gmailTool, // Placeholder, requires OAuth
  companyDataRetriever: companyDataRetrieverTool, // Added RAG tool
};

const basicAgent = new Agent<typeof dashboardAgentTools>({
  name: "DashboardAgent",
  instructions: "You are a helpful assistant for the company dashboard. You use Vercel AI SDK for interactions. Use the companyDataRetriever tool to answer questions about internal company information, policies, or reports. You can also use other available tools to perform tasks like connecting to external APIs or reading Gmail (requires authentication).",
  // Use Vercel AI SDK OpenAI provider
  model: openai("gpt-4o-mini"), // Ensure OPENAI_API_KEY is set
  // Note: Mastra might need specific adapters or configuration 
  // to fully leverage Vercel AI SDK's features like generateObject or advanced tool use.
  // This basic setup uses the Vercel AI SDK model provider for text generation within the Mastra agent.
  tools: dashboardAgentTools,
});

// Initialize Mastra
export const mastra = new Mastra({
  agents: { dashboardAgent: basicAgent },
});

// Re-export Agent for use in route.ts if needed directly (though likely accessed via mastra instance)
export { Agent };
