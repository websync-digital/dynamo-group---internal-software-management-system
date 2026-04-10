import React from 'react';
import { db } from '../db';
import { supabase } from '../supabaseClient';
import SkeletonLoader from '../components/SkeletonLoader';
import { Commission, Client, Plot, CommissionStatus } from '../types';
import { 
  Banknote, 
  CheckCircle, 
  Clock, 
  Filter, 
  FileText, 
  Search, 
  TrendingUp, 
  Wallet,
  User as UserIcon,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useInfiniteRealtime } from '../utils/useInfiniteRealtime';
import { useInView } from "../utils/useInView";

const MetricCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-2">{title}</p>
      <h3 className="text-xl font-bold text-gray-900">{value}</h3>
      {subtitle && <p className="text-[10px] text-gray-500 font-medium mt-1">{subtitle}</p>}
    </div>
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="text-white" size={20} />
    </div>
  </div>
);

const Commissions = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<CommissionStatus | 'all'>('all');

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const { data: commissions, isLoading, hasNextPage, loadMore, isFetchingNextPage } = useInfiniteRealtime<Commission>({
    table: 'commissions',
    pageSize: 50,
    orderBy: 'createdAt',
    orderAscending: false,
    searchFields: ['realtorName'],
    searchValue: debouncedSearch,
    filters: statusFilter !== 'all' ? { status: statusFilter } : undefined
  });

  const { data: clients } = useInfiniteRealtime<Client>({ table: 'clients', pageSize: 1000 });
  const { data: plots } = useInfiniteRealtime<Plot>({ table: 'plots', pageSize: 1000, orderBy: 'id' });
  const { data: realtors } = useInfiniteRealtime<any>({ table: 'realtors', pageSize: 1000 });

  const { ref, inView } = useInView({ threshold: 0 });

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      loadMore();
    }
  }, [inView, hasNextPage, isFetchingNextPage, loadMore]);

  // Metrics calculation
  const totalPayouts = commissions.reduce((acc, c) => acc + c.amount, 0);
  const pendingAmount = commissions.filter(c => c.status === 'pending').reduce((acc, c) => acc + c.amount, 0);
  const paidAmount = commissions.filter(c => c.status === 'paid').reduce((acc, c) => acc + c.amount, 0);
  
  // Find top realtor
  const realtorTotals = commissions.reduce((acc, c) => {
    acc[c.realtorName] = (acc[c.realtorName] || 0) + c.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const topRealtor = Object.entries(realtorTotals).sort((a, b) => (b[1] as number) - (a[1] as number))[0];

  const toggleStatus = async (id: string) => {
    const comm = commissions.find(c => c.id === id);
    if (comm) {
      const updated = { 
        ...comm, 
        status: (comm.status === 'pending' ? 'paid' : 'pending') as any,
        paidDate: comm.status === 'pending' ? new Date().toISOString().split('T')[0] : undefined
      };
      await db.saveCommission(updated);
    }
  };

  const exportCSV = () => {
    const headers = ['Realtor', 'Client', 'Plot', 'Amount', 'Percentage', 'Due Date', 'Status'];
    const rows = filteredCommissions.map(c => [
      c.realtorName,
      clients.find(cl => cl.id === c.clientId)?.fullName || 'N/A',
      plots.find(p => p.id === c.plotId)?.plotNumber || 'N/A',
      c.amount,
      c.percentage + '%',
      c.dueDate,
      c.status
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `commissions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCommissions = [...commissions]
    .sort((a, b) => {
      if (a.status === 'pending' && b.status === 'paid') return -1;
      if (a.status === 'paid' && b.status === 'pending') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Management</h1>
          <p className="text-gray-500 text-sm italic">"Precision in payouts, excellence in service."</p>
        </div>
        <button 
          onClick={exportCSV}
          className="bg-white border border-gray-200 text-gray-800 px-5 py-2.5 rounded-lg flex items-center space-x-2 hover:bg-gray-50 shadow-sm transition-all font-bold text-xs uppercase"
        >
          <FileText size={16} className="text-green-600" />
          <span>Export Ledger</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Projected" value={`₦${totalPayouts.toLocaleString()}`} icon={Wallet} color="bg-gray-800" subtitle="Grand total payout ledger" />
        <MetricCard title="Pending Payouts" value={`₦${pendingAmount.toLocaleString()}`} icon={Clock} color="bg-orange-500" subtitle={`${commissions.filter(c => c.status === 'pending').length} items awaiting clearance`} />
        <MetricCard title="Settled to Date" value={`₦${paidAmount.toLocaleString()}`} icon={CheckCircle} color="bg-green-600" subtitle="Verified successful transfers" />
        <MetricCard title="Top Realtor" value={topRealtor ? topRealtor[0] : 'N/A'} icon={TrendingUp} color="bg-blue-600" subtitle={topRealtor ? `₦${topRealtor[1].toLocaleString()} earned` : 'No data'} />
      </div>

      {/* Filter Section */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search realtor or client name..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none shadow-sm transition-all text-sm"
          />
        </div>
        <div className="flex bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
          {(['all', 'pending', 'paid'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                statusFilter === filter ? 'bg-green-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-900 text-gray-300 text-[10px] uppercase tracking-[0.15em] font-black border-b border-gray-800">
              <tr>
                <th className="px-8 py-5">Realtor Identity</th>
                <th className="px-8 py-5">Client / Plot Details</th>
                <th className="px-8 py-5">Account Details</th>
                <th className="px-8 py-5 text-right">Payout Value</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center space-y-3 opacity-30">
                      <Banknote size={48} />
                      <p className="font-bold text-lg uppercase tracking-widest">Finances Clean</p>
                      <p className="text-xs">No records matching your search were found.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredCommissions.map((comm) => (
                <tr key={comm.id} className="group hover:bg-green-50/30 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-green-200 flex items-center justify-center text-green-700 font-black text-xs">
                        {getInitials(comm.realtorName)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 leading-none">{comm.realtorName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Certified Associate</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm">
                      <div className="flex items-center space-x-1 font-bold text-gray-800">
                        <UserIcon size={14} className="text-gray-400" />
                        <span>{clients.find(c => c.id === comm.clientId)?.fullName || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-[10px] text-gray-500 font-bold uppercase mt-1">
                        <ArrowRight size={10} />
                        <span>{plots.find(p => p.id === comm.plotId)?.plotNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {(() => {
                      const realtor = realtors.find(r => r.fullName === comm.realtorName);
                      return realtor ? (
                        <div className="space-y-1">
                          <p className="text-xs font-black text-gray-900 uppercase tracking-widest">{realtor.bankName}</p>
                          <p className="text-sm font-black text-green-700 font-mono tracking-tighter">{realtor.accountNumber}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase truncate max-w-[120px]">{realtor.accountName}</p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-300 font-bold uppercase italic">No Linked Bank Data</span>
                      );
                    })()}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <p className="font-black text-gray-900 text-base">₦{comm.amount.toLocaleString()}</p>
                    <div className="inline-block px-2 py-0.5 bg-gray-100 rounded text-[9px] font-black text-gray-500 uppercase mt-1">
                      {comm.percentage}% rate
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center">
                      <span className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        comm.status === 'paid' 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-orange-100 text-orange-700 border border-orange-200'
                      }`}>
                        {comm.status === 'paid' ? <CheckCircle size={12} /> : <Clock size={12} />}
                        <span>{comm.status}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <button 
                      onClick={() => toggleStatus(comm.id)}
                      className={`w-full py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        comm.status === 'paid' 
                          ? 'bg-gray-100 text-gray-400 hover:bg-gray-200' 
                          : 'bg-green-600 text-white hover:bg-green-700 shadow-md active:scale-95'
                      }`}
                    >
                      {comm.status === 'paid' ? 'Undo Audit' : 'Confirm Payout'}
                    </button>
                  </td>
                </tr>
              ))}
              {hasNextPage && (
                <tr ref={ref}>
                  <td colSpan={6} className="py-6 text-center">
                    <Loader2 className="animate-spin text-green-600 mx-auto" size={24} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Commissions;
