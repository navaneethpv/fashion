/**
 * Environment Variable Validation
 * 
 * This file validates that all required environment variables are present
 * at application startup, failing fast with clear error messages if any are missing.
 * 
 * Import this at the top of your root layout or configuration file.
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_API_URL',
] as const;

const optionalEnvVars = [
  'NEXT_PUBLIC_API_BASE',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
] as const;

export function validateEnv() {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    const errorMessage = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ MISSING REQUIRED ENVIRONMENT VARIABLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The following environment variables are required but not set:

${missing.map(v => `  • ${v}`).join('\n')}

To fix this:

1. For local development:
   - Copy .env.example to .env.local
   - Fill in the required values

2. For Vercel production:
   - Go to: Settings → Environment Variables
   - Add each missing variable with the appropriate value

3. For other hosting platforms:
   - Configure environment variables in your platform's dashboard

See .env.example for a complete list of required variables.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    throw new Error(errorMessage);
  }

  // Log optional variables that are missing (for informational purposes)
  const missingOptional = optionalEnvVars.filter(v => !process.env[v]);
  if (missingOptional.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('⚠️  Optional environment variables not set:', missingOptional.join(', '));
  }

  // Return validated environment for type-safe access
  return {
    apiUrl: process.env.NEXT_PUBLIC_API_URL!,
    apiBase: process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL!,
    clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    clerkSecretKey: process.env.CLERK_SECRET_KEY,
  };
}

// Validate immediately when this module is imported
export const env = validateEnv();
