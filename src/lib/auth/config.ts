/**
 * NextAuth Configuration
 *
 * Configures authentication with:
 * - Credentials provider (email/password)
 * - Database user verification
 * - Argon2 password verification
 * - Session management with user data
 */

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { users, roles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyPassword } from "./argon2";
import type { SessionUser } from "../types/auth";

export const authOptions: NextAuthOptions = {
  // Configure authentication providers
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "your.email@example.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        // Validate input
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          // Query user from database with role information
          const [user] = await db
            .select({
              id: users.id,
              email: users.email,
              fullName: users.fullName,
              passwordHash: users.passwordHash,
              roleId: users.roleId,
              teamId: users.teamId,
              isActive: users.isActive,
              roleName: roles.name,
              roleHierarchy: roles.hierarchy,
            })
            .from(users)
            .innerJoin(roles, eq(users.roleId, roles.id))
            .where(eq(users.email, credentials.email.toLowerCase()))
            .limit(1);

          // Check if user exists
          if (!user) {
            throw new Error("Invalid email or password");
          }

          // Check if user is active
          if (!user.isActive) {
            throw new Error(
              "Account is disabled. Please contact administrator."
            );
          }

          // Verify password
          const isPasswordValid = await verifyPassword(
            user.passwordHash,
            credentials.password
          );

          if (!isPasswordValid) {
            throw new Error("Invalid email or password");
          }

          console.log("User authenticated successfully:", {
            id: user.id,
            email: user.email,
            roleName: user.roleName,
            roleId: user.roleId,
          });

          // Return user data (will be passed to jwt callback)
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.fullName,
            roleId: user.roleId,
            roleName: user.roleName as string,
            roleHierarchy: user.roleHierarchy,
            teamId: user.teamId,
          };
        } catch (error) {
          console.error("Authentication error:", error);

          // Return user-friendly error message
          if (error instanceof Error) {
            throw error;
          }

          throw new Error("Authentication failed. Please try again.");
        }
      },
    }),
  ],

  // Configure session
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Configure JWT
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Callbacks to customize behavior
  callbacks: {
    // JWT callback - runs when token is created or updated
    async jwt({ token, user, trigger, session }) {
      // Initial sign in - add user data to token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.roleId = user.roleId;
        token.roleName = user.roleName;
        token.roleHierarchy = user.roleHierarchy;
        token.teamId = user.teamId;

        console.log("JWT Callback - User signed in:", {
          id: user.id,
          email: user.email,
          roleName: user.roleName,
          roleId: user.roleId,
        });
      }

      // Handle session update (e.g., profile update)
      if (trigger === "update" && session) {
        token.name = session.user.name;
        token.email = session.user.email;
      }

      return token;
    },

    // Session callback - runs when session is checked
    async session({ session, token }) {
      if (token && session.user) {
        // Add user data to session
        const sessionUser: SessionUser = {
          id: parseInt(token.id as string),
          email: token.email as string,
          fullName: token.name as string,
          roleId: token.roleId as number,
          roleName: token.roleName as "admin" | "team_leader" | "employee",
          roleHierarchy: token.roleHierarchy as number,
          teamId: (token.teamId as number) || null,
        };

        session.user = sessionUser;

        // console.log("Session Callback - Session created:", {
        //   id: sessionUser.id,
        //   email: sessionUser.email,
        //   roleName: sessionUser.roleName,
        // });
      }

      return session;
    },
  },

  // Custom pages
  pages: {
    signIn: "/login",
    error: "/login", // Redirect to login on error
  },

  // Enable debug in development
  debug: process.env.NODE_ENV === "development",

  // Secret for JWT encryption
  secret: process.env.NEXTAUTH_SECRET,
};

// Type augmentation for NextAuth
declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }

  interface User {
    id: string;
    email: string;
    name: string;
    roleId: number;
    roleName: string;
    roleHierarchy: number;
    teamId: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    roleId: number;
    roleName: string;
    roleHierarchy: number;
    teamId: number | null;
  }
}
