import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";

import { connectDB } from "./db";

/**
 * Auth for a single-admin CMS.
 *
 * Better Auth rather than NextAuth: Auth.js was handed to the Better Auth team
 * in Sept 2025 and is in maintenance mode, and its v5 never left beta.
 *
 * The adapter is given the native `Db` from Mongoose's own connection rather
 * than a second MongoClient, so one pool serves both CMS content (Mongoose
 * models) and the auth collections (native driver).
 *
 * Built lazily behind a memoised promise instead of a top-level `await`:
 * module-scope await forces every importer to be ESM, which breaks the
 * `tsx`-run CLI scripts that need this module.
 */
async function build() {
  const conn = await connectDB();

  const db = conn.connection.db;
  if (!db) throw new Error("Mongoose connected but exposed no database handle.");

  return betterAuth({
    database: mongodbAdapter(db, {
      client: conn.connection.getClient(),
      /**
       * Transactions require a replica set. Atlas clusters are replica sets,
       * but a standalone local `mongod` is not and will error the moment
       * Better Auth opens one — hence the switch rather than a hardcoded true.
       */
      transaction: process.env.MONGODB_TRANSACTIONS !== "false",
    }),

    emailAndPassword: {
      enabled: true,
      /**
       * Sign-up is closed on the web. There is exactly one admin, and leaving
       * registration open would let anyone create a CMS account.
       *
       * `pnpm create-admin` sets ALLOW_ADMIN_SIGNUP in its own process before
       * importing this module, which is the only path that can create the
       * account. The variable is never set in the deployed environment, so the
       * HTTP sign-up endpoint stays permanently closed.
       */
      disableSignUp: process.env.ALLOW_ADMIN_SIGNUP !== "true",
      minPasswordLength: 12,
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 60 * 5 },
    },

    // Must be last: it forwards Set-Cookie from Server Actions, without which
    // signing in from a Server Action appears to succeed but sets no session.
    plugins: [nextCookies()],
  });
}

/** Inferred from `build` so the adapter's narrowed option type is preserved. */
type Auth = Awaited<ReturnType<typeof build>>;

let cached: Promise<Auth> | null = null;

export function getAuth(): Promise<Auth> {
  cached ??= build();
  return cached;
}
