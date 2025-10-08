"use client";

import React from "react";
import { Cpu, Activity, Radio } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import CardHeaderTitle from "@/components/ui/card-header-title";

export default function HardwarePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Hardware Data Roadmap (IoT)</h1>

      <Card>
        <CardHeader>
          <CardHeaderTitle icon={<Cpu className="w-5 h-5 text-emerald-700" aria-hidden="true" />} title="Ingestion Options" />
        </CardHeader>
        <CardContent className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
          <ul className="list-disc pl-6">
            <li>HTTP Webhook: Gateway posts JSON to <code>/api/iot/ingest</code> signed with HMAC.</li>
            <li>MQTT Broker: Devices publish to topics; subscriber service writes to DB.</li>
            <li>LoRaWAN (TTN/ChirpStack): Uplink webhooks to <code>/api/iot/ttn</code>.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardHeaderTitle icon={<Activity className="w-5 h-5 text-emerald-700" aria-hidden="true" />} title="Data Model (Prisma)" />
        </CardHeader>
        <CardContent className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
          <p>Two core tables:</p>
          <ul className="list-disc pl-6">
            <li><strong>SensorDevice</strong>: farmId, name, type, unit, connectivity, metadata, apiKeyHash, lastSeenAt.</li>
            <li><strong>SensorReading</strong>: deviceId, at, value, unit, quality, raw (indexed by deviceId, at).</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardHeaderTitle icon={<Radio className="w-5 h-5 text-emerald-700" aria-hidden="true" />} title="Security & Provisioning" />
        </CardHeader>
        <CardContent className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
          <ul className="list-disc pl-6">
            <li>Admin registers SensorDevice → binds to Farm → issues device API key (store only hash).</li>
            <li>All ingestion over TLS. Verify HMAC signature per request. Rate-limit per device.</li>
            <li>Validate units and value ranges; mark quality: ok/warn/error.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardHeaderTitle icon={<Activity className="w-5 h-5 text-emerald-700" aria-hidden="true" />} title="Minimal Working Slice (1–2 days)" />
        </CardHeader>
        <CardContent className="text-sm text-gray-700 dark:text-gray-300">
          <ol className="list-decimal pl-6 space-y-1">
            <li>Add SensorDevice & SensorReading models; migrate.</li>
            <li>Build <code>POST /api/iot/ingest</code> with HMAC auth.</li>
            <li>Admin: Register sensor, bind to farm, generate API key (QR optional).</li>
            <li>POST from a test ESP32/gateway; store reading; update lastSeenAt.</li>
            <li>Dashboard: show latest soil moisture and last seen.</li>
            <li>Advisory: trigger low-moisture alert; push notification.</li>
            <li>Chat: include latest sensor snapshot in context for richer answers.</li>
          </ol>
          <p className="mt-3">See repository root: <code>HARDWARE_INTEGRATION.md</code> for full details.</p>
        </CardContent>
      </Card>
    </div>
  );
}
