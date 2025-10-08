"use client";

import { useEffect } from 'react';

export default function NotificationsRedirect() {
  useEffect(() => { window.location.replace('/alerts'); }, []);
  return null;
}
