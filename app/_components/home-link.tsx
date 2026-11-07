"use client";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
export function HomeLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Button
      render={<Link href={href} />}
      nativeButton={false}
      role="link"
      className={className}
    >
      {children}
    </Button>
  );
}
