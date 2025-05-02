"use client"; // Required for CopilotKit and SessionProvider

import "styles/tailwind.css";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css"; // Import CopilotKit default styles
import { SessionProvider } from "next-auth/react"; // Import SessionProvider

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Wrap the entire application with SessionProvider */}
        <SessionProvider>
          <CopilotKit url="/api/copilotkit">
            {/* Wrap the main content and include the Copilot UI component */}
            <div style={{ display: "flex", height: "100vh" }}>
              <main style={{ flexGrow: 1, overflowY: "auto" }}>
                {children}
              </main>
              {/* Add the Copilot Sidebar */}
              <CopilotSidebar 
                defaultOpen={true} 
                labels={{
                  title: "Company Dashboard Copilot",
                  initial: "Hi there! How can I help you with the company data today?"
                }}
                // You can add more customization props here
              >
                {/* You can optionally add custom components inside the sidebar */}
              </CopilotSidebar>
            </div>
          </CopilotKit>
        </SessionProvider>
      </body>
    </html>
  );
}

