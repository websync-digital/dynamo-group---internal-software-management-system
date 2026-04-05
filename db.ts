import { Client, Estate, Plot, Commission, PaymentRecord, InstallmentPlan, SmsSettings, PaymentMethod, Realtor } from './types';

const STORAGE_KEYS = {
  CLIENTS: 'dg_clients',
  ESTATES: 'dg_estates',
  PLOTS: 'dg_plots',
  COMMISSIONS: 'dg_commissions',
  PAYMENTS: 'dg_payments',
  INSTALLMENTS: 'dg_installments',
  SETTINGS: 'dg_settings',
  REALTORS: 'dg_realtors',
};

const DEFAULT_SMS_SETTINGS: SmsSettings = {
  apiUrl: '',
  apiKey: '',
  senderId: 'DYNAMO',
  isConfigured: false,
  template: 'Dear {name}, this is a reminder from Dynamo Group. Your installment of ₦{amount} is due on {date}. Please kindly settle to our official account. Thank you.'
};

export const db = {
  get: <T,>(key: string, defaultValue: T): T => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  },
  set: <T,>(key: string, value: T): void => {
    localStorage.setItem(key, JSON.stringify(value));
  },

  // Settings
  getSmsSettings: (): SmsSettings => db.get(STORAGE_KEYS.SETTINGS, DEFAULT_SMS_SETTINGS),
  saveSmsSettings: (settings: SmsSettings) => db.set(STORAGE_KEYS.SETTINGS, settings),

  // Clients
  getClients: (): Client[] => db.get(STORAGE_KEYS.CLIENTS, []),
  saveClient: (client: Client) => {
    const clients = db.getClients();
    const index = clients.findIndex(c => c.id === client.id);
    if (index > -1) clients[index] = client;
    else clients.push(client);
    db.set(STORAGE_KEYS.CLIENTS, clients);
  },
  deleteClient: (clientId: string) => {
    const clients = db.getClients().filter(c => c.id !== clientId);
    db.set(STORAGE_KEYS.CLIENTS, clients);

    // Clean up plots
    const plots = db.getPlots().map(p => {
      if (p.clientId === clientId) {
        return { ...p, status: 'available' as const, clientId: undefined };
      }
      return p;
    });
    db.set(STORAGE_KEYS.PLOTS, plots);

    // Clean up installments
    const installments = db.getInstallments().filter(i => i.clientId !== clientId);
    db.set(STORAGE_KEYS.INSTALLMENTS, installments);
  },

  // Estates
  getEstates: (): Estate[] => db.get(STORAGE_KEYS.ESTATES, []),
  saveEstate: (estate: Estate) => {
    const estates = db.getEstates();
    const index = estates.findIndex(e => e.id === estate.id);
    if (index > -1) estates[index] = estate;
    else estates.push(estate);
    db.set(STORAGE_KEYS.ESTATES, estates);
  },
  deleteEstate: (estateId: string) => {
    const estates = db.getEstates().filter(e => e.id !== estateId);
    db.set(STORAGE_KEYS.ESTATES, estates);
    
    // Cascade delete plots
    const plots = db.getPlots().filter(p => p.estateId !== estateId);
    db.set(STORAGE_KEYS.PLOTS, plots);
  },
  
  updateAvailablePlotPrices: (estateId: string, newPrice: number) => {
    const plots = db.getPlots().map(p => {
      if (p.estateId === estateId && p.status === 'available') {
        return { ...p, price: newPrice };
      }
      return p;
    });
    db.set(STORAGE_KEYS.PLOTS, plots);
  },

  // Plots
  getPlots: (): Plot[] => db.get(STORAGE_KEYS.PLOTS, []),
  savePlot: (plot: Plot) => {
    const plots = db.getPlots();
    const index = plots.findIndex(p => p.id === plot.id);
    if (index > -1) plots[index] = plot;
    else plots.push(plot);
    db.set(STORAGE_KEYS.PLOTS, plots);
  },
  deletePlot: (plotId: string) => {
    const plots = db.getPlots().filter(p => p.id !== plotId);
    db.set(STORAGE_KEYS.PLOTS, plots);
  },

  // Payments
  getPayments: (): PaymentRecord[] => db.get(STORAGE_KEYS.PAYMENTS, []),
  getPaymentsByClient: (clientId: string) => db.getPayments().filter(p => p.clientId === clientId),
  savePayment: (payment: PaymentRecord) => {
    const payments = db.getPayments();
    payments.push(payment);
    db.set(STORAGE_KEYS.PAYMENTS, payments);
  },

  // Commissions
  getCommissions: (): Commission[] => db.get(STORAGE_KEYS.COMMISSIONS, []),
  saveCommission: (comm: Commission) => {
    const comms = db.getCommissions();
    const index = comms.findIndex(c => c.id === comm.id);
    if (index > -1) comms[index] = comm;
    else comms.push(comm);
    db.set(STORAGE_KEYS.COMMISSIONS, comms);
  },

  // Installments
  getInstallments: (): InstallmentPlan[] => db.get(STORAGE_KEYS.INSTALLMENTS, []),
  saveInstallment: (plan: InstallmentPlan) => {
    const plans = db.getInstallments();
    const index = plans.findIndex(p => p.id === plan.id);
    if (index > -1) plans[index] = plan;
    else plans.push(plan);
    db.set(STORAGE_KEYS.INSTALLMENTS, plans);
  },
  fulfillInstallmentPayment: (installmentId: string, amount: number, method: PaymentMethod) => {
    const installments = db.getInstallments();
    const inst = installments.find(i => i.id === installmentId);
    if (!inst) return;

    // 1. Create Payment Record
    db.savePayment({
      id: Math.random().toString(36).substr(2, 9),
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

    db.saveInstallment(inst);

    // 3. Mark plot as fully paid if balance is 0
    if (inst.remainingAmount <= 0) {
      const plots = db.getPlots();
      const plotIndex = plots.findIndex(p => p.id === inst.plotId);
      if (plotIndex > -1) {
        plots[plotIndex].status = 'sold';
        db.set(STORAGE_KEYS.PLOTS, plots);
      }
    }
  },

  // Realtors
  getRealtors: (): Realtor[] => db.get(STORAGE_KEYS.REALTORS, []),
  saveRealtor: (realtor: Realtor) => {
    const realtors = db.getRealtors();
    const index = realtors.findIndex(r => r.id === realtor.id);
    if (index > -1) realtors[index] = realtor;
    else realtors.push(realtor);
    db.set(STORAGE_KEYS.REALTORS, realtors);
  },
  deleteRealtor: (realtorId: string) => {
    const realtors = db.getRealtors().filter(r => r.id !== realtorId);
    db.set(STORAGE_KEYS.REALTORS, realtors);
  },
  
  // Cross-verification
  isEmailInUse: (email: string) => {
    const isClient = db.getClients().some(c => c.email.toLowerCase() === email.toLowerCase());
    const isRealtor = db.getRealtors().some(r => r.email.toLowerCase() === email.toLowerCase());
    return { isClient, isRealtor };
  }
};

// Migration: Ensure all estates have a basePrice
const currentEstates = db.getEstates();
let migrationNeeded = false;
const migratedEstates = currentEstates.map(e => {
  if (e.basePrice === undefined || e.basePrice === 0) {
    migrationNeeded = true;
    return { ...e, basePrice: 5000000 };
  }
  return e;
});

if (migrationNeeded) {
  db.set(STORAGE_KEYS.ESTATES, migratedEstates);
}

// Seed Data
if (db.getEstates().length === 0) {
  const initialEstates: Estate[] = [
    { id: 'e1', name: 'Emerald Gardens', location: 'Lekki Phase 1', totalPlots: 50, basePrice: 5000000 },
    { id: 'e2', name: 'Pine View Estate', location: 'Epe', totalPlots: 100, basePrice: 7500000 },
  ];
  db.set(STORAGE_KEYS.ESTATES, initialEstates);

  const initialClients: Client[] = [
    { id: 'c1', fullName: 'Chidi Okonkwo', dob: '1985-05-12', phone: '08012345678', email: 'chidi@example.com', address: '12 Victoria Island', assignedRealtor: 'Ade Thompson', referralSource: 'Social Media', createdAt: new Date().toISOString() }
  ];
  db.set(STORAGE_KEYS.CLIENTS, initialClients);

  const initialPlots: Plot[] = Array.from({ length: 15 }).map((_, i) => ({
    id: `p${i}`,
    plotNumber: `PLT-${100 + i}`,
    estateId: i < 8 ? 'e1' : 'e2',
    status: i === 0 ? 'sold' : 'available',
    clientId: i === 0 ? 'c1' : undefined,
    price: i < 8 ? 5000000 : 7500000,
    size: '500sqm'
  }));
  db.set(STORAGE_KEYS.PLOTS, initialPlots);

  const initialComms: Commission[] = [
    { id: 'com1', realtorName: 'Ade Thompson', clientId: 'c1', plotId: 'p0', amount: 500000, percentage: 10, dueDate: '2024-12-01', status: 'pending', createdAt: new Date().toISOString() }
  ];
  db.set(STORAGE_KEYS.COMMISSIONS, initialComms);
}