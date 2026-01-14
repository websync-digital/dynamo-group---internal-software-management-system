import React from 'react';
import { db } from '../db';
import { Estate, Plot, Client, PaymentMethod, PlotStatus, Commission, InstallmentPlan } from '../types';
import { LayoutGrid, MapPin, X, Plus, Wallet, User, Tag } from 'lucide-react';

const Estates = () => {
  const [estates, setEstates] = React.useState<Estate[]>(db.getEstates());
  const [plots, setPlots] = React.useState<Plot[]>(db.getPlots());
  const [selectedEstate, setSelectedEstate] = React.useState<Estate | null>(estates[0] || null);
  const [sellingPlot, setSellingPlot] = React.useState<Plot | null>(null);
  const clients = db.getClients();

  const [saleForm, setSaleForm] = React.useState({
    clientId: '',
    realtorName: '',
    paymentMethod: 'bank_transfer' as PaymentMethod,
    status: 'sold' as PlotStatus,
    amountPaid: 0,
    commissionPct: 10
  });

  const filteredPlots = plots.filter(p => p.estateId === selectedEstate?.id);

  const handleSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellingPlot) return;

    const { clientId, realtorName, paymentMethod, status, amountPaid, commissionPct } = saleForm;
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const balance = sellingPlot.price - amountPaid;

    // 1. Update Plot
    const updatedPlot: Plot = { ...sellingPlot, status, clientId };
    db.savePlot(updatedPlot);

    // 2. Create Payment Record
    db.savePayment({
      id: Math.random().toString(36).substr(2, 9),
      clientId,
      plotId: sellingPlot.id,
      paymentDate: new Date().toISOString().split('T')[0],
      amountPaid,
      balance,
      paymentMethod,
    });

    // 3. Create Commission
    const commissionAmount = (sellingPlot.price * commissionPct) / 100;
    db.saveCommission({
      id: Math.random().toString(36).substr(2, 9),
      realtorName: realtorName || client.assignedRealtor,
      clientId,
      plotId: sellingPlot.id,
      amount: commissionAmount,
      percentage: commissionPct,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending'
    });

    // 4. Create Installment Plan if applicable
    if (status === 'installment') {
      db.saveInstallment({
        id: Math.random().toString(36).substr(2, 9),
        clientId,
        plotId: sellingPlot.id,
        totalAmount: sellingPlot.price,
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        remainingAmount: balance
      });
    }

    setPlots(db.getPlots());
    setSellingPlot(null);
    alert('Plot allocation completed successfully!');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estates & Plot Inventory</h1>
          <p className="text-gray-500 text-sm">Monitor available inventory and track plot ownership.</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg border border-gray-200">
          {estates.map(e => (
            <button
              key={e.id}
              onClick={() => setSelectedEstate(e)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedEstate?.id === e.id ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {e.name}
            </button>
          ))}
          <button className="px-4 py-2 rounded-md text-sm font-medium text-green-600 hover:bg-green-50">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {selectedEstate && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center space-x-2">
                <MapPin className="text-green-600" size={18} />
                <span>Estate Summary</span>
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Location</span><span className="font-medium">{selectedEstate.location}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Price Range</span><span className="font-medium">₦5M - ₦15M</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Available</span><span className="font-medium text-green-600">{filteredPlots.filter(p => p.status === 'available').length}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Sold</span><span className="font-medium text-red-600">{filteredPlots.filter(p => p.status === 'sold').length}</span></div>
              </div>
              <button className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-semibold hover:bg-black transition-colors">
                Print Inventory Report
              </button>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800">Plot Grid Layout</h3>
                <div className="flex space-x-3 text-[10px] font-bold uppercase text-gray-400">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-green-500"></div> Available</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-red-500"></div> Sold</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-orange-500"></div> Installment</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredPlots.map((plot) => (
                  <div 
                    key={plot.id}
                    onClick={() => plot.status === 'available' && setSellingPlot(plot)}
                    className={`p-4 rounded-lg border flex flex-col items-center justify-center space-y-1 relative group transition-all cursor-pointer ${
                      plot.status === 'available' ? 'bg-green-50 border-green-200 text-green-700 hover:border-green-400' :
                      plot.status === 'sold' ? 'bg-red-50 border-red-200 text-red-700' :
                      'bg-orange-50 border-orange-200 text-orange-700'
                    }`}
                  >
                    <span className="font-bold text-lg">{plot.plotNumber}</span>
                    <span className="text-[10px] uppercase font-bold tracking-tighter opacity-70">{plot.size}</span>
                    <div className="text-[10px] font-medium text-center truncate w-full">
                      {plot.status === 'available' ? 'Click to Assign' : (clients.find(c => c.id === plot.clientId)?.fullName || 'Assigned')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {sellingPlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-green-600 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">Assign Plot: {sellingPlot.plotNumber}</h2>
              <button onClick={() => setSellingPlot(null)} className="hover:bg-green-700 p-1 rounded-full"><X /></button>
            </div>
            <form onSubmit={handleSale} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 flex items-center gap-2"><User size={14}/> Select Client</label>
                <select required value={saleForm.clientId} onChange={e => setSaleForm({...saleForm, clientId: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none">
                  <option value="">-- Choose Client --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 flex items-center gap-2"><Tag size={14}/> Allocation Type</label>
                  <select value={saleForm.status} onChange={e => setSaleForm({...saleForm, status: e.target.value as any})} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none">
                    <option value="sold">Outright Sale</option>
                    <option value="installment">Installment Plan</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 flex items-center gap-2"><Wallet size={14}/> Payment Method</label>
                  <select value={saleForm.paymentMethod} onChange={e => setSaleForm({...saleForm, paymentMethod: e.target.value as any})} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none">
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="pos">POS</option>
                    <option value="cheque">Cheque</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Initial Deposit (₦)</label>
                <input required type="number" value={saleForm.amountPaid} onChange={e => setSaleForm({...saleForm, amountPaid: Number(e.target.value)})} className="w-full border p-2 rounded font-bold focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <div className="bg-gray-50 p-4 rounded text-sm space-y-1 border border-gray-100">
                <p className="flex justify-between"><span>Plot Price:</span> <span className="font-bold">₦{sellingPlot.price.toLocaleString()}</span></p>
                <p className="flex justify-between text-red-600"><span>Pending Balance:</span> <span className="font-bold">₦{(sellingPlot.price - saleForm.amountPaid).toLocaleString()}</span></p>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 shadow-lg transition-all active:scale-95">Complete Allocation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Estates;