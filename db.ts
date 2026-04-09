import { supabase } from './supabaseClient';
import { Client, Estate, Plot, Commission, PaymentRecord, InstallmentPlan, SmsSettings, PaymentMethod, Realtor } from './types';

// The local defaultValue fallback mechanism from before will be replaced with clean async fetches.

const DEFAULT_SMS_SETTINGS: SmsSettings = {
  apiUrl: '',
  apiKey: '',
  senderId: 'DYNAMO',
  isConfigured: false,
  template: 'Dear {name}, this is a reminder from Dynamo Group. Your installment of ₦{amount} is due on {date}. Please kindly settle to our official account. Thank you.',
  id: 'default-settings'
};

export const db = {
  // Settings
  getSmsSettings: async (): Promise<SmsSettings> => {
    const { data, error } = await supabase.from('sms_settings').select('*').limit(1).single();
    if (error || !data) {
      if (error && error.code !== 'PGRST116') console.error('Error fetching sms settings', error);
      return DEFAULT_SMS_SETTINGS;
    }
    return data;
  },
  saveSmsSettings: async (settings: SmsSettings): Promise<void> => {
    // Upsert logic for a single settings row
    const { id, ...rest } = settings;
    const { data, error } = await supabase.from('sms_settings').select('id').limit(1).single();
    if (data) {
        await supabase.from('sms_settings').update(rest).eq('id', data.id);
    } else {
        await supabase.from('sms_settings').insert(settings);
    }
  },

  // Clients
  submitClientOnboarding: async (client: Partial<Client>, commission: Partial<Commission> | null): Promise<void> => {
    const { data, error } = await supabase.rpc('submit_client_onboarding', {
      p_client: client,
      p_commission: commission
    });
    if (error) {
      console.error('RPC Error (Client):', error);
      alert('Failed to submit client: ' + error.message);
      throw error;
    }
    if (data && typeof data === 'object' && !data.success) {
      console.error('RPC Failed internally:', data.error);
      alert('Failed to submit client: ' + data.error);
      throw new Error(data.error);
    }
  },
  getClients: async (): Promise<Client[]> => {
    const { data, error } = await supabase.from('clients').select('*').order('createdAt', { ascending: false });
    if (error) console.error(error);
    return data || [];
  },
  saveClient: async (client: Partial<Client>): Promise<void> => {
    const { id, ...rest } = client;
    if (id && id.length > 20) { // Naive check if it's already a uuid
      const { data: existing } = await supabase.from('clients').select('id').eq('id', id).single();
      if (existing) {
        await supabase.from('clients').update(rest).eq('id', id);
        return;
      }
    }
    await supabase.from('clients').insert(rest);
  },
  deleteClient: async (clientId: string): Promise<void> => {
    // The CASCADE rules in Postgres will handle plot references being SET NULL or deleted.
    await supabase.from('clients').delete().eq('id', clientId);
  },

  // Estates
  getEstates: async (): Promise<Estate[]> => {
    const { data, error } = await supabase.from('estates').select('*');
    if (error) console.error(error);
    return data || [];
  },
  saveEstate: async (estate: Partial<Estate>): Promise<void> => {
    const { id, ...rest } = estate;
    if (id && id.length > 20) {
      const { data: existing } = await supabase.from('estates').select('id').eq('id', id).single();
      if (existing) {
        await supabase.from('estates').update(rest).eq('id', id);
        return;
      }
    }
    await supabase.from('estates').insert(rest);
  },
  deleteEstate: async (estateId: string): Promise<void> => {
    await supabase.from('estates').delete().eq('id', estateId); // plots will cascade delete
  },
  updateAvailablePlotPrices: async (estateId: string, newPrice: number): Promise<void> => {
    await supabase.from('plots').update({ price: newPrice }).eq('estateId', estateId).eq('status', 'available');
  },

  // Plots
  getPlots: async (): Promise<Plot[]> => {
    const { data, error } = await supabase.from('plots').select('*');
    if (error) console.error(error);
    return data || [];
  },
  savePlot: async (plot: Partial<Plot>): Promise<void> => {
     const { id, ...rest } = plot;
     if (id && id.length > 20) {
      const { data: existing } = await supabase.from('plots').select('id').eq('id', id).single();
      if (existing) {
        await supabase.from('plots').update(rest).eq('id', id);
        return;
      }
    }
    await supabase.from('plots').insert(rest);
  },
  deletePlot: async (plotId: string): Promise<void> => {
    await supabase.from('plots').delete().eq('id', plotId);
  },

  // Payments
  getPayments: async (): Promise<PaymentRecord[]> => {
    const { data, error } = await supabase.from('payment_records').select('*');
    if (error) console.error(error);
    return data || [];
  },
  getPaymentsByClient: async (clientId: string): Promise<PaymentRecord[]> => {
    const { data, error } = await supabase.from('payment_records').select('*').eq('clientId', clientId);
    if (error) console.error(error);
    return data || [];
  },
  savePayment: async (payment: Partial<PaymentRecord>): Promise<void> => {
     const { id, ...rest } = payment;
     await supabase.from('payment_records').insert(rest);
  },

  // Commissions
  getCommissions: async (): Promise<Commission[]> => {
    const { data, error } = await supabase.from('commissions').select('*').order('createdAt', { ascending: false });
    if (error) console.error(error);
    return data || [];
  },
  saveCommission: async (comm: Partial<Commission>): Promise<void> => {
    const { id, ...rest } = comm;
     if (id && id.length > 20) {
      const { data: existing } = await supabase.from('commissions').select('id').eq('id', id).single();
      if (existing) {
        await supabase.from('commissions').update(rest).eq('id', id);
        return;
      }
    }
    await supabase.from('commissions').insert(rest);
  },

  // Installments
  getInstallments: async (): Promise<InstallmentPlan[]> => {
    const { data, error } = await supabase.from('installment_plans').select('*');
    if (error) console.error(error);
    return data || [];
  },
  saveInstallment: async (plan: Partial<InstallmentPlan>): Promise<void> => {
    const { id, ...rest } = plan;
     if (id && id.length > 20) {
      const { data: existing } = await supabase.from('installment_plans').select('id').eq('id', id).single();
      if (existing) {
        await supabase.from('installment_plans').update(rest).eq('id', id);
        return;
      }
    }
    await supabase.from('installment_plans').insert(rest);
  },
  fulfillInstallmentPayment: async (installmentId: string, amount: number, method: PaymentMethod): Promise<void> => {
    const { data: inst, error } = await supabase.from('installment_plans').select('*').eq('id', installmentId).single();
    if (error || !inst) return;

    // 1. Create Payment Record
    await db.savePayment({
      clientId: inst.clientId,
      plotId: inst.plotId,
      paymentDate: new Date().toISOString().split('T')[0],
      amountPaid: amount,
      balance: Math.max(0, inst.remainingAmount - amount),
      paymentMethod: method,
    });

    // 2. Update Installment Plan
    inst.remainingAmount = Math.max(0, inst.remainingAmount - amount);
    
    // Push next due date forward by 30 days if there's still balance
    if (inst.remainingAmount > 0) {
      const nextDate = new Date(inst.nextDueDate);
      nextDate.setDate(nextDate.getDate() + 30);
      inst.nextDueDate = nextDate.toISOString().split('T')[0];
    } else {
      inst.nextDueDate = 'COMPLETED';
    }

    await db.saveInstallment(inst);

    // 3. Mark plot as fully paid if balance is 0
    if (inst.remainingAmount <= 0) {
      await supabase.from('plots').update({ status: 'sold' }).eq('id', inst.plotId);
    }
  },

  // Realtors
  submitRealtorOnboarding: async (realtor: Partial<Realtor>): Promise<void> => {
    const { data, error } = await supabase.rpc('submit_realtor_onboarding', {
      p_realtor: realtor
    });
    if (error) {
      console.error('RPC Error (Realtor):', error);
      alert('Failed to submit: ' + error.message);
      throw error;
    }
    if (data && typeof data === 'object' && !data.success) {
      console.error('RPC Failed internally:', data.error);
      alert('Failed to submit: ' + data.error);
      throw new Error(data.error);
    }
  },
  getRealtors: async (): Promise<Realtor[]> => {
    // If not authenticated, we use the public RPC which just returns id, fullName, status.
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      const { data } = await supabase.rpc('get_public_realtors');
      return (data || []) as Realtor[];
    }

    const { data, error } = await supabase.from('realtors').select('*').order('createdAt', { ascending: false });
    if (error) console.error(error);
    return data || [];
  },
  saveRealtor: async (realtor: Partial<Realtor>): Promise<void> => {
    const { id, ...rest } = realtor;
    if (id && id.length > 20) {
      const { data: existing } = await supabase.from('realtors').select('id').eq('id', id).single();
      if (existing) {
        await supabase.from('realtors').update(rest).eq('id', id);
        return;
      }
    }
    await supabase.from('realtors').insert(rest);
  },
  deleteRealtor: async (realtorId: string): Promise<void> => {
    await supabase.from('realtors').delete().eq('id', realtorId);
  },
  
  // Cross-verification
  isEmailInUse: async (email: string): Promise<{ isClient: boolean, isRealtor: boolean }> => {
    const { data, error } = await supabase.rpc('check_email_status', { check_email: email });
    if (error) {
      console.error(error);
      return { isClient: false, isRealtor: false };
    }
    return data as { isClient: boolean, isRealtor: boolean };
  }
};