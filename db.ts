import { Client, Estate, Plot, Commission, PaymentRecord, InstallmentPlan } from './types';

const STORAGE_KEYS = {
  CLIENTS: 'dg_clients',
  ESTATES: 'dg_estates',
  PLOTS: 'dg_plots',
  COMMISSIONS: 'dg_commissions',
  PAYMENTS: 'dg_payments',
  INSTALLMENTS: 'dg_installments',
};

export const db = {
  get: <T,>(key: string, defaultValue: T): T => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  },
  set: <T,>(key: string, value: T): void => {
    localStorage.setItem(key, JSON.stringify(value));
  },

  // Clients
  getClients: (): Client[] => db.get(STORAGE_KEYS.CLIENTS, []),
  saveClient: (client: Client) => {
    const clients = db.getClients();
    const index = clients.findIndex(c => c.id === client.id);
    if (index > -1) clients[index] = client;
    else clients.push(client);
    db.set(STORAGE_KEYS.CLIENTS, clients);
  },

  // Estates
  getEstates: (): Estate[] => db.get(STORAGE_KEYS.ESTATES, []),
  saveEstate: (estate: Estate) => {
    const estates = db.getEstates();
    estates.push(estate);
    db.set(STORAGE_KEYS.ESTATES, estates);
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
  }
};

// Seed Data
if (db.getEstates().length === 0) {
  const initialEstates: Estate[] = [
    { id: 'e1', name: 'Emerald Gardens', location: 'Lekki Phase 1', totalPlots: 50 },
    { id: 'e2', name: 'Pine View Estate', location: 'Epe', totalPlots: 100 },
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
    price: 5000000,
    size: '500sqm'
  }));
  db.set(STORAGE_KEYS.PLOTS, initialPlots);

  const initialComms: Commission[] = [
    { id: 'com1', realtorName: 'Ade Thompson', clientId: 'c1', plotId: 'p0', amount: 500000, percentage: 10, dueDate: '2024-12-01', status: 'pending' }
  ];
  db.set(STORAGE_KEYS.COMMISSIONS, initialComms);
}