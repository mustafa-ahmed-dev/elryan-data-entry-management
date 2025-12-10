/**
 * NextAuth API Route Handler
 *
 * This creates all the necessary authentication endpoints:
 * - POST /api/auth/signin
 * - POST /api/auth/signout
 * - GET /api/auth/session
 * - GET /api/auth/csrf
 * - POST /api/auth/callback/credentials
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/config";

const handler = NextAuth(authOptions);

// Export for both GET and POST requests
export { handler as GET, handler as POST };
