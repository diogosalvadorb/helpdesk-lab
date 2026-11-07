import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function AuthInput({
  className,
  ...props
}: ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      className={cn(
        "border-auth-border bg-auth-card text-auth-input-foreground placeholder:text-auth-placeholder focus-visible:border-auth-primary focus-visible:ring-auth-primary/50 aria-invalid:border-auth-destructive dark:bg-auth-card dark:aria-invalid:border-auth-destructive h-10.75 w-full rounded-md px-3 py-2.5 text-xs shadow-none md:text-xs",
        className,
      )}
    />
  );
}
