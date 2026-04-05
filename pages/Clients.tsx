import React from 'react';
import { db } from '../db';
import { Client, PaymentRecord, Plot } from '../types';
import { Search, Plus, Phone, Mail, MapPin, ExternalLink, X, FileText, History, CreditCard, Trash2, Share2 } from 'lucide-react';

const Clients = () => {
  const [clients, setClients] = React.useState<Client[]>(db.getClients());
  const [search, setSearch] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [viewingClient, setViewingClient] = React.useState<Client | null>(null);
  const [newClient, setNewClient] = React.useState<Partial<Client>>({});

  const filteredClients = clients.filter(c => 
    c.fullName.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    const client: Client = {
      id: Math.random().toString(36).substr(2, 9),
      fullName: newClient.fullName || '',
      dob: newClient.dob || '',
      phone: newClient.phone || '',
      email: newClient.email || '',
      address: newClient.address || '',
      assignedRealtor: newClient.assignedRealtor || '',
      referralSource: newClient.referralSource || 'Direct',
      createdAt: new Date().toISOString(),
    };
    db.saveClient(client);
    setClients(db.getClients());
    setIsModalOpen(false);
    setNewClient({});
  };

  const handleDeleteClient = (clientId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete profile of ${name}? This will also unassign any plots they own.`)) {
      db.deleteClient(clientId);
      setClients(db.getClients());
      setViewingClient(null);
    }
  };

  const ClientDetailModal = ({ client }: { client: Client }) => {
    const payments = db.getPaymentsByClient(client.id);
    const assignedPlots = db.getPlots().filter(p => p.clientId === client.id);
    const estates = db.getEstates();

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-green-700 text-white p-6 flex justify-between items-center z-10">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                {client.fullName.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{client.fullName}</h2>
                <p className="text-green-100 opacity-80">Registered: {new Date(client.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleDeleteClient(client.id, client.fullName)}
                className="hover:bg-red-600/50 p-2 rounded-full transition-colors"
                title="Delete Client Profile"
              >
                <Trash2 size={20} />
              </button>
              <button onClick={() => setViewingClient(null)} className="hover:bg-green-800 p-2 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-6">
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                  <FileText size={14} /> Basic Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">DOB:</span> {client.dob}</p>
                  <p><span className="text-gray-500">Phone:</span> {client.phone}</p>
                  <p><span className="text-gray-500">Email:</span> {client.email}</p>
                  <p><span className="text-gray-500">Address:</span> {client.address}</p>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                  <MapPin size={14} /> Assigned Assets
                </h3>
                <div className="space-y-2">
                  {assignedPlots.length === 0 ? (
                    <p className="text-xs text-gray-400">No plots assigned yet.</p>
                  ) : assignedPlots.map(p => (
                    <div key={p.id} className="p-3 bg-gray-50 rounded border border-gray-100">
                      <p className="font-bold text-gray-800">{p.plotNumber}</p>
                      <p className="text-xs text-gray-500">{estates.find(e => e.id === p.estateId)?.name}</p>
                      <span className={`text-[10px] px-1 rounded font-bold uppercase ${p.status === 'sold' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="md:col-span-2 space-y-8">
              <section>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <CreditCard className="text-green-600" size={20} /> Payment Records
                </h3>
                <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-gray-600">Date</th>
                        <th className="px-4 py-3 font-semibold text-gray-600">Amount</th>
                        <th className="px-4 py-3 font-semibold text-gray-600">Method</th>
                        <th className="px-4 py-3 font-semibold text-gray-600">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {payments.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No payments found</td></tr>
                      ) : payments.map(pay => (
                        <tr key={pay.id}>
                          <td className="px-4 py-3">{pay.paymentDate}</td>
                          <td className="px-4 py-3 font-bold">₦{pay.amountPaid.toLocaleString()}</td>
                          <td className="px-4 py-3 uppercase text-[10px] font-bold">{pay.paymentMethod.replace('_', ' ')}</td>
                          <td className="px-4 py-3 text-red-600 font-medium">₦{pay.balance.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <History className="text-green-600" size={20} /> Interaction History
                </h3>
                <div className="space-y-4">
                   <div className="border-l-2 border-green-200 pl-4 relative">
                      <div className="absolute w-3 h-3 bg-green-500 rounded-full -left-[7px] top-1 border-2 border-white"></div>
                      <p className="text-xs font-bold text-gray-400">{new Date(client.createdAt).toLocaleDateString()}</p>
                      <p className="text-sm font-medium">Initial Profile Created</p>
                      <p className="text-xs text-gray-500">Source: {client.referralSource}</p>
                   </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Profiling</h1>
          <p className="text-gray-500 text-sm">Manage client information and investment history.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => {
              const url = `${window.location.origin}/#/register/asset-secure-px45`;
              navigator.clipboard.writeText(url);
              alert('Registration link copied to clipboard! You can now send this to your client.');
            }}
            className="border-2 border-green-600 text-green-600 hover:bg-green-50 px-4 py-2 rounded-xl flex items-center space-x-2 transition-all font-black text-[10px] uppercase tracking-widest"
          >
            <Share2 size={16} />
            <span>Registration Link</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl flex items-center space-x-2 transition-all shadow-xl font-black text-[10px] uppercase tracking-widest"
          >
            <Plus size={20} />
            <span>Direct Profile</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center bg-gray-50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Assigned Realtor</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-50 text-green-700 rounded-full flex items-center justify-center font-bold">
                        {client.fullName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{client.fullName}</p>
                        <p className="text-xs text-gray-500">Born: {client.dob}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-gray-600 space-x-2">
                        <Phone size={12} className="text-gray-400" />
                        <span>{client.phone}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-600 space-x-2">
                        <Mail size={12} className="text-gray-400" />
                        <span>{client.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{client.assignedRealtor}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      {client.referralSource}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => setViewingClient(client)}
                        className="text-green-600 hover:text-green-800 flex items-center space-x-1 text-sm font-medium"
                      >
                        <span>View Profile</span>
                        <ExternalLink size={14} />
                      </button>
                      <button 
                         onClick={() => handleDeleteClient(client.id, client.fullName)}
                         className="text-red-400 hover:text-red-600 p-1"
                         title="Delete Profiling"
                      >
                         <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No clients found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-green-600 text-white">
              <h2 className="text-xl font-bold">Add New Client</h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-green-700 p-1 rounded-full">
                <Plus className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleAddClient} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                <input required type="text" value={newClient.fullName || ''} onChange={e => setNewClient({...newClient, fullName: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" placeholder="John Doe" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                <input required type="email" value={newClient.email || ''} onChange={e => setNewClient({...newClient, email: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" placeholder="john@example.com" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                <input required type="tel" value={newClient.phone || ''} onChange={e => setNewClient({...newClient, phone: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" placeholder="+234..." />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Date of Birth</label>
                <input required type="date" value={newClient.dob || ''} onChange={e => setNewClient({...newClient, dob: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Address</label>
                <textarea value={newClient.address || ''} onChange={e => setNewClient({...newClient, address: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" rows={2} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Assigned Realtor</label>
                <input type="text" value={newClient.assignedRealtor || ''} onChange={e => setNewClient({...newClient, assignedRealtor: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Referral Source</label>
                <select value={newClient.referralSource || ''} onChange={e => setNewClient({...newClient, referralSource: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none">
                  <option value="Direct">Direct</option>
                  <option value="Realtor">Realtor</option>
                  <option value="Social Media">Social Media</option>
                </select>
              </div>
              <div className="md:col-span-2 pt-4 flex justify-end">
                <button type="submit" className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-green-700">Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingClient && <ClientDetailModal client={viewingClient} />}
    </div>
  );
};

export default Clients;