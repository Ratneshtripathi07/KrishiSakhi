"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Home, Bug, LineChart, MessageSquare } from "lucide-react";
import { useI18n } from '@/lib/i18n';
import { label } from '@/lib/labels';

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <a href={href} className={`flex flex-col items-center justify-center flex-1 py-2 ${active ? 'text-brand dark:text-brand-light' : 'text-gray-600 dark:text-gray-300'} hover:text-brand dark:hover:text-brand-light`}>
      <div className="w-6 h-6">{icon}</div>
      <div className="text-[11px] mt-1">{label}</div>
    </a>
  );
}

export default function BottomNav() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const { t } = useI18n();
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-white/90 dark:bg-[#121212] backdrop-blur md:hidden">
      <div className="mx-auto max-w-3xl grid grid-cols-4">
        <NavItem href="/" icon={<Home className="w-6 h-6" />} label={t('home') || 'Home'} active={pathname === '/'} />
<NavItem href="/pest-detection" icon={<Bug className="w-6 h-6" />} label={label(t, 'pest_check')} active={pathname.startsWith('/pest-detection')} />
<NavItem href="/market-trends" icon={<LineChart className="w-6 h-6" />} label={label(t, 'market_trends')} active={pathname.startsWith('/market-trends')} />
<NavItem href="/chat" icon={<MessageSquare className="w-6 h-6" />} label={label(t, 'ask_question')} active={pathname.startsWith('/chat')} />
      </div>
    </nav>
  );
}
