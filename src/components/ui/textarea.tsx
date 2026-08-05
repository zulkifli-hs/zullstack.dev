import { inputBaseClass } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      data-surface="flat"
      className={cn(inputBaseClass, "field-sizing-content min-h-20 resize-y", className)}
      {...props}
    />
  );
}
