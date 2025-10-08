'use client';

import React from 'react';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

function classes(variant: Variant, size: Size) {
  const base = 'inline-flex items-center justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors';
  const sizes: Record<Size, string> = {
    sm: 'px-2.5 py-1 text-sm',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };
  const variants: Record<Variant, string> = {
    primary: 'bg-brand text-white hover:bg-brand/90 disabled:opacity-50',
    outline: 'border hover:border-brand disabled:opacity-50 dark:border-gray-700',
    ghost: 'hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-[#222]',
  };
  return `${base} ${sizes[size]} ${variants[variant]}`;
}

export type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> & {
  href?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
};

export default function Button({ href, variant = 'primary', size = 'md', className = '', children, ...rest }: ButtonProps) {
  const cls = `${classes(variant, size)} ${className}`;
  if (href) {
    return (
      <a href={href} className={cls} {...(rest as any)}>
        {children}
      </a>
    );
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
