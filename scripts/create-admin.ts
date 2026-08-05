/**
 * Creates the single CMS admin account.
 *
 *   pnpm create-admin -- --email you@example.com --name "Zulkifli"
 *
 * Public sign-up is disabled in `auth.ts`, so this script is the only way an
 * account comes into existence. The password is read from stdin rather than
 * argv so it never lands in shell history or the process list.
 */
import { config } from "dotenv";
import { createInterface } from "node:readline/promises";
import mongoose from "mongoose";

config({ path: [".env.local", ".env"] });

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(`--${flag}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const email = arg("email");
  const name = arg("name") ?? "Admin";

  if (!email) {
    console.error('Usage: pnpm create-admin -- --email you@example.com --name "Your Name"');
    process.exit(1);
  }

  if (!process.env.BETTER_AUTH_SECRET) {
    console.error(
      "BETTER_AUTH_SECRET is not set in .env.local.\nGenerate one with:  openssl rand -base64 32",
    );
    process.exit(1);
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const password = await rl.question("Password (min 12 chars): ");
  rl.close();

  if (password.length < 12) {
    console.error("\nPassword must be at least 12 characters.");
    process.exit(1);
  }

  // Opens the sign-up path for this process only. `auth.ts` reads this at
  // module load, so it must be set before the dynamic import below — and it is
  // never present in the deployed environment.
  process.env.ALLOW_ADMIN_SIGNUP = "true";

  // Imported after dotenv so the adapter sees MONGODB_URI.
  const { getAuth } = await import("../src/lib/auth");
  const auth = await getAuth();

  try {
    // Goes through Better Auth rather than inserting directly, so the password
    // is hashed with the same parameters the sign-in path verifies against.
    await auth.api.signUpEmail({ body: { email, password, name } });
    console.log(`\nAdmin created: ${email}`);
    console.log("Sign in at /admin/login");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/exist/i.test(message)) {
      console.error(`\nAn account already exists for ${email}.`);
    } else {
      console.error(`\nFailed to create admin: ${message}`);
    }
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
