"use client";

import React from "react";

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
  size?: 'sm' | 'md';
  variant?: 'ghost' | 'outline' | 'primary';
};

export default function IconButton({ className = '', size = 'sm', variant = 'ghost', children, ...rest }: IconButtonProps) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
  } as const;
  const variants = {
    ghost: 'hover:bg-gray-100',
    outline: 'border hover:border-brand',
    primary: 'bg-brand text-white hover:bg-brand/90',
  } as const;
  return (
    <button className={`inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
