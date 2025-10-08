"use client";

import React from "react";
import Label from "@/components/ui/label";

export type FormFieldProps = {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export default function FormField({ label, htmlFor, hint, error, children, className = "" }: FormFieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <div className="text-xs text-gray-500">{hint}</div>}
      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  );
}
