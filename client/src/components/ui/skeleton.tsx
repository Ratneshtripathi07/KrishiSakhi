'use client';

import React from 'react';

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'text' | 'card' | 'circle';
  width?: number | string;
  height?: number | string;
};

export default function Skeleton({ variant = 'text', width, height, className = '', style, ...rest }: SkeletonProps) {
  const base = 'animate-pulse bg-gray-200/90 dark:bg-gray-700/40';
  const radius = variant === 'circle' ? 'rounded-full' : 'rounded-md';
  const dims: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style,
  };
  let defaultDims: React.CSSProperties = {};
  if (!width || !height) {
    if (variant === 'text') defaultDims = { width: '100%', height: '0.9rem' };
    if (variant === 'card') defaultDims = { width: '100%', height: '6rem' };
    if (variant === 'circle') defaultDims = { width: 40, height: 40 };
  }
  return <div className={`${base} ${radius} ${className}`} style={{ ...defaultDims, ...dims }} aria-busy="true" aria-hidden="true" {...rest} />;
}
