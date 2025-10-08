// server/src/services/SMSService.ts
// SMS sending service. Uses Twilio if configured; otherwise no-ops in demo mode.

import { env } from '../config/environment';

export type SendOtpResult = { success: boolean; messageId?: string; provider?: 'twilio' | 'demo'; error?: string };

export class SMSService {
  private client: any | null = null;

  constructor() {
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
      // Lazy require to avoid dependency issues if not installed in demo
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const twilio = require('twilio');
      this.client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    }
  }

  async sendOTP(phoneNumber: string, otp: string): Promise<SendOtpResult> {
    if (!this.client || !env.TWILIO_MESSAGING_SERVICE_SID || env.DEMO_MODE) {
      // Demo mode or twilio not configured: simulate success
      return { success: true, provider: 'demo', messageId: `demo-${Date.now()}` };
    }

    try {
      const message: any = await this.client.messages.create({
        to: phoneNumber,
        messagingServiceSid: env.TWILIO_MESSAGING_SERVICE_SID,
        body: `Your Krishi Mitra verification code is ${otp}`,
      });
      return { success: true, provider: 'twilio', messageId: message.sid };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to send SMS' };
    }
  }
}
