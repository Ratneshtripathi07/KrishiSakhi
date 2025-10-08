"use client";

import { usePathname } from 'next/navigation';
import React from 'react';

export default function HideOnRoutes({ prefixes, children }: { prefixes: string[]; children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const hidden = prefixes.some((p) => pathname.startsWith(p));
  if (hidden) return null;
  return <>{children}</>;
}
