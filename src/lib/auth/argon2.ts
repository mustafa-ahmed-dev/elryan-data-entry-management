/**
 * Argon2 Password Hashing Utilities
 *
 * Argon2 is the recommended algorithm for password hashing
 * Winner of the Password Hashing Competition
 */

import { hash, verify } from "argon2";

/**
 * Hash a password using Argon2
 *
 * @param password - Plain text password
 * @returns Hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hashedPassword = await hash(password, {
      type: 2, // Argon2id (recommended for most use cases)
      memoryCost: 65536, // 64 MB
      timeCost: 3, // Number of iterations
      parallelism: 4, // Number of threads
    });

    return hashedPassword;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Failed to hash password");
  }
}

/**
 * Verify a password against a hash
 *
 * @param hash - Stored password hash
 * @param password - Plain text password to verify
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(
  hash: string,
  password: string
): Promise<boolean> {
  try {
    const isValid = await verify(hash, password);
    return isValid;
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
}

/**
 * Check if a password hash needs to be rehashed
 * (e.g., if security parameters have changed)
 *
 * @param hash - Password hash to check
 * @returns True if rehashing is needed
 */
export function needsRehash(hash: string): boolean {
  try {
    // Argon2 provides this check
    // If true, you should rehash the password on next login
    return false; // For now, always false
  } catch (error) {
    return true;
  }
}
