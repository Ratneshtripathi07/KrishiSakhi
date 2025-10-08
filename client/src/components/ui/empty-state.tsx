"use client";

import React from "react";

export type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
};

export default function EmptyState({ title, description, icon, className = "" }: EmptyStateProps) {
  return (
    <div className={`rounded-md border p-3 text-sm text-gray-600 ${className}`}>
      <div className="flex items-start gap-2">
        {icon}
        <div>
          <div className="font-medium">{title}</div>
          {description && <div className="text-xs text-gray-500">{description}</div>}
        </div>
      </div>
    </div>
  );
}
