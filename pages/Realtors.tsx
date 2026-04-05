import React from 'react';
import { db } from '../db';
import { Realtor } from '../types';
import { Search, Plus, Phone, Mail, Landmark, Trash2, UserCheck, UserX, Share2, Award, ShieldCheck, Clock, X, MapPin, ExternalLink, Calendar, CheckCircle2 } from 'lucide-react';

const Realtors = () => {
  const [realtors, setRealtors] = React.useState<Realtor[]>(db.getRealtors());
  const [search, setSearch] = React.useState('');
  const [viewingRealtor, setViewingRealtor] = React.useState<Realtor | null>(null);

  const filteredRealtors = realtors.filter(r => 
    r.fullName.toLowerCase().includes(search.toLowerCase()) || 
    r.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Permanently delete Realtor Profile: ${name}?`)) {
      db.deleteRealtor(id);
      setRealtors(db.getRealtors());
      setViewingRealtor(null);
    }
  };

  const toggleStatus = (realtor: Realtor) => {
    const nextStatus = realtor.status === 'active' ? 'suspended' : 'active';
    const updated = { ...realtor, status: nextStatus as any };
    db.saveRealtor(updated);
    setRealtors(db.getRealtors());
    setViewingRealtor(updated);
  };

  const copyRegistrationLink = () => {
    const url = `${window.location.origin}/#/enroll/partner-elite-vx92`;
    navigator.clipboard.writeText(url);
    alert('Realtor signup link copied to clipboard! Share it with your potential partners.');
  };

  const RealtorDetailModal = ({ realtor }: { realtor: Realtor }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden border border-green-50">
        <div className="bg-green-600 p-10 text-white relative">
          <button 
            onClick={() => setViewingRealtor(null)} 
            className="absolute top-6 right-6 hover:bg-white/20 p-2 rounded-full transition-all"
          >
            <X size={24} />
          </button>
          
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 bg-white/20 rounded-[2rem] flex items-center justify-center text-3xl font-black border-4 border-white/10 shadow-2xl">
              {realtor.fullName.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="text-center md:text-left space-y-2">
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                <h2 className="text-3xl font-black tracking-tight">{realtor.fullName}</h2>
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 bg-white/10 flex items-center gap-2`}>
                   {realtor.status === 'active' ? <ShieldCheck size={12}/> : <Clock size={12}/>}
                   {realtor.status}
                </span>
              </div>
              <p className="text-green-100 font-bold text-xs uppercase tracking-[0.2em] opacity-80 flex items-center justify-center md:justify-start gap-2">
                <MapPin size={12} /> {realtor.location} • Enrolled {new Date(realtor.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <section>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Phone size={14} className="text-green-600" /> Communication Channels
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Mobile</span>
                  <span className="font-bold text-gray-900">{realtor.phone}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-black text-gray-400 uppercase">WhatsApp</span>
                  <span className="font-bold text-gray-900">{realtor.whatsapp}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Email</span>
                  <span className="font-bold text-gray-900 text-sm">{realtor.email}</span>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Landmark size={14} className="text-green-600" /> Remittance Credentials
              </h3>
              <div className="p-6 bg-green-50/50 rounded-[2rem] border-2 border-green-100 space-y-4">
                <div>
                  <label className="text-[9px] font-black text-green-400 uppercase tracking-widest block mb-1">Financial Institution</label>
                  <p className="font-black text-green-900 text-lg">{realtor.bankName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-green-100">
                  <div>
                    <label className="text-[9px] font-black text-green-400 uppercase tracking-widest block mb-1">Ledger Number</label>
                    <p className="font-bold text-green-950">{realtor.accountNumber}</p>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-green-400 uppercase tracking-widest block mb-1">Beneficiary</label>
                    <p className="font-bold text-green-950 truncate">{realtor.accountName}</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="flex gap-3">
              <button 
                onClick={() => toggleStatus(realtor)}
                className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl ${
                  realtor.status === 'active' ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {realtor.status === 'active' ? 'Suspend Partnership' : 'Activate Partnership'}
              </button>
              <button 
                onClick={() => handleDelete(realtor.id, realtor.fullName)}
                className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all border border-red-100"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Realtor Database</h1>
          <p className="text-gray-500 text-sm font-medium">Verify and manage the Dynamo Group Elite partner network.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={copyRegistrationLink}
            className="bg-green-600 text-white hover:bg-green-700 px-5 py-2.5 rounded-2xl flex items-center space-x-2 transition-all shadow-xl shadow-green-900/10 font-black text-[10px] uppercase tracking-[0.2em]"
          >
            <Share2 size={16} />
            <span>Recruitment Link</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Realtors by identity..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-[1.25rem] focus:ring-2 focus:ring-green-600 focus:outline-none font-bold text-gray-900 placeholder:text-gray-300"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black border-b border-gray-100">
              <tr>
                <th className="px-8 py-6">Professional Identity</th>
                <th className="px-8 py-6">Channels</th>
                <th className="px-8 py-6">Remittance Logic</th>
                <th className="px-8 py-6">Enrollment Status</th>
                <th className="px-8 py-6 text-center">Governance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRealtors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-gray-300">
                    <div className="flex flex-col items-center space-y-4">
                      <Award size={48} className="opacity-20" />
                      <p className="font-black uppercase tracking-widest text-xs">No Realtor Data Found</p>
                    </div>
                  </td>
                </tr>
              ) : filteredRealtors.map((realtor) => (
                <tr key={realtor.id} className="hover:bg-green-50/20 transition-all cursor-pointer" onClick={() => setViewingRealtor(realtor)}>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-50 text-green-700 rounded-2xl flex items-center justify-center font-black border border-green-100">
                        {realtor.fullName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-black text-gray-900 leading-tight">{realtor.fullName}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{realtor.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1.5">
                      <div className="flex items-center text-[10px] font-bold text-gray-500 space-x-2">
                        <Phone size={12} className="text-green-600" />
                        <span>{realtor.phone}</span>
                      </div>
                      <div className="flex items-center text-[10px] font-bold text-gray-500 space-x-2">
                        <Mail size={12} className="text-green-600" />
                        <span className="truncate max-w-[150px]">{realtor.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center space-x-3">
                      <Landmark className="text-gray-400" size={16} />
                      <div>
                        <p className="text-[10px] font-black text-gray-900 uppercase leading-none">{realtor.bankName}</p>
                        <p className="text-[9px] font-bold text-gray-400 mt-1">{realtor.accountNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center w-fit gap-1.5 ${
                      realtor.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' :
                      realtor.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                      'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      {realtor.status === 'active' ? <ShieldCheck size={12}/> : <Clock size={12}/>}
                      {realtor.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center space-x-3" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => toggleStatus(realtor)}
                        className={`p-2.5 rounded-xl transition-all shadow-md ${
                          realtor.status === 'active' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                        title={realtor.status === 'active' ? 'Suspend Access' : 'Activate Status'}
                      >
                        {realtor.status === 'active' ? <UserX size={18} /> : <UserCheck size={18} />}
                      </button>
                      <button 
                         onClick={() => handleDelete(realtor.id, realtor.fullName)}
                         className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all shadow-md"
                         title="Archive Permanent"
                      >
                         <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewingRealtor && <RealtorDetailModal realtor={viewingRealtor} />}
    </div>
  );
};

export default Realtors;
