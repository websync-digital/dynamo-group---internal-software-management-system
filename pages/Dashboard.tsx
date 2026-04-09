import React from 'react';
import { db } from '../db';
import { supabase } from '../supabaseClient';
import SkeletonLoader from '../components/SkeletonLoader';
import { Users, MapPin, TrendingUp, AlertCircle, Clock, Banknote } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
      <h3 className="text-2xl font-bold mt-1 text-gray-800">{value}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
    <div className={`p-4 rounded-xl shadow-inner ${color}`}>
      <Icon className="text-white" size={28} />
    </div>
  </div>
);

const Dashboard = () => {
  const [clients, setClients] = React.useState([]);
  const [plots, setPlots] = React.useState([]);
  const [commissions, setCommissions] = React.useState([]);
  const [installments, setInstallments] = React.useState([]);
  const [estates, setEstates] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      const [fetchedClients, fetchedPlots, fetchedCommissions, fetchedInstallments, fetchedEstates] = await Promise.all([
        db.getClients(),
        db.getPlots(),
        db.getCommissions(),
        db.getInstallments(),
        db.getEstates()
      ]);
      
      setClients(fetchedClients);
      setPlots(fetchedPlots);
      setCommissions(fetchedCommissions);
      setInstallments(fetchedInstallments);
      setEstates(fetchedEstates);
      setIsLoading(false);
    };
    fetchData();

    const channel = supabase.channel('public:dashboard_sync')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return <SkeletonLoader />;
  }

  const totalClients = clients.length;
  const plotsSold = plots.filter(p => p.status !== 'available').length;
  const pendingCommissionsCount = commissions.filter(c => c.status === 'pending').length;
  const pendingCommissionsValue = commissions.filter(c => c.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
  const outstandingPaymentsValue = installments.reduce((acc, curr) => acc + curr.remainingAmount, 0);

  const chartData = estates.map(e => ({
    name: e.name.split(' ')[0],
    sold: plots.filter(p => p.estateId === e.id && p.status !== 'available').length,
    total: e.totalPlots
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Internal Management Dashboard</h1>
          <p className="text-gray-500">Staff-only access to Dynamo Group key performance indicators.</p>
        </div>
        <div className="bg-green-50 border border-green-100 px-4 py-2 rounded-lg">
          <p className="text-xs text-green-700 font-bold">System Status: Secure & Online</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Clients" value={totalClients} icon={Users} color="bg-green-600" subtitle="Staff-assigned profiles" />
        <StatCard title="Plots Sold" value={plotsSold} icon={MapPin} color="bg-blue-600" subtitle={`of ${plots.length} cataloged plots`} />
        <StatCard title="Commissions Pending" value={`₦${pendingCommissionsValue.toLocaleString()}`} icon={Banknote} color="bg-orange-600" subtitle={`${pendingCommissionsCount} active payouts`} />
        <StatCard title="Outstanding" value={`₦${outstandingPaymentsValue.toLocaleString()}`} icon={AlertCircle} color="bg-red-600" subtitle="Total installment debt" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold">Estate Sales Performance</h3>
            <span className="text-xs font-bold text-gray-400 uppercase">Plots Sold per Estate</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="sold" fill="#16a34a" radius={[6, 6, 0, 0]} name="Sold Plots" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Clock className="text-orange-500" size={20} /> Upcoming Dues
          </h3>
          <div className="space-y-4 flex-1">
            {installments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2">
                <Clock size={48} className="text-gray-100" />
                <p className="text-sm text-gray-400 font-medium">No active installments found.</p>
              </div>
            ) : installments.slice(0, 5).map((inst, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-orange-200 transition-colors">
                <div>
                  <p className="text-sm font-bold text-gray-800">{clients.find(c => c.id === inst.clientId)?.fullName}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Due: {inst.nextDueDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-orange-600">₦{(inst.remainingAmount / 6).toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Next Pmt</p>
                </div>
              </div>
            ))}
          </div>
          {installments.length > 0 && (
            <button className="mt-6 w-full text-center text-xs font-bold text-green-600 hover:text-green-700 uppercase tracking-widest pt-4 border-t border-gray-50">
              View All Reminders
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;