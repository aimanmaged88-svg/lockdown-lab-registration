import { z } from "zod";

// Validate environment once, at import. Fail loudly in the wrong shape rather
// than silently misbehaving later.
const schema = z.object({
  DATABASE_URL: z.string().min(1).default("file:./dev.db"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_TIMEZONE: z.string().default("Australia/Sydney"),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  FEATURE_COMMUNITY_BETA: z
    .string()
    .default("false")
    .transform((v) => v === "true" || v === "1"),
  FEATURE_VIDEO_INSPECT: z
    .string()
    .default("false")
    .transform((v) => v === "true" || v === "1"),
  AI_PROVIDER: z.string().default(""),
  AI_API_KEY: z.string().default(""),
  AI_MODEL: z.string().default(""),
  AUTH_SECRET: z.string().default("dev-secret-change-me"),
  // Optional cloud file storage (Supabase). When unset, uploads use local disk.
  SUPABASE_URL: z.string().default(""),
  SUPABASE_ANON_KEY: z.string().default(""),
  SUPABASE_STORAGE_BUCKET: z.string().default("media"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Surface the exact problem; never boot in a broken config.
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration. See .env.example.");
}

export const env = parsed.data;

export const aiEnabled = env.AI_PROVIDER !== "" && env.AI_API_KEY !== "";
