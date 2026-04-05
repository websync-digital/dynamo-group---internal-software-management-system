import React from 'react';
import { db } from '../db';
import { Realtor } from '../types';
import { CheckCircle2, User, Phone, Mail, MapPin, Landmark, Briefcase, Award } from 'lucide-react';

const RealtorOnboarding = () => {
  const [submitted, setSubmitted] = React.useState(false);
  const [formData, setFormData] = React.useState<Partial<Realtor>>({
    fullName: '',
    email: '',
    phone: '',
    whatsapp: '',
    location: '',
    bankName: '',
    accountName: '',
    accountNumber: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newRealtor: Realtor = {
      id: Math.random().toString(36).substr(2, 9),
      fullName: formData.fullName || '',
      email: formData.email || '',
      phone: formData.phone || '',
      whatsapp: formData.whatsapp || '',
      location: formData.location || '',
      bankName: formData.bankName || '',
      accountName: formData.accountName || '',
      accountNumber: formData.accountNumber || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    db.saveRealtor(newRealtor);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 text-green-600 rounded-full mb-4">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Application Received</h1>
          <p className="text-gray-500 font-medium leading-relaxed">
            Welcome to the <span className="text-green-600 font-bold">Dynamo Elite Realtor Network</span>. Your professional profile has been submitted for verification.
          </p>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-4">An administrator will contact you shortly to activate your status.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-10 duration-700">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <div className="bg-green-600 p-5 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl shadow-green-200">
              <Award className="text-white" size={32} />
            </div>
          </div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Realtor Registration</h2>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.25em]">Dynamo Group • Professional Network Enrollment</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">1. Personal Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <User size={14} className="text-green-600" /> Full Legal Name
                </label>
                <input required type="text" placeholder="As seen on ID" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-50 p-4 rounded-2xl focus:bg-white focus:border-green-600 outline-none transition-all font-bold text-gray-900" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Mail size={14} className="text-green-600" /> Professional Email
                </label>
                <input required type="email" placeholder="email@realtor.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-50 p-4 rounded-2xl focus:bg-white focus:border-green-600 outline-none transition-all font-bold text-gray-900" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Phone size={14} className="text-green-600" /> Primary Phone
                </label>
                <input required type="tel" placeholder="+234..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-50 p-4 rounded-2xl focus:bg-white focus:border-green-600 outline-none transition-all font-bold text-gray-900" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare size={14} className="text-green-600" /> WhatsApp Number
                </label>
                <input required type="tel" placeholder="+234..." value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-50 p-4 rounded-2xl focus:bg-white focus:border-green-600 outline-none transition-all font-bold text-gray-900" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={14} className="text-green-600" /> Operational Base (City/Area)
              </label>
              <input required type="text" placeholder="e.g. Ikeja, Lagos" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-50 p-4 rounded-2xl focus:bg-white focus:border-green-600 outline-none transition-all font-bold text-gray-900" />
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">2. Remittance Verification</h3>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Landmark size={14} className="text-green-600" /> Financial Institution (Bank)
              </label>
              <input required type="text" placeholder="e.g. Zenith Bank" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-50 p-4 rounded-2xl focus:bg-white focus:border-green-600 outline-none transition-all font-bold text-gray-900" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Beneficiary Name</label>
                <input required type="text" placeholder="Account Name" value={formData.accountName} onChange={e => setFormData({...formData, accountName: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-50 p-4 rounded-2xl focus:bg-white focus:border-green-600 outline-none transition-all font-bold text-gray-900" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Number</label>
                <input required type="text" placeholder="10 Digits" value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-50 p-4 rounded-2xl focus:bg-white focus:border-green-600 outline-none transition-all font-bold text-gray-900" />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full bg-green-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] hover:bg-green-700 transition-all shadow-2xl shadow-green-900/10 active:scale-[0.98] text-xs">Register Professional Status</button>
            <p className="mt-4 text-[9px] text-center text-gray-400 font-bold uppercase tracking-widest leading-loose px-8">
              By registering, you agree to Dynamo Group's commission structures and ethical partner guidelines.
            </p>
          </div>
        </form>
      </div>
      
      <div className="mt-8 text-center text-gray-400 font-black text-[9px] uppercase tracking-[0.3em]">
        Dynamo Elite Network © 2026 • Secure Partner Channel
      </div>
    </div>
  );
};

// Add missing icon
const MessageSquare = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export default RealtorOnboarding;
