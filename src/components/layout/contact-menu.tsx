"use client";

import { Mail, MessageCircle, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ContactChannel } from "@/lib/contact";
import { cn } from "@/lib/utils";

const ICONS = {
  email: Mail,
  whatsapp: MessageCircle,
} as const;

/**
 * The contact surface, opened from two places: the desktop capsule's pill and
 * the mobile floating button.
 *
 * One component with two triggers rather than two implementations — the channel
 * list, its labels and its ordering are the kind of thing that silently drifts
 * apart when duplicated, and the drift is invisible until a client uses the
 * stale one.
 */
export function ContactMenu({
  channels,
  trigger,
  align = "end",
  side,
}: {
  channels: ContactChannel[];
  trigger: ReactElement;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
}) {
  const t = useTranslations("contact");
  if (channels.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger render={trigger} />
      <PopoverContent align={align} side={side} className="w-72">
        <p className="text-sm font-medium">{t("title")}</p>
        <p className="text-muted-foreground mt-1 text-xs">{t("hint")}</p>

        <div className="mt-4 flex flex-col gap-1">
          {channels.map((channel) => {
            const Icon = ICONS[channel.id];
            return (
              <a
                key={channel.id}
                href={channel.href}
                target={channel.id === "whatsapp" ? "_blank" : undefined}
                rel={channel.id === "whatsapp" ? "noopener noreferrer" : undefined}
                className={cn(
                  "rounded-concentric lift flex items-center gap-3 px-3 py-2.5 text-left",
                  "hover:bg-secondary/50 transition-colors",
                  "focus-visible:inset-ring-2 focus-visible:inset-ring-ring focus-visible:outline-none",
                )}
              >
                <Icon className="text-signal size-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{t(channel.id)}</span>
                  <span className="text-muted-foreground block truncate font-mono text-xs">
                    {channel.detail}
                  </span>
                </span>
                <Send className="text-muted-foreground ml-auto size-3.5 shrink-0" />
              </a>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
