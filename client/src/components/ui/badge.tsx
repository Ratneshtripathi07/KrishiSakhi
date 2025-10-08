"use client";

import React from 'react';

type Variant = 'default' | 'info' | 'warning' | 'critical';

export function Badge({ variant = 'default', className = '', children }: { variant?: Variant; className?: string; children: React.ReactNode }) {
  const base = 'inline-flex items-center rounded-full border px-2 py-0.5 text-xs';
  const styleMap: Record<Variant, string> = {
    default: 'bg-gray-100 text-gray-800 border-gray-300',
    info: 'bg-sky-100 text-sky-800 border-sky-300',
    warning: 'bg-amber-100 text-amber-800 border-amber-300',
    critical: 'bg-red-100 text-red-800 border-red-300',
  };
  return <span className={`${base} ${styleMap[variant]} ${className}`}>{children}</span>;
}