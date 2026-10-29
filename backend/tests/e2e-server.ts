/** Local test process. Provider responses are synthetic; Express, Prisma,
 * PostgreSQL, RLS, migrations and image encoding are the real implementation. */
import { createRequire } from "node:module";
import crypto from "node:crypto";
import express from "express";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
const require = createRequire(import.meta.url);
const {
  setup,
} = require("../../database/tests/helpers.cjs");
if (
  process.env.NODE_ENV === "production" ||
  process.env.LUMAVOK_E2E_FIXTURE !== "1"
)
  throw new Error("Explicit local fixture flag required");
const db = await setup(false, PGlite);
const accounts = [
  {
    name: "Seller One",
    email: "seller@example.test",
    app: "u1",
    id: "00000000-0000-4000-8000-000000000001",
  },
  {
    name: "Seller Two",
    email: "second@example.test",
    app: "u2",
    id: "00000000-0000-4000-8000-000000000002",
  },
  {
    name: "Test Buyer",
    email: "buyer@example.test",
    app: "buyer",
    id: "00000000-0000-4000-8000-000000000003",
  },
  {
    name: "Test Admin",
    email: "admin@example.test",
    app: "admin",
    id: "00000000-0000-4000-8000-000000000004",
  },
  {
    name: "Test Applicant",
    email: "applicant@example.test",
    app: "applicant",
    id: "00000000-0000-4000-8000-000000000005",
  },
];
await db.exec(`BEGIN;SELECT set_config('lumavok.role','ADMIN',true);
INSERT INTO auth.users VALUES('${accounts[2].id}'),('${accounts[3].id}'),('${accounts[4].id}');
UPDATE public."user" SET auth_user_id='${accounts[2].id}',full_name='Test Buyer' WHERE id='buyer';
INSERT INTO public."user"(id,email,password_hash,role,auth_user_id,full_name)VALUES('admin','admin@example.test','unusable','ADMIN','${accounts[3].id}','Test Admin'),('applicant','applicant@example.test','unusable','USER','${accounts[4].id}','Test Applicant');
UPDATE public.property SET price=45000000,address='Zone du Bois',bedrooms=3 WHERE id='p1';
UPDATE public.property_translation SET title=CASE WHEN language_code='fr' THEN 'Maison à Ouagadougou' ELSE 'House in Ouagadougou' END,description=CASE WHEN language_code='fr' THEN 'Maison familiale avec jardin à Ouagadougou.' ELSE 'Family house with a garden in Ouagadougou.' END WHERE property_id='p1';
UPDATE public.property_media SET url='/test-fixture.svg' WHERE property_id='p1';
UPDATE public.property_developer SET business_name='Agence Faso',source_language_code='fr',city_id='c1',public_email='contact@example.test',phone_number='+22670000000',whatsapp_number='+22670000000' WHERE id='dev1';
INSERT INTO public.property_developer_translation(developer_id,language_code,bio)VALUES('dev1','fr','Une agence locale au service des acheteurs et des locataires au Burkina Faso.'),('dev1','en','A local agency serving buyers and tenants in Burkina Faso.');
INSERT INTO public.feature(id,feature_name,code,source_language_code)VALUES('f1','Garage','garage','fr');INSERT INTO public.feature_translation(feature_id,language_code,name)VALUES('f1','fr','Garage'),('f1','en','Garage');
CREATE SCHEMA fixture;CREATE FUNCTION fixture.session(sid uuid,enabled boolean) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ BEGIN IF enabled THEN INSERT INTO auth.sessions(id,user_id)VALUES(sid,sid) ON CONFLICT DO NOTHING;ELSE DELETE FROM auth.sessions s WHERE s.id=sid;END IF;RETURN true;END $$;
GRANT USAGE ON SCHEMA fixture TO lumavok_runtime;REVOKE EXECUTE ON FUNCTION fixture.session(uuid,boolean) FROM PUBLIC;GRANT EXECUTE ON FUNCTION fixture.session(uuid,boolean) TO lumavok_runtime;COMMIT;`);
for (const a of accounts)
  await db.query("INSERT INTO auth.sessions(id,user_id)VALUES($1,$1)", [a.id]);
await db.exec("SET ROLE lumavok_runtime");
const pg = new PGLiteSocketServer({ db, host: "127.0.0.1", port: 55439 });
await pg.start();
Object.assign(process.env, {
  NODE_ENV: "test",
  DATABASE_URL:
    "postgresql://lumavok_runtime@127.0.0.1:55439/postgres?connection_limit=1&sslmode=disable",
  SUPABASE_URL: "http://localhost:3000/api/v1/test-provider",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fixture_only",
  SUPABASE_STORAGE_KEY: "fixture_storage_only",
  CORS_ORIGIN: "http://localhost:3000",
  AUTH_REDIRECT_URL: "http://localhost:3000/reset-password",
});
delete process.env.DIRECT_URL;
const active = new Set(accounts.map((a) => a.id)),
  assets = new Map<string, Buffer>(),
  tokens = new Map<string, (typeof accounts)[number]>();
const password = "FixturePassword123!";
const user = (a: (typeof accounts)[number]) => ({
  id: a.id,
  email: a.email,
  email_confirmed_at: "2026-01-01T00:00:00Z",
  aud: "authenticated",
  role: "authenticated",
  user_metadata: { full_name: a.name, role: "ADMIN" },
});
function session(a: (typeof accounts)[number]) {
  const token =
    [
      { alg: "HS256", typ: "JWT" },
      {
        sub: a.id,
        session_id: a.id,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      },
    ]
      .map((x) => Buffer.from(JSON.stringify(x)).toString("base64url"))
      .join(".") +
    "." +
    Buffer.from("synthetic-signature").toString("base64url");
  tokens.set(token, a);
  return {
    access_token: token,
    refresh_token: "fixture-refresh-" + a.app,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: user(a),
  };
}
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: any, init: any) => {
  const url = String(input);
  if (!url.includes("/test-provider/")) return originalFetch(input, init);
  const u = new URL(url),
    method = init?.method ?? "GET",
    authorization =
      new Headers(init?.headers)
        .get("authorization")
        ?.replace(/^Bearer /, "") ?? "",
    actor = tokens.get(authorization);
  if (u.pathname.includes("/auth/v1/")) {
    const data = init?.body ? JSON.parse(String(init.body)) : {};
    if (u.pathname.endsWith("/token")) {
      const refresh = u.searchParams.get("grant_type") === "refresh_token",
        a = refresh
          ? accounts.find(
              (a) => "fixture-refresh-" + a.app === data.refresh_token,
            )
          : accounts.find(
              (a) => a.email === data.email && data.password === password,
            );
      if (!a || (refresh && !active.has(a.id)))
        return json(
          { code: "invalid_credentials", msg: "Invalid email or password" },
          400,
        );
      if (!refresh) {
        active.add(a.id);
        await prisma.$queryRaw`SELECT fixture.session(${a.id}::uuid,true)`;
      }
      return json(session(a));
    }
    if (u.pathname.endsWith("/user") && actor && active.has(actor.id))
      return json(user(actor));
    if (u.pathname.endsWith("/logout") && actor) {
      active.delete(actor.id);
      await prisma.$queryRaw`SELECT fixture.session(${actor.id}::uuid,false)`;
      return json({});
    }
    if (u.pathname.endsWith("/signup"))
      return json({
        id: crypto.randomUUID(),
        email: data.email,
        identities: [],
      });
    if (u.pathname.endsWith("/recover")) return json({});
    if (u.pathname.endsWith("/verify"))
      return data.token_hash === "fixture-recovery-token"
        ? json(session(accounts[2]))
        : json({ code: "otp_expired", msg: "Expired" }, 403);
    return json({ code: "bad_jwt", msg: "Invalid JWT" }, 401);
  }
  const part = u.pathname.split("/storage/v1/")[1] ?? "";
  if (part.startsWith("object/list/")) {
    const d = JSON.parse(String(init.body)),
      prefix = d.prefix + "/";
    return json(
      [...assets.keys()]
        .filter(
          (k) =>
            k.startsWith(prefix) &&
            k.slice(prefix.length).includes(d.search ?? ""),
        )
        .map((k) => ({
          name: k.slice(prefix.length),
          id: k,
          metadata: { mimetype: "image/webp" },
        })),
    );
  }
  if (part.startsWith("object/sign/property-media/"))
    return json({
      signedURL:
        "/object/sign/property-media/" +
        part.split("object/sign/property-media/")[1] +
        "?token=fixture",
    });
  if (part.startsWith("object/property-media/") && method === "POST") {
    const key = decodeURIComponent(part.split("object/property-media/")[1]);
    assets.set(key, Buffer.from(init.body));
    return json({ Key: "property-media/" + key, Id: crypto.randomUUID() });
  }
  if (part === "object/property-media" && method === "DELETE") {
    for (const k of JSON.parse(String(init.body)).prefixes) assets.delete(k);
    return json([]);
  }
  return json({ error: "Unsupported fixture request" }, 400);
};
const { createApp } = await import("../src/app.js");
const { prisma } = await import("../src/config/prisma.js");
const app = express();
app.get(
  "/api/v1/test-provider/storage/v1/object/sign/property-media/*objectPath",
  (req, res) => {
    const objectPath = req.params.objectPath;
    const key = Array.isArray(objectPath)
      ? objectPath.join("/")
      : String(objectPath);
    const bytes = assets.get(key);
    if (!bytes) return res.sendStatus(404);
    res.type("image/webp").send(bytes);
  },
);
app.use(createApp({ authRateLimit: 10000 }));
const server = app.listen(4100, "127.0.0.1", () =>
  console.log("Isolated E2E API ready on 4100"),
);
async function close() {
  server.close();
  globalThis.fetch = originalFetch;
  await prisma.$disconnect();
  await pg.stop();
  await db.close();
  process.exit(0);
}
process.once("SIGTERM", () => void close());
process.once("SIGINT", () => void close());
