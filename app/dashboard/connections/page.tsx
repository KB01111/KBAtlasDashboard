"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/Button/Button"; // Assuming Button component exists
import { Input } from "@/components/ui/input"; // Assuming shadcn/ui Input exists
import { Label } from "@/components/ui/label"; // Assuming shadcn/ui Label exists
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Assuming shadcn/ui Select exists
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; // Assuming shadcn/ui Card exists
import { Textarea } from "@/components/ui/textarea"; // Assuming shadcn/ui Textarea exists

// Interface for connection data (excluding credentials for display)
interface ConnectionDisplay {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
}

// Define connection types and their required credential fields
const CONNECTION_TYPES = {
  gmail: { label: "Gmail (OAuth)", fields: [] }, // OAuth handled separately
  lunar: { label: "Lunar Bank (API Key)", fields: [{ name: "apiKey", label: "API Key", type: "password" }] },
  bokio: { label: "Bokio (API Key)", fields: [{ name: "apiKey", label: "API Key", type: "password" }] },
  api: { label: "Generic API", fields: [{ name: "baseUrl", label: "Base URL", type: "text" }, { name: "apiKey", label: "API Key (Optional)", type: "password" }] },
  file: { label: "File Upload", fields: [] }, // Handled via upload mechanism TBD
};

type ConnectionType = keyof typeof CONNECTION_TYPES;

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<ConnectionDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [newConnectionName, setNewConnectionName] = useState("");
  const [newConnectionType, setNewConnectionType] = useState<ConnectionType | "">("");
  const [newCredentials, setNewCredentials] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch connections
  const fetchConnections = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/data-integration/connections");
      if (!response.ok) {
        throw new Error(`Failed to fetch connections: ${response.statusText}`);
      }
      const data = await response.json();
      setConnections(data);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Handle credential input change
  const handleCredentialChange = (fieldName: string, value: string) => {
    setNewCredentials(prev => ({ ...prev, [fieldName]: value }));
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newConnectionName || !newConnectionType) {
      setError("Please provide a name and select a type.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/data-integration/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newConnectionName,
          type: newConnectionType,
          credentials: newCredentials, // Send credentials (backend handles encryption)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to add connection: ${response.statusText}`);
      }

      // Reset form and refetch connections
      setNewConnectionName("");
      setNewConnectionType("");
      setNewCredentials({});
      fetchConnections(); 

    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle connection type change
  const handleTypeChange = (value: string) => {
    setNewConnectionType(value as ConnectionType);
    setNewCredentials({}); // Reset credentials when type changes
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="mb-6 text-3xl font-bold dark:text-white">Manage Data Connections</h1>

      {/* Add New Connection Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add New Connection</CardTitle>
          <CardDescription>Connect a new data source to integrate its data.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="conn-name">Connection Name</Label>
              <Input 
                id="conn-name" 
                placeholder="e.g., My Gmail Account, Lunar Prod API" 
                value={newConnectionName}
                onChange={(e) => setNewConnectionName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conn-type">Connection Type</Label>
              <Select onValueChange={handleTypeChange} value={newConnectionType} required>
                <SelectTrigger id="conn-type">
                  <SelectValue placeholder="Select data source type..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONNECTION_TYPES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dynamically render credential fields based on type */}
            {newConnectionType && CONNECTION_TYPES[newConnectionType]?.fields.map(field => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={`cred-${field.name}`}>{field.label}</Label>
                <Input
                  id={`cred-${field.name}`}
                  type={field.type || "text"}
                  placeholder={`Enter ${field.label}`}
                  value={newCredentials[field.name] || ""}
                  onChange={(e) => handleCredentialChange(field.name, e.target.value)}
                  required={!field.label.includes("(Optional)")} // Basic required logic
                />
              </div>
            ))}
            {newConnectionType === "gmail" && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Gmail connection requires authorization via Google. Click Add Connection to start the process (OAuth flow TBD).</p>
            )}
             {newConnectionType === "file" && (
              <p className="text-sm text-gray-500 dark:text-gray-400">File connections are managed via upload mechanisms (Implementation TBD).</p>
            )}

          </CardContent>
          <CardFooter className="flex justify-between">
            {error && <p className="text-red-500 text-sm">Error: {error}</p>}
            <Button type="submit" disabled={isSubmitting || !newConnectionType || (newConnectionType !== "gmail" && newConnectionType !== "file" && CONNECTION_TYPES[newConnectionType]?.fields.length > 0 && !Object.values(newCredentials).some(v => v))}>
              {isSubmitting ? "Adding..." : "Add Connection"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Existing Connections List */}
      <h2 className="mb-4 text-2xl font-semibold dark:text-white">Existing Connections</h2>
      {isLoading && <p>Loading connections...</p>}
      {!isLoading && error && <p className="text-red-500">Error loading connections: {error}</p>}
      {!isLoading && !error && connections.length === 0 && <p>No connections added yet.</p>}
      {!isLoading && !error && connections.length > 0 && (
        <div className="space-y-4">
          {connections.map((conn) => (
            <Card key={conn.id}>
              <CardHeader>
                <CardTitle>{conn.name}</CardTitle>
                <CardDescription>Type: {CONNECTION_TYPES[conn.type as ConnectionType]?.label || conn.type} | Status: {conn.status}</CardDescription>
              </CardHeader>
              <CardFooter>
                {/* TODO: Add Edit/Delete buttons here */}
                <Button variant="destructive" size="sm" onClick={() => alert("Delete functionality TBD")} disabled>Delete</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

