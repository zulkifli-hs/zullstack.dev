"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await signOut();
        // `refresh` clears the cached RSC payload; without it the admin shell
        // can briefly render again from cache after the cookie is gone.
        router.push("/admin/login");
        router.refresh();
      }}
    >
      <LogOut className="size-4" />
      Sign out
    </Button>
  );
}
