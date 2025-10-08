"use client";

import { useEffect } from 'react';

export default function MandiRedirect() {
  useEffect(() => { window.location.replace('/market-trends'); }, []);
  return null;
}
