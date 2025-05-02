# System Architecture Design

This document outlines the proposed architecture for the company dashboard application, integrating the Next Enterprise boilerplate, Mastra.ai, CopilotKit, and data connectors.

## Components

1.  **Frontend:**
    *   **Framework:** Next.js (using the cloned Next Enterprise boilerplate - `/home/ubuntu/company-dashboard`).
    *   **UI Library:** Components provided by Next Enterprise (likely includes Tailwind CSS, shadcn/ui).
    *   **AI Integration:** CopilotKit (`@copilotkit/react-ui`, `@copilotkit/react-core`) will be used to provide the chat interface and render generative UI components based on AI agent actions.

2.  **Backend:**
    *   **Framework:** Next.js API Routes (Node.js/TypeScript). This keeps the tech stack consistent with the frontend and Mastra.ai.
    *   **Rationale:** While FastAPI was mentioned, using Next.js API routes simplifies the architecture by avoiding the need for a separate service and inter-service communication. It integrates seamlessly with the Next.js frontend and TypeScript-based Mastra.ai.
    *   **AI Agents:** Mastra.ai (`@mastra/core`, `@mastra/openai`, etc.) will be integrated within the API routes to handle AI logic, manage agent memory, and execute tools.
    *   **CopilotKit Backend:** CopilotKit's backend components (`@copilotkit/backend`) will run within the API routes to handle actions triggered from the frontend and potentially interact with Mastra.ai agents.

3.  **AI Agents (Mastra.ai):**
    *   These agents will reside in the backend (Next.js API routes).
    *   They will be responsible for understanding user requests (via the CopilotKit interface), accessing internal data, and performing actions.
    *   Capabilities will include memory, tool execution, and potentially RAG (Retrieval-Augmented Generation) if needed for analyzing internal documents.

4.  **Data Connectors (Mastra.ai Tools):**
    *   Implemented as Mastra.ai tools within the backend.
    *   **Gmail Integration:** A specific tool will be created to interact with the Gmail API. This will require handling OAuth 2.0 authentication, which might involve user interaction facilitated by the frontend or secure backend token management.
    *   **Easy API Data Connector:** This will be a flexible tool (or set of tools) allowing the AI agent to connect to various REST APIs based on user input or configuration. It might involve:
        *   Dynamically constructing API requests.
        *   Handling different authentication methods.
        *   AI assistance in formulating requests or interpreting responses.

5.  **Generative UI (CopilotKit):**
    *   Implemented using React components within the Next.js frontend.
    *   The CopilotKit `useCopilotAction` hook will define actions that allow the backend (Mastra.ai agent via CopilotKit backend) to request the rendering of specific UI components in the chat window (e.g., displaying data fetched from Gmail or other APIs).

## Workflow Example (Gmail Integration)

1.  User asks the Copilot (via CopilotKit UI) to "Summarize my unread emails from today."
2.  CopilotKit frontend sends the request to the CopilotKit backend (Next.js API route).
3.  CopilotKit backend potentially routes the request to a Mastra.ai agent.
4.  The Mastra.ai agent identifies the need to use the "Gmail Reader" tool.
5.  The "Gmail Reader" tool (a Mastra tool) executes:
    *   Checks for valid OAuth token.
    *   If necessary, triggers a frontend flow (potentially using CopilotKit's `render` function) to ask the user to authenticate with Google.
    *   Uses the Gmail API to fetch unread emails.
    *   Processes the emails.
6.  The tool returns the summarized information to the Mastra agent.
7.  The Mastra agent formats the response.
8.  The response is sent back through CopilotKit backend to the frontend.
9.  CopilotKit UI displays the summary to the user, potentially rendering a custom component (e.g., a list of email summaries) if requested by the agent via a `render` action.

## Diagram

```mermaid
graph TD
    User --> FE[Next.js Frontend (Next Enterprise + CopilotKit UI)]
    FE --> BE[Next.js API Routes (Backend)]
    BE --> Mastra[Mastra.ai Agents & Tools]
    BE --> CopilotKitBE[CopilotKit Backend Actions]
    Mastra --> Gmail[Gmail API]
    Mastra --> OtherAPIs[Other Internal/External APIs]
    CopilotKitBE --> Mastra

    subgraph "Frontend (Browser)"
        FE
    end

    subgraph "Backend (Server)"
        BE
        Mastra
        CopilotKitBE
    end

    subgraph "External Services"
        Gmail
        OtherAPIs
    end
```

## Next Steps

1.  Implement the backend structure within the Next.js API routes.
2.  Install and configure Mastra.ai and CopilotKit backend dependencies.
3.  Develop initial Mastra agents and tools.
4.  Integrate CopilotKit frontend components.
5.  Implement data connectors, starting with simpler ones before tackling Gmail OAuth.
6.  Develop generative UI components.

