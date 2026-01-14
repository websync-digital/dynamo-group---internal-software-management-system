
import React from 'react';
import { db } from '../db';
import { Commission, Client, Plot } from '../types';
import { Banknote, CheckCircle, Clock, Filter, FileText } from 'lucide-react';

const Commissions = () => {
  const [commissions, setCommissions] = React.useState<Commission[]>(db.getCommissions());
  const clients = db.getClients();
  const plots = db.getPlots();

  const toggleStatus = (id: string) => {
    const comm = commissions.find(c => c.id === id);
    if (comm) {
      const updated = { 
        ...comm, 
        status: (comm.status === 'pending' ? 'paid' : 'pending') as any,
        paidDate: comm.status === 'pending' ? new Date().toISOString().split('T')[0] : undefined
      };
      db.saveCommission(updated);
      setCommissions(db.getCommissions());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Management</h1>
          <p className="text-gray-500 text-sm">Track realtor earnings and payout statuses securely.</p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-50">
            <Filter size={18} />
            <span>Filter</span>
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-sm">
            <FileText size={18} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b">
            <tr>
              <th className="px-6 py-4">Realtor Name</th>
              <th className="px-6 py-4">Client / Plot</th>
              <th className="px-6 py-4 text-right">Commission Amount</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {commissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  No commission records found. Commissions are auto-generated on sales.
                </td>
              </tr>
            ) : commissions.map((comm) => (
              <tr key={comm.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-gray-900">{comm.realtorName}</td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <p className="font-medium">{clients.find(c => c.id === comm.clientId)?.fullName || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{plots.find(p => p.id === comm.plotId)?.plotNumber || 'N/A'}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="font-bold text-gray-900">₦{comm.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 font-bold">{comm.percentage}% rate</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{comm.dueDate}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    comm.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {comm.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => toggleStatus(comm.id)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                      comm.status === 'paid' ? 'bg-gray-100 text-gray-400' : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {comm.status === 'paid' ? 'Revert to Pending' : 'Mark as Paid'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Commissions;
