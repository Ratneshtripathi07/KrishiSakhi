"use client";

import React from "react";
import { CardTitle } from "@/components/ui/card";

export type CardHeaderTitleProps = {
  icon?: React.ReactNode;
  title: React.ReactNode;
  className?: string;
  iconClassName?: string;
};

export default function CardHeaderTitle({ icon, title, className = "", iconClassName = "" }: CardHeaderTitleProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {icon}
      <CardTitle>{title}</CardTitle>
    </div>
  );
}
