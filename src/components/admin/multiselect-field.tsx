"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Several values from a fixed set, as toggleable chips.
 *
 * Chips rather than a multi-`<select>` because the whole vocabulary is short
 * and worth seeing at once — the editor is answering "what did this cover?",
 * which is easier to answer against a visible list than a collapsed one.
 *
 * Each selected option submits its own hidden input under the same name, so the
 * server reads it with `formData.getAll(name)` and no encoding is invented.
 */
export function MultiSelectField({
  name,
  options,
  value,
}: {
  name: string;
  options: readonly string[];
  value?: string[];
}) {
  const [selected, setSelected] = useState<string[]>(() =>
    Array.isArray(value) ? value.filter((entry) => options.includes(entry)) : [],
  );

  function toggle(option: string) {
    setSelected((current) =>
      current.includes(option)
        ? current.filter((entry) => entry !== option)
        : // Keep the descriptor's order rather than click order, so the chips
          // and everything rendered from them stay stable across edits.
          options.filter((entry) => entry === option || current.includes(entry)),
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {selected.map((option) => (
        <input key={option} type="hidden" name={name} value={option} />
      ))}

      {options.map((option) => {
        const active = selected.includes(option);

        return (
          <button
            key={option}
            type="button"
            role="checkbox"
            aria-checked={active}
            onClick={() => toggle(option)}
            className={cn(
              "border-hairline inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs transition-colors",
              active
                ? "border-signal/40 bg-signal/10 text-signal"
                : "text-muted-foreground hover:border-ring hover:text-foreground",
            )}
          >
            {active && <Check className="size-3" />}
            {option}
          </button>
        );
      })}
    </div>
  );
}
