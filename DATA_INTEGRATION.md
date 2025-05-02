# Data Integration Framework Design

This document outlines the design for a flexible data integration framework within the company dashboard application. The goal is to allow users to easily connect various data sources, process the data using the `unstructured` library, and make it accessible to the AI chat (Mastra/CopilotKit) via a Retrieval-Augmented Generation (RAG) system.

## Goals

*   Provide a user-friendly interface for managing data source connections.
*   Support various data source types (e.g., Gmail, APIs like Lunar Bank/Bokio, file uploads).
*   Securely handle credentials and authentication (including OAuth).
*   Automate data fetching and processing using the `unstructured` library.
*   Integrate processed data into a RAG system for querying by the AI agent.
*   Ensure the process is efficient and scalable.

## Components

1.  **Data Source Management UI (Frontend):**
    *   A dedicated section or page within the Next.js dashboard.
    *   Displays currently connected data sources.
    *   Provides forms/flows to add new connections (selecting source type, entering details like API keys, URLs, triggering OAuth flows).
    *   Allows editing and removing existing connections.

2.  **Connection Manager (Backend - Next.js API Routes):**
    *   Handles CRUD operations for data source configurations.
    *   Manages the secure storage of credentials (API keys, tokens). **Strategy TBD** (e.g., encrypted database fields, external secrets manager).
    *   Includes endpoints to initiate and handle OAuth callbacks (e.g., `/api/connect/google`, `/api/connect/google/callback`).
    *   Manages token refresh logic for OAuth-based sources.

3.  **Data Fetching Service (Backend):**
    *   A background process or scheduled task (implementation TBD - could be part of the Next.js app or a separate service).
    *   Periodically checks configured data sources for new or updated data.
    *   Uses specific connector logic (potentially leveraging Mastra tools or dedicated functions) for each source type to fetch data.
    *   Passes fetched raw data to the Unstructured Processing Pipeline.

4.  **Unstructured Processing Pipeline (Backend):**
    *   Receives raw data (files, API responses, emails) from the Data Fetching Service.
    *   Utilizes the `unstructured` Python library to parse diverse file formats and data structures into clean, structured text chunks.
    *   **Note:** This likely requires running `unstructured` (Python) - options include:
        *   A separate Python microservice called from the Node.js backend.
        *   Using a Node.js wrapper if available and suitable.
        *   Running Python scripts directly from Node.js.
    *   Outputs standardized data chunks suitable for embedding.

5.  **Vector Store & Ingestion (Backend):**
    *   **Vector Database:** Stores embeddings of the processed data chunks (e.g., Pinecone, ChromaDB, pgvector).
    *   **Embedding Model:** Generates vector embeddings for data chunks (e.g., using OpenAI via Vercel AI SDK).
    *   **Ingestion Process:** Takes chunks from the `unstructured` pipeline, generates embeddings, and upserts them into the vector database with associated metadata (source, timestamp, etc.).

6.  **RAG Retriever (Backend - Integrated with Mastra):**
    *   Implemented as a Mastra tool or integrated directly into the agent logic.
    *   When the AI agent needs to answer questions using company data, it invokes the retriever.
    *   The retriever converts the user query into an embedding.
    *   Queries the vector database for semantically similar chunks.
    *   Retrieves the relevant chunks and their metadata.
    *   Provides these chunks as context to the LLM (via the Mastra agent) to generate an informed answer.

## Data Flow

```mermaid
graph TD
    User --> UI[Data Source Mgmt UI]
    UI --> CM[Connection Manager API]
    CM --> CredStore[(Secure Credential Store)]
    
    subgraph Backend
        CM
        DFS[Data Fetching Service]
        UPP[Unstructured Pipeline]
        VSI[Vector Store Ingestion]
        RAG[RAG Retriever Tool]
        MastraAgent[Mastra Agent]
    end
    
    subgraph External Systems
        DataSource[Data Sources (Gmail, APIs, Files)]
        VectorDB[(Vector Database)]
        EmbeddingAPI[Embedding API]
        LLM[LLM API (Vercel AI SDK)]
    end

    CM -- Config --> DFS
    DFS -- Fetch --> DataSource
    DataSource -- Raw Data --> DFS
    DFS -- Raw Data --> UPP
    UPP -- Processed Chunks --> VSI
    VSI -- Embeddings --> VectorDB
    VSI -- Generate Embeddings --> EmbeddingAPI
    EmbeddingAPI -- Embeddings --> VSI

    User --> CopilotUI[CopilotKit UI]
    CopilotUI --> CopilotBE[CopilotKit Backend]
    CopilotBE --> MastraAgent
    MastraAgent -- Query --> RAG
    RAG -- Query Embedding --> EmbeddingAPI
    EmbeddingAPI -- Embedding --> RAG
    RAG -- Similarity Search --> VectorDB
    VectorDB -- Relevant Chunks --> RAG
    RAG -- Context Chunks --> MastraAgent
    MastraAgent -- Prompt + Context --> LLM
    LLM -- Answer --> MastraAgent
    MastraAgent -- Answer --> CopilotBE
    CopilotBE -- Answer --> CopilotUI
```

## Next Steps (Implementation Order)

1.  **Setup `unstructured`:** Decide on the integration strategy (microservice, wrapper, script) and set up the basic pipeline.
2.  **Setup Vector Store:** Choose and configure a vector database.
3.  **Implement RAG Retriever:** Create the Mastra tool for querying the vector store.
4.  **Implement Connection Manager Backend:** Build API routes for managing connections (initially without full OAuth/credential handling complexity).
5.  **Implement Data Source Management UI:** Create the basic UI for adding/viewing connections.
6.  **Implement Data Fetching & Ingestion:** Create the initial service logic to fetch from a simple source type (e.g., file upload or basic API), process via `unstructured`, and ingest into the vector store.
7.  **Integrate Connectors:** Add specific connectors (Gmail OAuth, Lunar, Bokio) into this framework.

