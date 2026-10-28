import { z } from "zod";

const envSchema = z
  .object({
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(3).default(0),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url().optional(),

    SUPABASE_URL: z.string().url(),
    SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    SUPABASE_STORAGE_KEY: z.string().optional(),
    AUTH_REDIRECT_URL: z.string().url().optional(),

    REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce
      .number()
      .int()
      .min(1)
      .max(30)
      .default(7),
    AUTH_COOKIE_NAME: z.string().default("refresh_token"),

    CONTENT_READ_MODE: z.enum(["localized", "legacy"]).default("localized"),
    CORS_ORIGIN: z.url().default("http://localhost:3000"),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") return;
    for (const field of [
      "SUPABASE_URL",
      "CORS_ORIGIN",
      "AUTH_REDIRECT_URL",
    ] as const) {
      if (!env[field] || !env[field].startsWith("https://"))
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: "Production requires HTTPS",
        });
    }
    if (!env.SUPABASE_STORAGE_KEY)
      ctx.addIssue({
        code: "custom",
        path: ["SUPABASE_STORAGE_KEY"],
        message: "Production storage credential required",
      });
    if (env.DIRECT_URL)
      ctx.addIssue({
        code: "custom",
        path: ["DIRECT_URL"],
        message: "Migration credentials must not be supplied to the runtime",
      });
  });

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      console.error("Error@lumavok: Invalid environment variables:");
      console.error(
        result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          code: issue.code,
        })),
      );
      process.exit(1);
    }
    _env = result.data;
  }
  return _env;
}
