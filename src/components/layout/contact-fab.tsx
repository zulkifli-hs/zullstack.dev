"use client";

import { MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";

import { ContactMenu } from "@/components/layout/contact-menu";
import { Button } from "@/components/ui/button";
import type { ContactChannel } from "@/lib/contact";

/**
 * Floating contact button, mobile only.
 *
 * Detached from the tab bar rather than being a sixth tab, which is Apple's own
 * answer for an action that belongs near navigation: the tab bar stays purely
 * destinations, and floating `glassEffect` buttons carry actions beside it —
 * the same shape iOS 26 uses for its separated search affordance.
 *
 * Sits above the tab capsule and opens upward. On desktop the capsule's
 * "Get in touch" pill opens the identical surface.
 */
export function ContactFab({ channels }: { channels: ContactChannel[] }) {
  const t = useTranslations("contact");
  if (channels.length === 0) return null;

  return (
    <div className="fixed right-4 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.25rem)] z-50 lg:hidden">
      <ContactMenu
        channels={channels}
        align="end"
        side="top"
        trigger={
          <Button
            variant="glassProminent"
            size="icon-lg"
            aria-label={t("cta")}
            className="size-12 [--surface-radius:9999px]"
          >
            <MessageSquare className="size-5" />
          </Button>
        }
      />
    </div>
  );
}
