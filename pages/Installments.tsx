import React from 'react';
import { db } from '../db';
import { supabase } from '../supabaseClient';
import SkeletonLoader from '../components/SkeletonLoader';
import { InstallmentPlan, PaymentMethod, Plot, Estate, Client } from '../types';
import { Clock, Send, Bell, Calendar, Mail, MessageSquare, Phone, Loader2, Wallet, X, ShieldCheck } from 'lucide-react';
import { useInfiniteRealtime } from '../utils/useInfiniteRealtime';
import { useInView } from "../utils/useInView";
import { smsService } from '../utils/smsService';

const Installments = () => {
  const [isSending, setIsSending] = React.useState<string | null>(null);
  const [payingInstallment, setPayingInstallment] = React.useState<InstallmentPlan | null>(null);
  const [paymentForm, setPaymentForm] = React.useState({
    method: 'bank_transfer' as PaymentMethod,
    amount: 0
  });

  const { data: installments, isLoading, hasNextPage, loadMore, isFetchingNextPage } = useInfiniteRealtime<InstallmentPlan>({
    table: 'installments',
    pageSize: 50,
    orderBy: 'nextDueDate',
    orderAscending: true
  });

  const { data: plots } = useInfiniteRealtime<Plot>({ table: 'plots', pageSize: 1000 });
  const { data: estates } = useInfiniteRealtime<Estate>({ table: 'estates', pageSize: 100 });
  const { data: clients } = useInfiniteRealtime<Client>({ table: 'clients', pageSize: 1000 });

  const { ref, inView } = useInView({ threshold: 0 });

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      loadMore();
    }
  }, [inView, hasNextPage, isFetchingNextPage, loadMore]);

  const calculateInstallmentAmount = (inst: InstallmentPlan) => {
    const divisor = inst.frequency === 'monthly' ? 12 : 4;
    return (inst.totalAmount / divisor);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInstallment) return;

    await db.fulfillInstallmentPayment(payingInstallment.id, paymentForm.amount, paymentForm.method);
    setPayingInstallment(null);
    setPaymentForm({ amount: 0, method: 'bank_transfer' as PaymentMethod });
    alert('Payment recorded and client ledger updated!');
  };

  const sendSMS = async (inst: InstallmentPlan) => {
    const client = clients.find(c => c.id === inst.clientId);
    if (!client) return;

    setIsSending(inst.id);
    const amount = calculateInstallmentAmount(inst);
    const settings = await db.getSmsSettings();
    
    const message = smsService.formatTemplate(settings.template, {
      name: client.fullName,
      amount: amount.toLocaleString(),
      date: inst.nextDueDate
    });
    
    await smsService.send(client.phone, message);
    setIsSending(null);
  };

  const sendWhatsApp = (inst: InstallmentPlan) => {
    const client = clients.find(c => c.id === inst.clientId);
    if (!client) return;

    const amount = calculateInstallmentAmount(inst);
    const message = `*Dynamo Group Reminder*\n\nDear ${client.fullName}, your installment of *₦${amount.toLocaleString()}* is due on *${inst.nextDueDate}*.\n\nPlease kindly settle to the company account.\n\nThank you for choosing Dynamo Group.`;
    
    const cleanPhone = client.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Fulfillment & Installments</h1>
          <p className="text-gray-500 text-sm font-medium">Payment cycle verification and automated debt management.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg text-green-700">
                <Bell size={20} />
              </div>
              <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Active Asset Fulfillment</h3>
            </div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-gray-100">
              Active Portfolios: {installments.length}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black border-b border-gray-100">
                <tr>
                  <th className="px-8 py-6">Managed Client</th>
                  <th className="px-8 py-6">Managed Asset</th>
                  <th className="px-8 py-6">Plan Value</th>
                  <th className="px-8 py-6">Outstanding</th>
                  <th className="px-8 py-6">Cycle</th>
                  <th className="px-8 py-6">Next Maturity</th>
                  <th className="px-8 py-6 text-center">Fulfillment Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {installments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center space-y-4 opacity-20">
                        <Clock size={64} />
                        <p className="font-black text-xl uppercase tracking-[0.3em]">No Active Plans</p>
                      </div>
                    </td>
                  </tr>
                ) : installments.map((inst) => {
                  const client = clients.find(c => c.id === inst.clientId);
                  const isFullyPaid = inst.remainingAmount <= 0;

                  return (
                    <tr key={inst.id} className="group hover:bg-green-50/20 transition-all border-b border-gray-50 last:border-0">
                      <td className="px-8 py-6">
                        <p className="font-black text-gray-900 leading-none">{client?.fullName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">{client?.phone}</p>
                        {isFullyPaid && (
                          <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-green-600 text-white text-[8px] font-black uppercase rounded tracking-widest">
                            <ShieldCheck size={10} /> Fully Paid
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        {(() => {
                          const plot = plots.find(p => p.id === inst.plotId);
                          const estate = estates.find(e => e.id === plot?.estateId);
                          return (
                            <>
                              <p className="font-black text-gray-900 leading-none">{estate?.name || 'Unknown Estate'}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 tracking-widest bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 inline-block">Plot: {plot?.plotNumber || 'N/A'}</p>
                            </>
                          );
                        })()}
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-black text-gray-900">₦{inst.totalAmount.toLocaleString()}</p>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Contract Base</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className={`inline-block px-4 py-1.5 rounded-full font-black text-xs border ${
                          isFullyPaid ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          ₦{inst.remainingAmount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded text-[9px] font-black uppercase tracking-widest border border-gray-200">{inst.frequency}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-2">
                          <Calendar size={14} className={isFullyPaid ? "text-green-500" : "text-orange-500"} />
                          <span className={`text-xs font-black uppercase tracking-widest ${isFullyPaid ? "text-green-600" : "text-gray-900"}`}>
                            {isFullyPaid ? "Completed" : inst.nextDueDate}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center space-x-3">
                          {!isFullyPaid && (
                            <button 
                              onClick={() => setPayingInstallment(inst)}
                              className="flex items-center space-x-2 px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg active:scale-95 text-[10px] font-black uppercase tracking-widest"
                            >
                              <Wallet size={14} />
                              <span>Log Payment</span>
                            </button>
                          )}
                          <div className="flex space-x-2 opacity-40 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => sendSMS(inst)}
                              disabled={isSending === inst.id}
                              className="p-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-all shadow-md"
                              title="SMS Alert"
                            >
                              {isSending === inst.id ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
                            </button>
                            <button 
                              onClick={() => sendWhatsApp(inst)}
                              className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all border border-green-100"
                              title="WhatsApp Alert"
                            >
                              <Phone size={16} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {hasNextPage && (
                  <tr ref={ref}>
                    <td colSpan={7} className="py-6 text-center">
                      <Loader2 className="animate-spin text-green-600 mx-auto" size={24} />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {payingInstallment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 bg-green-600 text-white flex justify-between items-center font-black uppercase tracking-widest">
              <h2 className="text-xl">Record Verification: Payment</h2>
              <button onClick={() => setPayingInstallment(null)} className="hover:bg-green-700 p-2 rounded-full transition-colors"><X/></button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Outstanding Portfolio</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">₦{payingInstallment.remainingAmount.toLocaleString()}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fulfillment Amount (₦)</label>
                  <input 
                    required 
                    type="text" 
                    value={paymentForm.amount ? paymentForm.amount.toLocaleString() : ''} 
                    onChange={e => { const r = e.target.value.replace(/,/g, ''); if(!isNaN(Number(r))) setPaymentForm({...paymentForm, amount: Number(r)})}} 
                    className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-green-500 outline-none font-black text-lg" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Channel</label>
                  <select 
                    value={paymentForm.method} 
                    onChange={e => setPaymentForm({...paymentForm, method: e.target.value as any})} 
                    className="w-full border-2 border-gray-100 p-4 rounded-2xl font-black focus:border-green-500 outline-none uppercase text-xs tracking-widest"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="pos">POS Terminal</option>
                    <option value="cheque">Official Cheque</option>
                    <option value="cash">Petty Cash</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-green-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Submit to Ledger</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Installments;
