"use client";

import { Eye, EyeOff } from "lucide-react";
import { type ComponentProps, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { AuthInput } from "./auth-input";

export default function PasswordInput(props: ComponentProps<typeof AuthInput>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <AuthInput
        {...props}
        className={cn("pr-12", props.className)}
        type={visible ? "text" : "password"}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={props.disabled}
        className="text-auth-subtle absolute top-1.75 right-2 size-6.75 rounded-md p-1.25 hover:bg-transparent"
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visible}
        aria-controls={props.id}
        onClick={() => setVisible(!visible)}
      >
        {visible ? (
          <EyeOff className="size-4.25" strokeWidth={1} aria-hidden="true" />
        ) : (
          <Eye className="size-4.25" strokeWidth={1} aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}
