'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n';

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t bg-white/90 dark:bg-[#121212] dark:border-gray-800 mt-8">
      <div className="mx-auto w-full px-4 py-8">
        {/* Top sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. Quick Links */}
          <div>
            <h3 className="text-base font-semibold mb-3">{t('quick_links') || 'Quick Links'}</h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li><a href="#about" className="hover:underline">{t('about_platform') || 'About the Platform'}</a></li>
              <li><a href="#features" className="hover:underline">{t('features_how_it_works') || 'Features / How it Works'}</a></li>
              <li><a href="/schemes" className="hover:underline">{t('govt_schemes') || 'Government Scheme Info'}</a></li>
              <li><a href="/feedback" className="hover:underline">{t('contact_us') || 'Contact Us'}</a></li>
            </ul>
          </div>

          {/* 2. Trust & Credibility */}
          <div>
            <h3 className="text-base font-semibold mb-3">{t('trust_credibility') || 'Trust & Credibility'}</h3>
            <div className="flex items-center gap-3">
              <div className="rounded-md border px-2 py-1 text-xs text-gray-700 dark:text-gray-300">Govt of India</div>
              <div className="rounded-md border px-2 py-1 text-xs text-gray-700 dark:text-gray-300">Govt of Kerala</div>
            </div>
          </div>

          {/* 3. Help & Support */}
          <div>
            <h3 className="text-base font-semibold mb-3">{t('help_support') || 'Help & Support'}</h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>{t('helpline') || 'Helpline: 1800-000-0000'}</li>
              <li><a className="hover:underline" href="https://wa.me/919876543210" target="_blank" rel="noreferrer">{t('whatsapp_bot') || 'WhatsApp / Chatbot'}</a></li>
              <li><a className="hover:underline" href="/feedback">{t('faqs') || 'FAQs'}</a></li>
            </ul>
          </div>

        </div>

        {/* 5. Legal */}
        <div className="mt-6">
          <h3 className="text-base font-semibold mb-2">{t('legal') || 'Legal'}</h3>
          <ul className="text-sm text-gray-700 dark:text-gray-300 flex flex-wrap gap-4">
            <li><a className="hover:underline" href="/settings">{t('terms') || 'Terms & Conditions'}</a></li>
            <li><a className="hover:underline" href="/settings">{t('privacy') || 'Privacy Policy'}</a></li>
          </ul>
        </div>

        {/* Bottom strip */}
        <div className="mt-8 border-t pt-4 text-center text-sm text-gray-700 dark:text-gray-300">
          <div>{t('powered_by') || 'Powered by AI with support from Agriculture Department, Govt. Of India'}</div>
          <div className="mt-1 font-mono text-xs opacity-75">------ Team Innov8 -------</div>
        </div>
      </div>
    </footer>
  );
}
