
import { db } from '../db';
import { Client } from '../types';

export const smsService = {
  /**
   * Universal SMS Dispatcher
   * Automatically routes between API background sending and Native Fallback
   */
  send: async (phone: string, message: string): Promise<{ success: boolean; method: 'api' | 'fallback'; error?: string }> => {
    const settings = await db.getSmsSettings();

    if (settings.isConfigured && settings.apiUrl && settings.apiKey) {
      try {
        // Universal Payload Builder (Common patterns for providers like Termii/SendChamp)
        const payload = {
          to: phone,
          from: settings.senderId,
          sms: message,
          type: "plain",
          channel: "dnd",
          api_key: settings.apiKey, // Some APIs use body for keys
        };

        const response = await fetch(settings.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}` // Some APIs use headers
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          return { success: true, method: 'api' };
        } else {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || 'API rejected the request');
        }
      } catch (error: any) {
        console.warn('SMS API Failed, falling back to window protocol:', error);
        smsService.triggerFallback(phone, message);
        return { success: false, method: 'fallback', error: error.message };
      }
    } else {
      smsService.triggerFallback(phone, message);
      return { success: true, method: 'fallback' };
    }
  },

  triggerFallback: (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;
  },

  formatTemplate: (template: string, data: { name: string; amount: string; date: string }) => {
    return template
      .replace('{name}', data.name)
      .replace('{amount}', data.amount)
      .replace('{date}', data.date);
  }
};
