"use client";

import React from "react";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  className?: string;
};

export default function Label({ className = "", children, ...rest }: LabelProps) {
  return (
    <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${className}`} {...rest}>
      {children}
    </label>
  );
}
