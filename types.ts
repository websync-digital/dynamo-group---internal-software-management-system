
export type PlotStatus = 'available' | 'sold' | 'installment';
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
