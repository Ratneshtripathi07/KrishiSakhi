"use client";

import { useEffect } from 'react';

export default function PestAlertsRedirect() {
  useEffect(() => { window.location.replace('/alerts'); }, []);
  return null;
}
