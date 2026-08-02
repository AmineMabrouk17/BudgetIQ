const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const;

type EnvVarName = keyof typeof requiredEnvVars;

export const env = Object.fromEntries(
  Object.entries(requiredEnvVars).map(([name, value]) => {
    if (!value) {
      throw new Error(
        `Missing required environment variable: ${name}. Add it to .env.local (see .env.local.example).`
      );
    }
    return [name, value];
  })
) as Record<EnvVarName, string>;
