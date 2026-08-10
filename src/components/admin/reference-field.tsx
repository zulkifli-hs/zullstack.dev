"use client";

import { Check, ChevronsUpDown, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { listReferenceOptions, type ReferenceOption } from "@/lib/actions/reference";
import { cn } from "@/lib/utils";

/**
 * Picks one document from another resource.
 *
 * Options load on first open rather than with the page. A `reference` sits
 * inside a repeater row, so a project with five partners would otherwise fetch
 * and ship the same option list five times before the editor touches any of it.
 *
 * The value is reported through `onChange` rather than a hidden input: this
 * control only ever appears inside a repeater, which serialises its whole array
 * as one JSON blob.
 */
export function ReferenceField({
  value,
  relationTo,
  onChange,
}: {
  value?: string;
  relationTo: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ReferenceOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function load() {
    if (options) return;
    setError(null);
    try {
      setOptions(await listReferenceOptions(relationTo));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load options.");
    }
  }

  const selected = options?.find((option) => option.id === value);
  const filtered = (options ?? []).filter((option) =>
    option.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void load();
      }}
    >
      <PopoverTrigger
        render={
          <button
            type="button"
            className="border-hairline hover:border-ring flex h-9 w-full items-center justify-between gap-2 rounded-lg border px-3 text-left text-sm transition-colors"
          />
        }
      >
        <span className={cn("truncate", !value && "text-muted-foreground")}>
          {/* Before the list loads there is nothing to resolve the stored id
              against, so an already-set value reads as "selected" rather than
              flashing as empty and looking unsaved. */}
          {selected?.label ?? (value ? "Selected" : "Choose…")}
        </span>
        <ChevronsUpDown className="text-muted-foreground size-3.5 shrink-0" />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-72 p-2">
        <Input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search…"
          className="mb-2 h-8"
        />

        {error && (
          <p role="alert" className="text-destructive px-2 py-1.5 text-xs">
            {error}
          </p>
        )}

        {!options && !error && (
          <p className="text-muted-foreground flex items-center gap-2 px-2 py-3 text-xs">
            <Loader2 className="size-3.5 animate-spin" />
            Loading…
          </p>
        )}

        {options && filtered.length === 0 && (
          <p className="text-muted-foreground px-2 py-3 text-xs">No matches.</p>
        )}

        <ul className="max-h-64 overflow-y-auto">
          {filtered.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
                className="hover:bg-secondary/40 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors"
              >
                {option.logoUrl ? (
                  // Plain <img>: an admin preview of an arbitrary remote asset,
                  // which next/image would require in remotePatterns first.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={option.logoUrl} alt="" className="size-5 shrink-0 object-contain" />
                ) : (
                  <span className="bg-secondary size-5 shrink-0 rounded" />
                )}
                <span className="truncate">{option.label}</span>
                {option.id === value && <Check className="text-signal ml-auto size-3.5" />}
              </button>
            </li>
          ))}
        </ul>

        <div className="border-hairline mt-2 border-t pt-2">
          <Button
            variant="ghost"
            size="xs"
            className="w-full justify-start"
            render={<Link href={`/admin/${relationTo}/new`} target="_blank" />}
          >
            <ExternalLink className="size-3.5" />
            New entry
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
