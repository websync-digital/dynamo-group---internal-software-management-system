import React from 'react';
import { db } from '../db';
import { Client, PlotStatus, Estate, Realtor, Plot } from '../types';
import { CheckCircle2, User, Phone, Mail, MapPin, Calendar, Briefcase, Award } from 'lucide-react';

const Onboarding = () => {
  const [submitted, setSubmitted] = React.useState(false);
  const [formData, setFormData] = React.useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    address: '',
    assignedRealtor: '',
    referralSource: 'Direct',
    estateId: '',
    plotId: ''
  });

  const [realtorSearch, setRealtorSearch] = React.useState('');
  const [showRealtorResults, setShowRealtorResults] = React.useState(false);

  const [estates, setEstates] = React.useState<Estate[]>([]);
  const [realtors, setRealtors] = React.useState<Realtor[]>([]);
  const [plots, setPlots] = React.useState<Plot[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      const [fetchedEstates, fetchedRealtors, fetchedPlots] = await Promise.all([
        db.getEstates(),
        db.getRealtors(),
        db.getPlots()
      ]);
      setEstates(fetchedEstates);
      setRealtors(fetchedRealtors);
      setPlots(fetchedPlots);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const availablePlots = plots.filter(p => p.estateId === formData.estateId && p.status === 'available');

  const filteredRealtors = realtors.filter(r => 
    r.status === 'active' && 
    r.fullName.toLowerCase().includes(realtorSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.email) {
      const usage = await db.isEmailInUse(formData.email);
      if (usage.isRealtor) {
        alert("This email address is registered as an Elite Realtor. Realtors cannot be added to the Client Profiling database. Please use a separate client identity for asset management.");
        return;
      }
    }
    
    const newClient: Client = {
      id: Math.random().toString(36).substr(2, 9),
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      dob: formData.dob,
      address: formData.address,
      assignedRealtor: formData.assignedRealtor,
      referralSource: formData.referralSource,
      createdAt: new Date().toISOString()
    };

    let newCommission = null;
    if (formData.plotId && formData.assignedRealtor) {
      const selectedPlot = plots.find(p => p.id === formData.plotId);
      if (selectedPlot) {
        const commissionPct = 10; // Default company policy
        const commissionAmount = (selectedPlot.price * commissionPct) / 100;
        
        newCommission = {
          realtorName: formData.assignedRealtor,
          clientId: newClient.id,
          plotId: selectedPlot.id,
          amount: commissionAmount,
          percentage: commissionPct,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending' as const,
          createdAt: new Date().toISOString()
        };
      }
    }

    await db.submitClientOnboarding(newClient, newCommission);

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 text-green-600 rounded-full mb-4">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Onboarding Received</h1>
          <p className="text-gray-500 font-medium leading-relaxed">
            Thank you for choosing <span className="text-green-600 font-bold">Dynamo Group</span>. Your details and asset selection have been successfully transmitted to our secure management server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8 bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-10 duration-700">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <div className="bg-green-600 p-4 rounded-3xl shadow-xl shadow-green-200">
              <Award className="text-white" size={32} />
            </div>
          </div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Client Onboarding</h2>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.25em]">Dynamo Group • Asset Verification System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            {/* PERSONAL INFORMATION */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <User size={14} className="text-green-600" /> Full Legal Name
                </label>
                <input 
                  required 
                  type="text" 
                  placeholder="Ex: Babatunde Olawale"
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-gray-50 p-4 rounded-2xl focus:bg-white focus:border-green-600 outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Mail size={14} className="text-green-600" /> Email Access
                  </label>
                  <input 
                    required 
                    type="email" 
                    placeholder="name@gmail.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-gray-50 border-2 border-gray-50 p-4 rounded-2xl focus:bg-white focus:border-green-600 outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Phone size={14} className="text-green-600" /> WhatsApp Phone
                  </label>
                  <input 
                    required 
                    type="tel" 
                    placeholder="+234..."
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-gray-50 border-2 border-gray-50 p-4 rounded-2xl focus:bg-white focus:border-green-600 outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={14} className="text-green-600" /> Date of Birth
                </label>
                <input 
                  required 
                  type="date" 
                  value={formData.dob}
                  onChange={e => setFormData({...formData, dob: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-gray-50 p-4 rounded-2xl focus:bg-white focus:border-green-600 outline-none transition-all font-bold text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={14} className="text-green-600" /> Residential Address
                </label>
                <textarea 
                  required 
                  placeholder="Enter full physical address..."
                  rows={3}
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-gray-50 p-4 rounded-2xl focus:bg-white focus:border-green-600 outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* CHANNEL PARTNER & ASSET SELECTION */}
            <div className="bg-green-50/50 p-8 rounded-[2rem] border-2 border-green-100/50 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Briefcase size={14} className="text-green-600" /> Managing Elite Realtor
                  </label>
                  <div className="relative">
                    <input 
                      required
                      type="text"
                      placeholder="Search partner name..."
                      value={realtorSearch || formData.assignedRealtor}
                      onChange={e => {
                        setRealtorSearch(e.target.value);
                        setShowRealtorResults(true);
                      }}
                      onFocus={() => setShowRealtorResults(true)}
                      className="w-full bg-white border-2 border-gray-100 p-4 rounded-2xl focus:border-green-600 outline-none transition-all font-black text-xs uppercase tracking-widest text-gray-900"
                    />
                    {showRealtorResults && (realtorSearch || formData.assignedRealtor) && (
                      <div className="absolute z-50 left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="max-h-48 overflow-y-auto">
                          {filteredRealtors.length > 0 ? (
                            filteredRealtors.map(r => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => {
                                  setFormData({...formData, assignedRealtor: r.fullName});
                                  setRealtorSearch(r.fullName);
                                  setShowRealtorResults(false);
                                }}
                                className="w-full px-6 py-4 text-left hover:bg-green-50 transition-colors border-b border-gray-50 last:border-0"
                              >
                                <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest">{r.fullName}</p>
                                <p className="text-[8px] text-green-600 font-bold uppercase tracking-tight mt-0.5">Elite Level Partner</p>
                              </button>
                            ))
                          ) : (
                            <div className="px-6 py-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                              No partner found...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Estate</label>
                    <select 
                      required
                      value={formData.estateId}
                      onChange={e => setFormData({...formData, estateId: e.target.value, plotId: ''})}
                      className="w-full bg-white border-2 border-gray-100 p-4 rounded-2xl focus:border-green-600 outline-none transition-all font-black text-xs uppercase tracking-widest text-gray-900"
                    >
                      <option value="">-- Choose Estate --</option>
                      {estates.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Plot</label>
                    <select 
                      required
                      disabled={!formData.estateId}
                      value={formData.plotId}
                      onChange={e => setFormData({...formData, plotId: e.target.value})}
                      className="w-full bg-white border-2 border-gray-100 p-4 rounded-2xl focus:border-green-600 outline-none transition-all font-black text-xs uppercase tracking-widest text-gray-900 disabled:opacity-50"
                    >
                      <option value="">-- Choose Plot --</option>
                      {availablePlots.map(p => (
                        <option key={p.id} value={p.id}>{p.plotNumber} ({p.size})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                 Discovery Source
              </label>
              <select 
                value={formData.referralSource}
                onChange={e => setFormData({...formData, referralSource: e.target.value})}
                className="w-full bg-gray-50 border-2 border-gray-50 p-4 rounded-2xl focus:bg-white focus:border-green-600 outline-none transition-all font-black text-xs uppercase tracking-widest text-gray-900"
              >
                <option value="Direct">Direct Contact</option>
                <option value="Realtor">Via Realtor</option>
                <option value="Social Media">Social Media</option>
                <option value="Radio">Radio / TV</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              className="w-full bg-green-600 text-white py-5 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-green-700 transition-all shadow-2xl shadow-green-900/10 active:scale-[0.98] text-xs"
            >
              Confirm & Finalize Profile
            </button>
            <p className="mt-4 text-[9px] text-center text-gray-400 font-bold uppercase tracking-widest leading-loose px-8">
              By submitting this form, you acknowledge that all data will be processed according to Dynamo Group's asset protection protocols.
            </p>
          </div>
        </form>
      </div>
      
      <div className="mt-8 text-center text-gray-400 font-black text-[9px] uppercase tracking-[0.3em]">
        Dynamo Group © 2026 • Secure Channel
      </div>
    </div>
  );
};

export default Onboarding;
