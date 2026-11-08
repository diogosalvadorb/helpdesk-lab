"use client";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function PortalLink({
  href,
  children,
  className = "portal-text-button",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Button
      render={<Link href={href} />}
      nativeButton={false}
      role="link"
      variant="ghost"
      className={className}
    >
      {children}
    </Button>
  );
}
