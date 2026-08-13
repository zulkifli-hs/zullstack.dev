"use client";

import { Check, ChevronsUpDown, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { listReferenceOptions, type ReferenceOption } from "@/lib/actions/reference";
import { cn } from "@/lib/utils";

/**
 * Requests in flight, shared by every picker on the page.
 *
 * Several of these mount at once — one per repeater row — and each now needs the
 * list in order to name the value it is holding. Without sharing, a project
 * crediting three partners would fire the same query three times. Dropped as
 * soon as it settles rather than kept as a cache: the "New entry" link opens the
 * other resource in a second tab, and a partner created there has to be able to
 * appear on the next open without a page reload.
 */
const inFlight = new Map<string, Promise<ReferenceOption[]>>();

function loadOptions(relationTo: string): Promise<ReferenceOption[]> {
  const pending = inFlight.get(relationTo);
  if (pending) return pending;

  const request = listReferenceOptions(relationTo);
  inFlight.set(relationTo, request);

  return request.finally(() => inFlight.delete(relationTo));
}

/**
 * Picks one document from another resource.
 *
 * What is stored on the document is an id, and an id is not a name — so the list
 * has to be fetched before this control can say what it is set to. It is fetched
 * when the picker opens and, for a field that already holds a value, on mount.
 *
 * That second case is not an optimisation. Without it the trigger reads as unset
 * for a reference that is in fact saved, and the only way to discover otherwise
 * is to open the dropdown — which is exactly what nobody does to a field that
 * already looks like it needs answering.
 *
 * An empty picker still fetches nothing until it is opened, which is what the
 * lazy load was for: a page of untouched repeater rows costs nothing.
 *
 * The value is reported through `onChange` rather than a hidden input: this
 * control only ever appears inside a form that serialises its rows as JSON.
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

  useEffect(() => {
    // Opened, or holding a value that has no name to show yet.
    if (!open && !value) return;
    if (options || error) return;

    let cancelled = false;

    loadOptions(relationTo).then(
      (next) => {
        if (!cancelled) setOptions(next);
      },
      (reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Could not load options.");
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [open, value, options, error, relationTo]);

  const selected = options?.find((option) => option.id === value);
  const filtered = (options ?? []).filter((option) =>
    option.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  // Every state named. "Empty-looking" was precisely this control's failure, so
  // each reason the label is not a name says which reason it is — including a
  // loaded list that has no match, which means the referenced document was
  // deleted or fell outside the fetch limit. That used to read as "Selected",
  // which hid a broken link behind a reassuring word.
  let label = "Choose…";
  if (value) {
    if (selected) label = selected.label;
    else if (options) label = "Missing entry";
    else if (error) label = "Could not load";
    else label = "Loading…";
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Opening is the retry: clearing the error lets the effect fetch again.
        if (next) setError(null);
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
        <span className={cn("truncate", !selected && "text-muted-foreground")}>{label}</span>
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
