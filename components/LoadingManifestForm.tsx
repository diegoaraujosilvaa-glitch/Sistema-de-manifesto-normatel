
import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, 
  Scan, 
  Trash2, 
  AlertCircle, 
  FileDown, 
  Eye,
  Loader2,
  X,
  ExternalLink,
  Download,
  Printer,
  Clock,
  Calendar,
  Plus,
  ClipboardList,
  CheckCircle2
} from 'lucide-react';
import { 
  Driver, 
  Vehicle, 
  Branch, 
  DistributionCenter, 
  LoadingManifest, 
  InvoiceItem,
  Manifest
} from '../types';
import { generateLoadingManifestPDF } from '../services/pdfGenerator';

interface LoadingManifestFormProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  branches: Branch[];
  cds: DistributionCenter[];
  pendingManifests: Manifest[];
  onSave: (m: LoadingManifest) => void;
  currentUser: { name: string; uid: string };
}

const LoadingManifestForm: React.FC<LoadingManifestFormProps> = ({ 
  drivers, 
  vehicles, 
  branches, 
  cds, 
  pendingManifests,
  onSave,
  currentUser
}) => {
  const [formData, setFormData] = useState({
    manifestNumber: `MC-${Date.now().toString().substr(-6)}`,
    cdId: cds[0]?.id || '',
    branchId: '',
    driverId: '',
    vehicleId: '',
    sealNumber: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    exitTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  });

  const [selectedManifestIds, setSelectedManifestIds] = useState<string[]>([]);
  const [currentManifestId, setCurrentManifestId] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [tempInvoices, setTempInvoices] = useState<InvoiceItem[]>([]);
  const [scannerInput, setScannerInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const scannerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const activeDrivers = drivers.filter(d => d.status === 'ATIVO');
  const activeVehicles = vehicles.filter(v => v.status === 'ATIVO');
  const activeBranches = branches.filter(b => b.status === 'ATIVO');

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const val = scannerInput.trim();
    if (val.length !== 44 || !/^\d+$/.test(val)) {
      setError("Chave de acesso inválida (44 dígitos)");
      setScannerInput('');
      return;
    }
    if (invoices.some(i => i.key === val) || tempInvoices.some(i => i.key === val)) {
      setError("NF já bipada.");
      setScannerInput('');
      return;
    }
    const nfNumber = val.substring(25, 34);
    setTempInvoices([{ key: val, number: nfNumber }, ...tempInvoices]);
    setScannerInput('');
    scannerRef.current?.focus();
  };

  const removeInvoice = (key: string) => setInvoices(invoices.filter(i => i.key !== key));
  const removeTempInvoice = (key: string) => setTempInvoices(tempInvoices.filter(i => i.key !== key));

  const handleLinkNFs = () => {
    if (!currentManifestId) {
      setError("Selecione um manifesto primeiro.");
      return;
    }
    if (tempInvoices.length === 0) {
      setError("Bipe pelo menos uma NF para vincular.");
      return;
    }

    const manifest = pendingManifests.find(m => m.id === currentManifestId);
    if (!manifest) return;

    const linkedInvoices = tempInvoices.map(inv => ({
      ...inv,
      manifestNumber: manifest.manifestNumber
    }));

    setInvoices([...linkedInvoices, ...invoices]);
    setSelectedManifestIds(prev => prev.includes(currentManifestId) ? prev : [...prev, currentManifestId]);
    setTempInvoices([]);
    setCurrentManifestId(null);
    setError(null);
  };

  const toggleManifest = (id: string) => {
    setCurrentManifestId(id === currentManifestId ? null : id);
  };

  const validate = () => {
    if (!formData.branchId || !formData.driverId || !formData.vehicleId || !formData.exitTime || !formData.deliveryDate) return "Preencha todos os campos obrigatórios";
    if (selectedManifestIds.length === 0) return "Selecione pelo menos um manifesto de palete";
    if (invoices.length === 0) return "Bipe pelo menos uma NF";
    return null;
  };

  const constructManifest = (): LoadingManifest => {
    const cd = cds.find(c => c.id === formData.cdId);
    const branch = branches.find(b => b.id === formData.branchId);
    const driver = drivers.find(d => d.id === formData.driverId);
    const vehicle = vehicles.find(v => v.id === formData.vehicleId);
    return {
      id: `lm_${Date.now()}`,
      ...formData,
      linkedManifestIds: selectedManifestIds,
      invoices,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
      cdName: cd?.name || '',
      branchName: branch?.name || '',
      driverName: driver?.name || '',
      vehiclePlate: vehicle?.plate || ''
    };
  };

  const handlePreview = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setIsGenerating(true);
    try {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const m = constructManifest();
      const url = await generateLoadingManifestPDF(m, true);
      setPreviewUrl(url);
    } catch (e) { setError("Erro ao gerar PDF."); }
    finally { setIsGenerating(false); }
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setIsGenerating(true);
    try {
      const m = constructManifest();
      await generateLoadingManifestPDF(m, false);
      onSave(m);
      setInvoices([]);
      setSelectedManifestIds([]);
      setFormData({ ...formData, manifestNumber: `MC-${Date.now().toString().substr(-6)}`, sealNumber: '', exitTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) });
    } catch (e) { setError("Erro ao salvar."); }
    finally { setIsGenerating(false); }
  };

  const selectedManifestsData = pendingManifests.filter(m => selectedManifestIds.includes(m.id));

  const filteredPendingManifests = formData.branchId 
    ? pendingManifests.filter(m => m.branchId === formData.branchId)
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Truck className="text-orange-600" />
             <h2 className="font-black uppercase tracking-tighter italic">Manifesto de Embarque</h2>
          </div>
          <span className="text-[10px] font-black tracking-widest bg-orange-600 px-3 py-1 rounded-full uppercase">Expedição CD</span>
        </div>
        
        <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="space-y-4 lg:col-span-4 border-r border-slate-100 pr-0 lg:pr-10">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Filial de Destino *</label>
              <select className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none" value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})}>
                <option value="">Selecione...</option>
                {activeBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Motorista *</label>
                <select className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none" value={formData.driverId} onChange={e => setFormData({...formData, driverId: e.target.value})}>
                  <option value="">Selecione...</option>
                  {activeDrivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Veículo *</label>
                <select className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none" value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})}>
                  <option value="">Selecione...</option>
                  {activeVehicles.map(v => <option key={v.id} value={v.id}>{v.plate}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data Prevista de Entrega *</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-4 text-slate-400" size={16} />
                <input type="date" className="w-full pl-12 p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" value={formData.deliveryDate} onChange={e => setFormData({...formData, deliveryDate: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nº Lacre</label>
                <input type="text" className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" value={formData.sealNumber} onChange={e => setFormData({...formData, sealNumber: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Horário de Saída *</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-4 text-slate-400" size={16} />
                  <input type="time" className="w-full pl-12 p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" value={formData.exitTime} onChange={e => setFormData({...formData, exitTime: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="pt-6 space-y-4">
              <button onClick={handlePreview} disabled={isGenerating} className="w-full py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Eye size={18} />} Prévia PDF
              </button>
              <button onClick={handleSave} disabled={isGenerating} className="w-full py-4 bg-orange-600 text-white font-black rounded-2xl hover:bg-orange-700 shadow-xl shadow-orange-100 flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <FileDown size={18} />} Finalizar Manifesto
              </button>
            </div>
            {error && <div className="p-3 bg-red-50 text-red-600 text-[10px] font-bold rounded-xl border border-red-100 flex items-center gap-2 italic"><AlertCircle size={14} /> {error}</div>}
          </div>

          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Manifest Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="text-orange-600" size={18} />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Selecionar Manifestos (Pendentes)</h3>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-[300px] overflow-y-auto space-y-2">
                  {!formData.branchId ? (
                    <p className="text-[10px] text-slate-400 font-bold uppercase text-center py-10">Selecione uma filial para ver os manifestos</p>
                  ) : filteredPendingManifests.length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-bold uppercase text-center py-10">Nenhum manifesto pendente para esta filial</p>
                  ) : (
                    filteredPendingManifests.map(m => {
                      const isLinked = selectedManifestIds.includes(m.id);
                      const isCurrent = currentManifestId === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => toggleManifest(m.id)}
                          disabled={isLinked && !isCurrent}
                          className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between ${
                            isCurrent
                            ? 'bg-orange-100 border-orange-600 text-orange-900'
                            : isLinked
                            ? 'bg-green-50 border-green-200 text-green-700 opacity-60'
                            : 'bg-white border-slate-100 text-slate-600 hover:border-orange-200'
                          }`}
                        >
                          <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-tighter">Manifesto: {m.manifestNumber}</p>
                            <p className="text-[9px] opacity-80 font-bold uppercase">{m.branchName} • {m.palletsCount} Paletes</p>
                          </div>
                          {isLinked ? <CheckCircle2 size={16} className="text-green-600" /> : isCurrent ? <Clock size={16} className="text-orange-600 animate-pulse" /> : null}
                        </button>
                      );
                    })
                  )}
                </div>
                {currentManifestId && (
                  <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 flex items-center justify-between">
                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Trabalhando no Manifesto: {pendingManifests.find(m => m.id === currentManifestId)?.manifestNumber}</p>
                    <button onClick={() => setCurrentManifestId(null)} className="text-slate-400 hover:text-red-500"><X size={14}/></button>
                  </div>
                )}
                {selectedManifestIds.length > 0 && (
                  <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Selecionados: {selectedManifestIds.length}</p>
                  </div>
                )}
              </div>

              {/* NF Scanning */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Scan className="text-orange-600" size={18} />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Leitura de Notas Fiscais</h3>
                </div>
                <form onSubmit={handleScan} className="relative">
                  <input ref={scannerRef} type="text" placeholder={currentManifestId ? "Bipe as NFs para este manifesto..." : "Selecione um manifesto primeiro"} disabled={!currentManifestId} className="w-full p-4 pr-16 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-100 outline-none text-lg font-mono font-bold tracking-tighter disabled:bg-slate-50 disabled:cursor-not-allowed" value={scannerInput} onChange={e => setScannerInput(e.target.value)} />
                  <button type="submit" disabled={!currentManifestId} className="absolute right-2 top-2 bottom-2 px-4 bg-orange-600 text-white rounded-xl font-black uppercase text-[10px] disabled:bg-slate-300">OK</button>
                </form>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-3 bg-slate-50 border-b flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">NFs para Vincular ({tempInvoices.length})</span>
                    {tempInvoices.length > 0 && <button onClick={() => setTempInvoices([])} className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline">Limpar</button>}
                  </div>
                  <div className="max-h-[150px] overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <tbody className="divide-y">
                        {tempInvoices.map((inv) => (
                          <tr key={inv.key} className="hover:bg-slate-50">
                            <td className="px-4 py-2 font-black text-orange-600">{inv.number}</td>
                            <td className="px-4 py-2 text-right"><button onClick={() => removeTempInvoice(inv.key)} className="p-1 text-slate-300 hover:text-red-500"><Trash2 size={14} /></button></td>
                          </tr>
                        ))}
                        {tempInvoices.length === 0 && (
                          <tr><td colSpan={2} className="p-4 text-center text-[10px] text-slate-400 font-bold uppercase">Nenhuma NF bipada</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {tempInvoices.length > 0 && (
                    <div className="p-3 bg-slate-50 border-t">
                      <button onClick={handleLinkNFs} className="w-full py-2 bg-orange-600 text-white rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2">
                        <Plus size={14} /> Vincular Notas ao Manifesto
                      </button>
                    </div>
                  )}
                </div>

                {/* Linked Invoices History */}
                {invoices.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-3 bg-slate-900 text-white flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase tracking-widest">Notas Vinculadas ({invoices.length})</span>
                    </div>
                    <div className="max-h-[150px] overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[8px] font-black uppercase text-slate-400">
                          <tr>
                            <th className="px-4 py-2">NF</th>
                            <th className="px-4 py-2">Manifesto</th>
                            <th className="px-4 py-2 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {invoices.map((inv) => (
                            <tr key={inv.key} className="hover:bg-slate-50">
                              <td className="px-4 py-2 font-black text-slate-700">{inv.number}</td>
                              <td className="px-4 py-2 font-bold text-orange-600">{inv.manifestNumber}</td>
                              <td className="px-4 py-2 text-right"><button onClick={() => removeInvoice(inv.key)} className="p-1 text-slate-300 hover:text-red-500"><Trash2 size={14} /></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Summary of Selected Manifests */}
            {selectedManifestsData.length > 0 && (
              <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-orange-500" size={18} />
                  <h3 className="text-xs font-black uppercase tracking-widest">Resumo da Carga</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Total Manifestos</p>
                    <p className="text-xl font-black">{selectedManifestsData.length}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Total Paletes</p>
                    <p className="text-xl font-black">{selectedManifestsData.reduce((acc, curr) => acc + curr.palletsCount, 0)}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Total NFs</p>
                    <p className="text-xl font-black">{invoices.length}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Filial Destino</p>
                    <p className="text-xs font-black truncate">{branches.find(b => b.id === formData.branchId)?.name || '-'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest text-xs"><Eye size={16} className="text-orange-600" /> Manifesto de Embarque</h3>
              <button onClick={() => setPreviewUrl(null)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 bg-slate-200 p-4">
              <div className="w-full h-full bg-white shadow-inner rounded-2xl overflow-hidden">
                <object data={previewUrl} type="application/pdf" className="w-full h-full">
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                    <Printer size={48} className="text-slate-400" />
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="px-8 py-3 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs">Visualizar</a>
                  </div>
                </object>
              </div>
            </div>
            <div className="p-5 bg-white border-t flex flex-col sm:flex-row justify-end gap-3">
              <button onClick={() => setPreviewUrl(null)} className="px-8 py-3 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs">Fechar</button>
              <button onClick={() => { const link = document.createElement('a'); link.href = previewUrl; link.download = `Manifesto_Carga.pdf`; link.click(); }} className="px-8 py-3 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-orange-100">Download</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingManifestForm;
