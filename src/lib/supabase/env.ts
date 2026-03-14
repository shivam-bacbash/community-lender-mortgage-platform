function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}.`);
  }

  return value;
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL.");
  }

  if (!anonKey) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return { url, anonKey };
}

export function getSupabaseServiceRoleEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase server environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return { url, serviceRoleKey };
}

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

export function getAppSecretKey() {
  return getRequiredEnv("APP_SECRET_KEY");
}

export function getResendFromEmail() {
  return getRequiredEnv("RESEND_FROM_EMAIL");
}
