import { ChevronDown } from "lucide-react";

import { inputBaseClass } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Native `<select>` styled to match the field vocabulary.
 *
 * Kept native rather than rebuilt on Base UI's Select: every call site posts
 * plain `FormData`, the admin is behind auth, and the native control brings
 * correct mobile pickers and keyboard behaviour for 0 KB.
 *
 * `appearance-none` is what stops the OS chrome from fighting the styling; the
 * chevron is ours, and `pointer-events-none` keeps clicks going to the select.
 */
export function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="native-select"
        data-surface="flat"
        className={cn(inputBaseClass, "appearance-none pr-9", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
      />
    </div>
  );
}
