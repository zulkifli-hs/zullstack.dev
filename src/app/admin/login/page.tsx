import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/brand/logo";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Logo className="h-9" priority />

        <h1 className="mt-8 text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Content management for zullstack.dev.
        </p>

        <LoginForm />
      </div>
    </main>
  );
}
