// src/lib/mastra/tools/apiConnectorTool.ts
import { z } from "zod";
import { createTool } from "@mastra/core/tools";

export const apiConnectorTool = createTool({
  id: "apiConnector",
  inputSchema: z.object({
    url: z.string().url().describe("The URL of the API endpoint to call."),
    method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).default("GET").describe("HTTP method to use."),
    headers: z.record(z.string()).optional().describe("Optional headers for the request (e.g., {'Authorization': 'Bearer token'})."),
    body: z.record(z.any()).optional().describe("Optional JSON body for POST/PUT/PATCH requests."),
  }),
  description: "Connects to an arbitrary API endpoint, sends a request, and returns the JSON response. Useful for fetching data from internal or external services.",
  execute: async ({ input }) => {
    console.log(`Executing API Connector Tool: ${input.method} ${input.url}`);
    try {
      const requestOptions: RequestInit = {
        method: input.method,
        headers: {
          "Content-Type": "application/json",
          ...(input.headers || {}),
        },
      };

      if (input.body && (input.method === "POST" || input.method === "PUT" || input.method === "PATCH")) {
        requestOptions.body = JSON.stringify(input.body);
      }

      const response = await fetch(input.url, requestOptions);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Connector Error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      // Attempt to parse JSON, but return text if it fails
      const responseText = await response.text();
      try {
        const jsonData = JSON.parse(responseText);
        console.log("API Connector Success (JSON Response)");
        return jsonData;
      } catch (jsonError) {
        console.log("API Connector Success (Text Response)");
        return responseText; // Return raw text if not valid JSON
      }
    } catch (error: any) {
      console.error("API Connector Tool failed:", error);
      return { error: `Failed to execute API request: ${error.message}` };
    }
  },
});

