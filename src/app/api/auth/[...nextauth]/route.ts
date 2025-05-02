// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter"; // Optional: For storing sessions/users in DB
import { PrismaClient } from "@prisma/client"; // Optional: For Prisma adapter

// Initialize Prisma Client (if using adapter)
// const prisma = new PrismaClient();

const handler = NextAuth({
  // adapter: PrismaAdapter(prisma), // Optional: Configure Prisma adapter
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline", // Request refresh token
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly" // Add Gmail readonly scope
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET!,
  session: {
    strategy: "jwt", // Using JWT for session management
  },
  callbacks: {
    // Add access token and refresh token to the JWT
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token; // Store refresh token
        token.expiresAt = account.expires_at; // Store expiry time
      }
      // TODO: Handle token refresh if accessToken expires
      return token;
    },
    // Add access token to the session object
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      // Optionally add user ID or other info
      // session.userId = token.sub;
      return session;
    },
  },
  // Add debug logs in development
  debug: process.env.NODE_ENV === "development",
});

export { handler as GET, handler as POST };

