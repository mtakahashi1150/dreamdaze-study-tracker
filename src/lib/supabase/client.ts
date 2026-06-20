import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

const PLACEHOLDER_PATTERNS = [
  "YOUR_PROJECT",
  "placeholder.supabase.co",
  "placeholder-key-for-build",
  "your-anon-key",
];

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) return false;
  return !PLACEHOLDER_PATTERNS.some(
    (p) => url.includes(p) || key.includes(p),
  );
}
