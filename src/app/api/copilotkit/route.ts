// src/app/api/copilotkit/route.ts
import { CopilotRuntime } from "@copilotkit/backend";
import { OpenAIAdapter } from "@copilotkit/backend"; // Using OpenAI for CopilotKit's core LLM interaction
import { mastra, Agent } from "@/lib/mastra"; // Import Mastra instance and Agent type
import { CopilotKitServiceAdapter } from "@copilotkit/backend"; // Import the service adapter

export const runtime = "edge"; // Optional: Use edge runtime for better performance

export async function POST(req: Request): Promise<Response> {
  // Get the specific Mastra agent we want to use
  const dashboardAgent = mastra.config.agents.dashboardAgent as Agent<any>; // Cast as needed

  // Create an adapter for the Mastra agent to be used by CopilotKit
  // This allows CopilotKit to understand and use the agent's tools
  const mastraServiceAdapter = new CopilotKitServiceAdapter({
    services: [dashboardAgent], // Pass the Mastra agent instance
  });

  const copilotKit = new CopilotRuntime({
    // Pass the Mastra agent adapter to CopilotKit
    // CopilotKit will use this to discover and execute the agent's tools
    services: [mastraServiceAdapter],
    // actions: [], // Can still define separate CopilotKit actions if needed
  });

  // Use OpenAI adapter for the main LLM interaction within CopilotKit
  // Ensure OPENAI_API_KEY is set in environment variables
  const openaiAdapter = new OpenAIAdapter({}); 

  try {
    // Let CopilotKit handle the request, using the OpenAI adapter for core LLM calls
    // and the Mastra adapter to execute tools defined in the Mastra agent.
    return await copilotKit.response(req, openaiAdapter);
  } catch (error) {
    console.error("Error processing CopilotKit request:", error);
    // It's often helpful to log the specific error for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: `Internal Server Error: ${errorMessage}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

