"use client";

import React from "react";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  className?: string;
};

const base =
  "w-full rounded-md border px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50 bg-white text-gray-900 border-gray-300 dark:bg-[#1E1E1E] dark:text-gray-100 dark:border-gray-700";

export default function Textarea({ className = "", ...rest }: TextareaProps) {
  return <textarea className={`${base} ${className}`} {...rest} />;
}
