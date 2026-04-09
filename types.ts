
export type PlotStatus = 'available' | 'sold' | 'installment' | 'reserved';
export type PaymentMethod = 'bank_transfer' | 'cheque' | 'cash' | 'pos';
export type CommissionStatus = 'pending' | 'paid';
export type InstallmentFrequency = 'monthly' | 'quarterly';

export interface Client {
  id: string;
  fullName: string;
  dob: string;
  phone: string;
  email: string;
  address: string;
  assignedRealtor: string;
  referralSource: string;
  createdAt: string;
}

export interface Estate {
  id: string;
  name: string;
  location: string;
  totalPlots: number;
  basePrice?: number;
}

export interface Plot {
  id: string;
  plotNumber: string;
  estateId: string;
  clientId?: string;
  size?: string;
  status: PlotStatus;
  price: number;
}

export interface PaymentRecord {
  id: string;
  clientId: string;
  plotId: string;
  paymentDate: string;
  amountPaid: number;
  balance: number;
  paymentMethod: PaymentMethod;
  referralName?: string;
  signatureUrl?: string;
}

export interface Commission {
  id: string;
  realtorName: string;
  clientId: string;
  plotId: string;
  amount: number;
  percentage: number;
  dueDate: string;
  paidDate?: string;
  status: CommissionStatus;
  createdAt: string;
}

export interface InstallmentPlan {
  id: string;
  clientId: string;
  plotId: string;
  totalAmount: number;
  frequency: InstallmentFrequency;
  startDate: string;
  nextDueDate: string;
  remainingAmount: number;
}

export interface SmsSettings {
  id?: string;
  apiUrl: string;
  apiKey: string;
  senderId: string;
  isConfigured: boolean;
  template: string;
}
export interface Realtor {
  id: string;
  fullName: string;
  phone: string;
  whatsapp: string;
  email: string;
  location: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
}
