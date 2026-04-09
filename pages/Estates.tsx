import React from 'react';
import { db } from '../db';
import { supabase } from '../supabaseClient';
import SkeletonLoader from '../components/SkeletonLoader';
import { Estate, Plot, Client, PaymentMethod, PlotStatus, Commission, InstallmentPlan } from '../types';
import { LayoutGrid, MapPin, X, Plus, Wallet, User, Tag, Phone, Mail, Calendar, ShieldCheck, Clock, FileText, Loader2 } from 'lucide-react';
import { useInfiniteRealtime } from '../utils/useInfiniteRealtime';
import { useInView } from "../utils/useInView";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Estates = () => {
  const [selectedEstate, setSelectedEstate] = React.useState<Estate | null>(null);
  const [sellingPlot, setSellingPlot] = React.useState<Plot | null>(null);
  const [viewingOwnership, setViewingOwnership] = React.useState<{plot: Plot, client: Client} | null>(null);

    const { data: estates, isLoading: isLoadingEstates } = useInfiniteRealtime<Estate>({ 
    table: 'estates', 
    pageSize: 100,
    orderBy: 'name', // Sorted alphabetically to avoid createdAt confusion
    orderAscending: true 
  });
  const { data: clients } = useInfiniteRealtime<Client>({ table: 'clients', pageSize: 1000 });

  const { data: filteredPlots, isLoading: isLoadingPlots, hasNextPage, loadMore, isFetchingNextPage } = useInfiniteRealtime<Plot>({ 
    table: 'plots', 
    pageSize: 100, 
    orderBy: 'plotNumber', // Precision inventory requires identifier sorting
    orderAscending: true,
    filters: selectedEstate ? { estateId: selectedEstate.id } : undefined
  });

  const isLoading = isLoadingEstates || (selectedEstate && isLoadingPlots);

  const { ref, inView } = useInView({ threshold: 0 });

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      loadMore();
    }
  }, [inView, hasNextPage, isFetchingNextPage, loadMore]);

  React.useEffect(() => {
    if (!selectedEstate && estates.length > 0) {
      setSelectedEstate(estates[0]);
    }
  }, [estates, selectedEstate]);

  const [saleForm, setSaleForm] = React.useState({
    clientId: '',
    realtorName: '',
    paymentMethod: 'bank_transfer' as PaymentMethod,
    status: 'sold' as PlotStatus,
    amountPaid: 0,
    commissionPct: 10
  });

  const [isAddingPlot, setIsAddingPlot] = React.useState(false);
  const [editingPlot, setEditingPlot] = React.useState<Plot | null>(null);
  const [newPlotForm, setNewPlotForm] = React.useState({
    plotNumber: '',
    size: '500sqm',
    price: 5000000,
    status: 'available' as PlotStatus
  });

  const [isEditingBasePrice, setIsEditingBasePrice] = React.useState(false);
  const [tempBasePrice, setTempBasePrice] = React.useState<number>(0);

  const [isAddingEstate, setIsAddingEstate] = React.useState(false);
  const [newEstateForm, setNewEstateForm] = React.useState({
    name: '',
    location: '',
    totalPlots: 0,
    basePrice: 5000000
  });

  const [contextMenu, setContextMenu] = React.useState<{ x: number, y: number, type: 'estate' | 'plot', id: string, name: string } | null>(null);



  const handleSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellingPlot) return;

    const { clientId, realtorName, paymentMethod, status, amountPaid, commissionPct } = saleForm;
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const balance = sellingPlot.price - amountPaid;

    // 1. Update Plot
    const updatedPlot: Plot = { ...sellingPlot, status, clientId };
    await db.savePlot(updatedPlot);

    // 2. Create Payment Record
    await db.savePayment({
      clientId,
      plotId: sellingPlot.id,
      paymentDate: new Date().toISOString().split('T')[0],
      amountPaid,
      balance,
      paymentMethod,
    });

    // 3. Create Commission
    const commissionAmount = (sellingPlot.price * commissionPct) / 100;
    await db.saveCommission({
      realtorName: realtorName || client.assignedRealtor,
      clientId,
      plotId: sellingPlot.id,
      amount: commissionAmount,
      percentage: commissionPct,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    // 4. Create Installment Plan if applicable
    if (status === 'installment') {
      await db.saveInstallment({
        clientId,
        plotId: sellingPlot.id,
        totalAmount: sellingPlot.price,
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        remainingAmount: balance
      });
    }


    setSellingPlot(null);
    alert('Plot allocation completed successfully!');
  };

  const handleAddPlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEstate) return;

    const newPlot: Partial<Plot> = {
      plotNumber: newPlotForm.plotNumber,
      size: newPlotForm.size,
      price: newPlotForm.price,
      estateId: selectedEstate.id,
      status: newPlotForm.status
    };

    await db.savePlot(newPlot);

    setIsAddingPlot(false);
    setNewPlotForm({ plotNumber: '', size: '500sqm', price: selectedEstate.basePrice || 5000000, status: 'available' });
  };

  const handleEditPlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlot) return;

    await db.savePlot(editingPlot);

    setEditingPlot(null);
  };

  const handleSyncPrices = async () => {
    if (!selectedEstate || !selectedEstate.basePrice) return;
    if (window.confirm(`Synchronize all ${filteredPlots.filter(p => p.status === 'available').length} available plots to ₦${selectedEstate.basePrice.toLocaleString()}?`)) {
      await db.updateAvailablePlotPrices(selectedEstate.id, selectedEstate.basePrice);

      alert('Inventory pricing synchronized!');
    }
  };

  const handleUpdateEstatePrice = async (newPrice: number) => {
    if (!selectedEstate) return;
    const updated = { ...selectedEstate, basePrice: newPrice };
    await db.saveEstate(updated);

    setSelectedEstate(updated);
  };

  const handleAddEstate = async (e: React.FormEvent) => {
    e.preventDefault();
    const newEstate: Partial<Estate> = {
      name: newEstateForm.name,
      location: newEstateForm.location,
      totalPlots: newEstateForm.totalPlots,
      basePrice: newEstateForm.basePrice
    };

    await db.saveEstate(newEstate);

    setSelectedEstate(null); // Fetch logic will reselect appropriately or can be selected later
    setIsAddingEstate(false);
    setNewEstateForm({ name: '', location: '', totalPlots: 0, basePrice: 5000000 });
  };

  const handleDeleteEstate = (e: React.MouseEvent, estate: Estate) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'estate', id: estate.id, name: estate.name });
  };

  const handleDeletePlot = (e: React.MouseEvent, plot: Plot) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'plot', id: plot.id, name: plot.plotNumber });
  };

  const confirmDelete = async () => {
    if (!contextMenu) return;

    if (contextMenu.type === 'estate') {
      if (window.confirm(`Permanently delete "${contextMenu.name}" and all its plots?`)) {
        await db.deleteEstate(contextMenu.id);
        if (selectedEstate?.id === contextMenu.id) {
          setSelectedEstate(null);
        }

      }
    } else {
      if (window.confirm(`Delete plot ${contextMenu.name}?`)) {
        await db.deletePlot(contextMenu.id);

      }
    }
    setContextMenu(null);
  };

  const handlePlotClick = (plot: Plot) => {
    if (plot.status === 'available') {
      setSellingPlot(plot);
    } else if (plot.status === 'reserved') {
      setEditingPlot(plot);
    } else {
      const client = clients.find(c => c.id === plot.clientId);
      if (client) {
        setViewingOwnership({ plot, client });
      } else {
        alert('Owner information not found for this plot.');
      }
    }
  };

  const generateCatalogPDF = () => {
    if (!selectedEstate) return;
    const doc = new jsPDF();
    const primaryGreen: [number, number, number] = [5, 150, 105]; // #059669 (Emerald-600)
    const secondaryGray: [number, number, number] = [107, 114, 128]; // #6B7280 (Gray-500)

    // 1. Branding & Header - Dynamic Design & Rich Aesthetics
    doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text('DYNAMO GROUP', 15, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('HIGH-PRECISION ASSET INVENTORY CATALOG', 15, 33);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(`GENERATED: ${new Date().toLocaleString().toUpperCase()}`, 155, 25);

    // 2. Estate Metadata - Corporate Analytics
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(selectedEstate.name.toUpperCase(), 15, 55);
    
    doc.setFontSize(10);
    doc.setTextColor(secondaryGray[0], secondaryGray[1], secondaryGray[2]);
    doc.text(`LOCATION: ${selectedEstate.location.toUpperCase()}`, 15, 62);
    doc.text(`BASE VALUATION: NGN ${(selectedEstate.basePrice || 0).toLocaleString()}`, 15, 67);

    // 3. Inventory Table - High-Fidelity Data
    const tableData = filteredPlots.map(p => [
      p.plotNumber,
      p.size || 'N/A',
      `NGN ${p.price.toLocaleString()}`,
      p.status.toUpperCase(),
      p.status === 'available' ? 'IMMEDIATE' : 
      p.status === 'reserved' ? 'COMPANY PROTECTED' : 'ALLOCATED'
    ]);

    autoTable(doc, {
      startY: 75,
      head: [['PLOT ID', 'DIMENSION', 'MARKET PRICE', 'STATUS', 'AVAILABILITY']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: primaryGreen, 
        textColor: [255, 255, 255], 
        fontSize: 9, 
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { 
        fontSize: 8, 
        cellPadding: 4, 
        font: 'helvetica',
        halign: 'center'
      },
      alternateRowStyles: { 
        fillColor: [249, 250, 251] 
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const status = data.cell.raw as string;
          if (status === 'SOLD') data.cell.styles.textColor = [225, 29, 72]; // Rose-600
          if (status === 'AVAILABLE') data.cell.styles.textColor = [5, 150, 105]; // Emerald-600
          if (status === 'RESERVED') data.cell.styles.textColor = [100, 116, 139]; // Slate-500
        }
      }
    });

    // 4. Footer - Professional Polish
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(8);
    doc.setTextColor(secondaryGray[0], secondaryGray[1], secondaryGray[2]);
    doc.text('© 2026 DYNAMO GROUP MANAGEMENT SYSTEMS. ALL RIGHTS RESERVED.', 15, 285);
    doc.text('DOC_ID: ' + Math.random().toString(36).substr(2, 9).toUpperCase(), 165, 285);

    doc.save(`${selectedEstate.name.replace(/\s+/g, '_')}_Inventory_Catalog.pdf`);
  };

  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Estates & Plot Inventory</h1>
          <p className="text-gray-500 text-sm font-medium">Precision tracking for global property assets.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          {estates.map(e => (
            <button
              key={e.id}
              onClick={() => setSelectedEstate(e)}
              onContextMenu={(ev) => handleDeleteEstate(ev, e)}
              className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                selectedEstate?.id === e.id ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {e.name}
            </button>
          ))}
          <button 
            onClick={() => setIsAddingEstate(true)}
            className="px-4 py-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {selectedEstate && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl space-y-6">
              <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-[0.2em] flex items-center space-x-2">
                <MapPin className="text-green-600" size={16} />
                <span>Estate Analytics</span>
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Base Price</p>
                  <div className="flex items-center justify-between">
                    {isEditingBasePrice ? (
                      <div className="flex items-center space-x-2 w-full animate-in slide-in-from-left-2 duration-300">
                        <input 
                          autoFocus
                          type="text" 
                          value={tempBasePrice ? tempBasePrice.toLocaleString() : ''}
                          onChange={e => {
                            const raw = e.target.value.replace(/,/g, '');
                            if (!isNaN(Number(raw))) setTempBasePrice(Number(raw));
                          }}
                          className="w-full bg-white border-2 border-green-600 px-3 py-1.5 rounded-lg font-black text-gray-900 outline-none shadow-inner"
                        />
                        <button 
                          onClick={() => {
                            handleUpdateEstatePrice(tempBasePrice);
                            setIsEditingBasePrice(false);
                          }}
                          className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md transition-all active:scale-90"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </button>
                        <button 
                          onClick={() => setIsEditingBasePrice(false)}
                          className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all active:scale-90"
                        >
                          <X size={16} strokeWidth={3} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-2xl font-black text-gray-900 tracking-tighter">₦{(selectedEstate.basePrice || 0).toLocaleString()}</p>
                        <button 
                          onClick={() => {
                            setTempBasePrice(selectedEstate.basePrice || 0);
                            setIsEditingBasePrice(true);
                          }}
                          className="p-2 hover:bg-white rounded-xl transition-all text-green-600 border border-transparent hover:border-green-100 hover:shadow-sm"
                          title="Recalibrate Base Price"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                    <p className="text-[9px] font-black text-green-600 uppercase tracking-widest leading-none">Available</p>
                    <p className="text-xl font-black text-green-700 mt-1">{filteredPlots.filter(p => p.status === 'available').length}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-[9px] font-black text-red-600 uppercase tracking-widest leading-none">Sold</p>
                    <p className="text-xl font-black text-red-700 mt-1">{filteredPlots.filter(p => p.status === 'sold' || p.status === 'installment').length}</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Reserved</p>
                  <p className="text-xl font-black text-slate-700 mt-1">{filteredPlots.filter(p => p.status === 'reserved').length}</p>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <button 
                  onClick={handleSyncPrices}
                  className="w-full bg-gray-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] hover:bg-black shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2"
                >
                  <Tag size={14} />
                  <span>Sync Inventory Price</span>
                </button>
                <button 
                  onClick={generateCatalogPDF}
                  className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <FileText size={14} />
                  <span>Generate PDF Catalog</span>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Inventory Grid</h3>
                <div className="flex space-x-4 text-[9px] font-black uppercase tracking-widest text-gray-400">
                  <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-emerald-500 shadow-sm shadow-emerald-200"></div> Available</span>
                  <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-rose-500 shadow-sm shadow-rose-200"></div> Sold</span>
                  <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-amber-500 shadow-sm shadow-amber-200"></div> Installment</span>
                  <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-slate-500 shadow-sm shadow-slate-200"></div> Reserved</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {filteredPlots.map((plot) => (
                  <div 
                    key={plot.id}
                    onClick={() => handlePlotClick(plot)}
                    onContextMenu={(ev) => handleDeletePlot(ev, plot)}
                    className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center space-y-1 relative group transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                      plot.status === 'available' ? 'bg-white border-emerald-100 text-emerald-700 shadow-lg shadow-emerald-50 hover:border-emerald-300' :
                      plot.status === 'sold' ? 'bg-rose-50 border-rose-100 text-rose-700 shadow-lg shadow-rose-50 hover:border-rose-200' :
                      plot.status === 'installment' ? 'bg-amber-50 border-amber-100 text-amber-700 shadow-lg shadow-amber-50 hover:border-amber-200' :
                      'bg-slate-100 border-slate-200 text-slate-600 shadow-lg shadow-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-black text-xl tracking-tighter">{plot.plotNumber}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">₦{(plot.price / 1000000).toFixed(1)}M • {plot.size}</span>
                    <div className="mt-2 text-[9px] font-black uppercase tracking-widest py-1 px-3 rounded-full bg-gray-50 group-hover:bg-gray-200 transition-colors">
                      {plot.status === 'available' ? 'Assign' : 
                       plot.status === 'reserved' ? 'Reserved' :
                       (clients.find(c => c.id === plot.clientId)?.fullName.split(' ')[0] || 'Sold')}
                    </div>
                    {plot.status === 'available' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingPlot(plot); }}
                        className="absolute -top-2 -right-2 p-1.5 bg-white border border-gray-200 rounded-full shadow-md text-gray-400 hover:text-green-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Tag size={12} />
                      </button>
                    )}
                  </div>
                ))}
                
                <button 
                  onClick={() => setIsAddingPlot(true)}
                  className="p-5 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center space-y-2 text-gray-400 hover:border-green-400 hover:bg-green-50/30 hover:text-green-600 transition-all font-black text-[10px] uppercase tracking-widest"
                >
                  <Plus size={24} />
                  <span>Insert Plot</span>
                </button>
                {hasNextPage && (
                  <div ref={ref} className="p-5 rounded-2xl border-2 border-transparent flex flex-col items-center justify-center col-span-full">
                    <Loader2 className="animate-spin text-green-600 mx-auto" size={24} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plot Ownership Modal */}
      {viewingOwnership && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-blue-50">
            <div className="bg-blue-600 p-8 text-white relative">
              <button 
                onClick={() => setViewingOwnership(null)} 
                className="absolute top-6 right-6 hover:bg-white/20 p-2 rounded-full transition-all"
              >
                <X size={20} />
              </button>
              <div className="space-y-1">
                <h2 className="text-2xl font-black uppercase tracking-tight">Plot Ownership</h2>
                <p className="text-blue-100 font-bold text-xs uppercase tracking-widest opacity-80">
                  {selectedEstate?.name} • Plot {viewingOwnership.plot.plotNumber}
                </p>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner">
                  {viewingOwnership.client.fullName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">{viewingOwnership.client.fullName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      viewingOwnership.plot.status === 'sold' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {viewingOwnership.plot.status === 'sold' ? 'Fully Owned' : 'Installment Plan'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Phone size={14} className="text-blue-600" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone</span>
                  </div>
                  <span className="font-bold text-gray-900">{viewingOwnership.client.phone}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Mail size={14} className="text-blue-600" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</span>
                  </div>
                  <span className="font-bold text-gray-900">{viewingOwnership.client.email}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Calendar size={14} className="text-blue-600" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acquired</span>
                  </div>
                  <span className="font-bold text-gray-900">{new Date(viewingOwnership.plot.clientId ? (filteredPlots.find(p=>p.id===viewingOwnership.plot.id)?.clientId? '2026-04-01' : 'N/A') : 'N/A').toLocaleDateString()}</span>
                </div>
              </div>

              <div className="p-6 bg-blue-50 rounded-[2rem] border-2 border-blue-100 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Valuation</p>
                  <p className="text-2xl font-black text-blue-900">₦{viewingOwnership.plot.price.toLocaleString()}</p>
                </div>
                <ShieldCheck size={40} className="text-blue-200" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editing Plot Modal */}
      {editingPlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center text-gray-900">
              <h2 className="text-xl font-black uppercase tracking-tight">Edit Plot: {editingPlot.plotNumber}</h2>
              <button onClick={() => setEditingPlot(null)} className="hover:bg-gray-100 p-2 rounded-full transition-colors"><X/></button>
            </div>
            <form onSubmit={handleEditPlot} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plot Number</label>
                  <input required type="text" value={editingPlot.plotNumber} onChange={e => setEditingPlot({...editingPlot, plotNumber: e.target.value})} className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-green-500 outline-none font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Size</label>
                    <input required type="text" value={editingPlot.size} onChange={e => setEditingPlot({...editingPlot, size: e.target.value})} className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-green-500 outline-none font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price (₦)</label>
                    <input required type="text" value={editingPlot.price ? editingPlot.price.toLocaleString() : ''} onChange={e => { const r = e.target.value.replace(/,/g, ''); if(!isNaN(Number(r))) setEditingPlot({...editingPlot, price: Number(r)})}} className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-green-500 outline-none font-black" />
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <input 
                    type="checkbox" 
                    id="edit-reserved"
                    checked={editingPlot.status === 'reserved'} 
                    onChange={e => setEditingPlot({...editingPlot, status: e.target.checked ? 'reserved' : 'available'})}
                    className="w-5 h-5 rounded border-gray-300 text-slate-600 focus:ring-slate-500"
                  />
                  <label htmlFor="edit-reserved" className="text-sm font-black text-slate-700 uppercase tracking-tight cursor-pointer">
                    Mark as Company Reserved Asset
                  </label>
                </div>
              </div>
              <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Update Plot Ledger</button>
            </form>
          </div>
        </div>
      )}

      {/* Selling Plot Modal */}
      {sellingPlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 bg-green-600 text-white flex justify-between items-center font-black uppercase tracking-tight">
              <h2 className="text-xl">Assign Plot: {sellingPlot.plotNumber}</h2>
              <button onClick={() => setSellingPlot(null)} className="hover:bg-green-700 p-2 rounded-full transition-colors"><X/></button>
            </div>
            <form onSubmit={handleSale} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><User size={14}/> Select Verified Client</label>
                <select required value={saleForm.clientId} onChange={e => setSaleForm({...saleForm, clientId: e.target.value})} className="w-full border-2 border-gray-100 p-4 rounded-2xl font-bold focus:border-green-500 outline-none">
                  <option value="">-- Choose Client --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Tag size={14}/> Allocation Type</label>
                  <select value={saleForm.status} onChange={e => setSaleForm({...saleForm, status: e.target.value as any})} className="w-full border-2 border-gray-100 p-4 rounded-2xl font-black focus:border-green-500 outline-none">
                    <option value="sold">Outright Sale</option>
                    <option value="installment">Installment Plan</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Wallet size={14}/> Payment Channel</label>
                  <select value={saleForm.paymentMethod} onChange={e => setSaleForm({...saleForm, paymentMethod: e.target.value as any})} className="w-full border-2 border-gray-100 p-4 rounded-2xl font-black focus:border-green-500 outline-none">
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="pos">POS</option>
                    <option value="cheque">Cheque</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Initial Deposit Token (₦)</label>
                <input required type="text" value={saleForm.amountPaid ? saleForm.amountPaid.toLocaleString() : ''} onChange={e => { const r = e.target.value.replace(/,/g, ''); if(!isNaN(Number(r))) setSaleForm({...saleForm, amountPaid: Number(r)})}} className="w-full border-2 border-gray-100 p-4 rounded-2xl font-black text-lg focus:border-green-500 outline-none" />
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl space-y-2 border border-gray-100">
                <p className="flex justify-between items-center text-xs font-bold text-gray-400"><span>CONTRACT PRICE:</span> <span className="font-black text-gray-900">₦{sellingPlot.price.toLocaleString()}</span></p>
                <p className="flex justify-between items-center text-xs font-bold text-red-400"><span>PENDING REMITTANCE:</span> <span className="font-black text-red-600">₦{(sellingPlot.price - saleForm.amountPaid).toLocaleString()}</span></p>
              </div>
              <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-all">Execute Legal Allocation</button>
            </form>
          </div>
        </div>
      )}

      {/* Insert Plot Modal */}
      {isAddingPlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 bg-gray-900 text-white flex justify-between items-center font-black uppercase tracking-tight">
              <h2 className="text-xl">Insert New Plot: {selectedEstate?.name}</h2>
              <button onClick={() => setIsAddingPlot(false)} className="hover:bg-gray-800 p-2 rounded-full transition-colors"><X/></button>
            </div>
            <form onSubmit={handleAddPlot} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plot Identifier</label>
                <input required type="text" placeholder="e.g. PLT-115" value={newPlotForm.plotNumber} onChange={e => setNewPlotForm({...newPlotForm, plotNumber: e.target.value})} className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-green-500 outline-none font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dimension</label>
                  <input required type="text" value={newPlotForm.size} onChange={e => setNewPlotForm({...newPlotForm, size: e.target.value})} className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-green-500 outline-none font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unit Price (₦)</label>
                  <input required type="text" value={newPlotForm.price ? newPlotForm.price.toLocaleString() : ''} onChange={e => { const r = e.target.value.replace(/,/g, ''); if(!isNaN(Number(r))) setNewPlotForm({...newPlotForm, price: Number(r)})}} className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-green-500 outline-none font-black" />
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <input 
                  type="checkbox" 
                  id="mark-reserved"
                  checked={newPlotForm.status === 'reserved'} 
                  onChange={e => setNewPlotForm({...newPlotForm, status: e.target.checked ? 'reserved' : 'available'})}
                  className="w-5 h-5 rounded border-gray-300 text-slate-600 focus:ring-slate-500"
                />
                <label htmlFor="mark-reserved" className="text-sm font-black text-slate-700 uppercase tracking-tight cursor-pointer">
                  Mark as Company Reserved Asset
                </label>
              </div>
              <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Append to Inventory</button>
            </form>
          </div>
        </div>
      )}

      {/* Register Estate Modal */}
      {isAddingEstate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 bg-green-700 text-white flex justify-between items-center font-black uppercase tracking-tight">
              <h2 className="text-xl">Register New Estate Entity</h2>
              <button onClick={() => setIsAddingEstate(false)} className="hover:bg-green-800 p-2 rounded-full transition-colors"><X/></button>
            </div>
            <form onSubmit={handleAddEstate} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estate Branding Name</label>
                  <input required type="text" placeholder="e.g. Diamond Fields" value={newEstateForm.name} onChange={e => setNewEstateForm({...newEstateForm, name: e.target.value})} className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-green-700 outline-none font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Asset Location</label>
                  <input required type="text" placeholder="e.g. Lekki Tech City" value={newEstateForm.location} onChange={e => setNewEstateForm({...newEstateForm, location: e.target.value})} className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-green-700 outline-none font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Plot Count</label>
                    <input required type="text" value={newEstateForm.totalPlots ? newEstateForm.totalPlots.toLocaleString() : ''} onChange={e => { const r = e.target.value.replace(/,/g, ''); if(!isNaN(Number(r))) setNewEstateForm({...newEstateForm, totalPlots: Number(r)})}} className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-green-700 outline-none font-black" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Entry Base Price (₦)</label>
                    <input required type="text" value={newEstateForm.basePrice ? newEstateForm.basePrice.toLocaleString() : ''} onChange={e => { const r = e.target.value.replace(/,/g, ''); if(!isNaN(Number(r))) setNewEstateForm({...newEstateForm, basePrice: Number(r)})}} className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-green-700 outline-none font-black" />
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full bg-green-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Initialize Estate Ledger</button>
            </form>
          </div>
        </div>
      )}

      {contextMenu && (
        <div 
          className="fixed z-[100] bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden w-56 animate-in fade-in zoom-in duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          <div className="p-3 bg-gray-50 border-b border-gray-100">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] truncate">Options: {contextMenu.name}</p>
          </div>
          <button 
            onClick={confirmDelete}
            className="w-full flex items-center space-x-2 px-5 py-4 text-red-600 hover:bg-red-50 transition-colors text-[10px] font-black uppercase tracking-widest"
          >
            <X size={14} />
            <span>Liquidate Item</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Estates;