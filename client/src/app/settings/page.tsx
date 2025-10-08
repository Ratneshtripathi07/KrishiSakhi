"use client";

import React from "react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useDataSaver } from "@/lib/dataSaver";
import CardHeaderTitle from "@/components/ui/card-header-title";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import Select from "@/components/ui/select";
import Label from "@/components/ui/label";
import Button from "@/components/ui/button";
import { Sun, Moon, Gauge, Globe } from "lucide-react";
import { supportedLocales } from "@/lib/i18n";

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const { mode, toggle, setMode } = useTheme();
  const { enabled: dataSaver, setEnabled } = useDataSaver();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t('settings') || 'Settings'}</h1>

      <Card>
        <CardHeader>
          <CardHeaderTitle icon={<Globe className="w-5 h-5 text-emerald-700" aria-hidden="true" />} title={t('language') || 'Language'} />
        </CardHeader>
        <CardContent>
          <div className="max-w-sm">
            <Label>{t('language') || 'Language'}</Label>
            <Select value={locale} onChange={(e) => setLocale((e.target as HTMLSelectElement).value as any)}>
              {supportedLocales.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardHeaderTitle icon={<Gauge className="w-5 h-5 text-emerald-700" aria-hidden="true" />} title={t('data_saver') || 'Data Saver'} />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setEnabled(!dataSaver)}>
              {dataSaver ? (t('data_saver_on') || 'Data Saver: ON') : (t('data_saver_off') || 'Data Saver: OFF')}
            </Button>
            <div className="text-sm text-gray-600">{t('data_saver_note') || 'Reduce chart points and hide effects to save data.'}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardHeaderTitle icon={mode === 'dark' ? <Moon className="w-5 h-5 text-emerald-700" aria-hidden="true" /> : <Sun className="w-5 h-5 text-emerald-700" aria-hidden="true" />} title={t('theme') || 'Theme'} />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Button variant={mode === 'light' ? 'primary' : 'outline'} onClick={() => setMode('light')}>{t('light') || 'Light'}</Button>
            <Button variant={mode === 'dark' ? 'primary' : 'outline'} onClick={() => setMode('dark')}>{t('dark') || 'Dark'}</Button>
            <Button variant="outline" onClick={toggle}>{t('toggle') || 'Toggle'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
