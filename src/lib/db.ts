import mongoose from "mongoose";

/**
 * Read lazily, never captured at module scope.
 *
 * A module-scope `const MONGODB_URI = process.env.MONGODB_URI` is evaluated the
 * moment this file is first imported, which loses any value loaded afterwards —
 * exactly what happens in a standalone script that calls dotenv itself.
 */
const uri = () => process.env.MONGODB_URI;

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

/**
 * The connection is cached on `globalThis`, not in a module variable.
 *
 * Next's dev server reloads modules on every edit, so a module-scoped variable
 * would open a fresh pool per reload and exhaust the server's connection limit
 * within a few minutes of editing. In production only the module instance is
 * used, but serverless instances are ephemeral, so the cache still saves a
 * handshake on warm invocations. This pattern is unchanged in 2026.
 */
const globalCache = globalThis as typeof globalThis & { _mongoose?: MongooseCache };
const cached: MongooseCache = (globalCache._mongoose ??= { conn: null, promise: null });

/**
 * Whether a database has been configured at all.
 *
 * A fresh clone with no `.env.local` should still build and render empty states
 * rather than crashing the build — but this is deliberately narrow: it is only
 * true when `MONGODB_URI` is *absent*. A URI that is present but unreachable
 * still throws, so a real production misconfiguration cannot hide behind an
 * empty page.
 */
export function isDatabaseConfigured(): boolean {
  return Boolean(uri());
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  const connectionString = uri();
  if (!connectionString) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.");
  }

  cached.promise ??= mongoose.connect(connectionString, {
    // Serverless functions each hold their own pool; keeping it small avoids
    // blowing past Atlas's 500-connection ceiling under any real traffic.
    maxPoolSize: 10,
    // Fail fast instead of silently queueing operations against a dead
    // connection until the request times out with no useful error.
    bufferCommands: false,
    serverSelectionTimeoutMS: 10_000,
  });

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Clear the rejected promise so the next request retries rather than
    // re-awaiting a permanently failed connection.
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

/**
 * The native driver handles behind Mongoose's connection.
 *
 * Better Auth's adapter wants a `Db` (and a `MongoClient` for transactions),
 * while Mongoose owns the pool. Reaching through the existing connection means
 * one pool serves both, instead of the app opening two.
 */
export async function getMongoClient() {
  const conn = await connectDB();
  return conn.connection.getClient();
}

export async function getDb() {
  const conn = await connectDB();
  const db = conn.connection.db;
  if (!db) throw new Error("Mongoose connected but exposed no database handle.");
  return db;
}
