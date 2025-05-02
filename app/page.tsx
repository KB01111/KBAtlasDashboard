"use client"; // Required for client-side components and hooks

import { Metadata } from "next";
import { useSession, signIn, signOut } from "next-auth/react"; // Import next-auth hooks
import { Button } from "@/components/Button/Button"; // Assuming Button component exists

// Placeholder data/components for widgets - these will be replaced with actual data fetching and components
const EmailSummaryWidget = () => {
  const { data: session } = useSession();
  return (
    <div className="rounded border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <h3 className="mb-2 text-lg font-semibold dark:text-white">Email Summary</h3>
      {session ? (
        <p className="text-gray-500 dark:text-gray-400">Loading emails for {session.user?.email}...</p>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">Sign in to view emails.</p>
      )}
      {/* Placeholder for email list/summary */}
    </div>
  );
};

const LunarDataWidget = () => (
  <div className="rounded border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
    <h3 className="mb-2 text-lg font-semibold dark:text-white">Lunar Bank Data</h3>
    <p className="text-gray-500 dark:text-gray-400">Loading Lunar data...</p>
    {/* Placeholder for Lunar Bank data display */}
  </div>
);

const BokioDataWidget = () => (
  <div className="rounded border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
    <h3 className="mb-2 text-lg font-semibold dark:text-white">Bokio Bookkeeping</h3>
    <p className="text-gray-500 dark:text-gray-400">Loading Bokio data...</p>
    {/* Placeholder for Bokio data display */}
  </div>
);

const NotificationsWidget = () => (
  <div className="rounded border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
    <h3 className="mb-2 text-lg font-semibold dark:text-white">Notifications</h3>
    <p className="text-gray-500 dark:text-gray-400">No new notifications.</p>
    {/* Placeholder for notifications list */}
  </div>
);

const ChartWidget = () => (
  <div className="rounded border border-gray-200 dark:border-gray-700 p-4 shadow-sm col-span-1 md:col-span-2">
    <h3 className="mb-2 text-lg font-semibold dark:text-white">Data Chart</h3>
    <p className="text-gray-500 dark:text-gray-400">Chart placeholder.</p>
    {/* Placeholder for chart component */}
  </div>
);

// Authentication Status Component
const AuthStatus = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading session...</p>;
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <p className="dark:text-white">Signed in as {session.user?.email}</p>
        <Button onClick={() => signOut()} variant="outline">Sign out</Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <p className="dark:text-white">Not signed in</p>
      <Button onClick={() => signIn("google")}>Sign in with Google</Button>
    </div>
  );
};

// Main Dashboard Page Component
export default function DashboardPage() {
  // Metadata can be defined here if needed, or keep it in layout if global
  // export const metadata: Metadata = { title: "Company Dashboard" };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold dark:text-white">Company Dashboard</h1>
        <AuthStatus /> { /* Add Auth Status component */}
      </div>
      
      {/* Grid layout for widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Row 1 */}
        <EmailSummaryWidget />
        <LunarDataWidget />
        <BokioDataWidget />
        
        {/* Row 2 */}
        <NotificationsWidget />
        <ChartWidget /> 
        {/* Add more widgets here as needed */}
      </div>
    </div>
  );
}

