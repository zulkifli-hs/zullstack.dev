"use client";

import { useTranslations } from "next-intl";

import { ContactMenu } from "@/components/layout/contact-menu";
import { Button } from "@/components/ui/button";
import type { ContactChannel } from "@/lib/contact";

/**
 * The capsule's right-hand CTA — the "Get Started" / "Sign up" position in the
 * reference designs, pointed at the thing this site exists to produce.
 */
export function ContactCta({
  channels,
  className,
}: {
  channels: ContactChannel[];
  className?: string;
}) {
  const t = useTranslations("contact");

  return (
    <ContactMenu
      channels={channels}
      align="end"
      trigger={
        <Button variant="glassProminent" size="lg" className={className}>
          {t("cta")}
        </Button>
      }
    />
  );
}
