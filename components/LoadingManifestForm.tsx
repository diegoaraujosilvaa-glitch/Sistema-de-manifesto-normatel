
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
  Calendar
} from 'lucide-react';
import { 
  Driver, 
  Vehicle, 
  Branch, 
  DistributionCenter, 
  LoadingManifest, 
  InvoiceItem 
} from '../types';
import { generateLoadingManifestPDF } from '../services/pdfGenerator';

interface LoadingManifestFormProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  branches: Branch[];
  cds: DistributionCenter[];
  onSave: (m: LoadingManifest) => void;
  currentUser: { name: string; uid: string };
}

const LoadingManifestForm: React.FC<LoadingManifestFormProps> = ({ 
  drivers, 
  vehicles, 
  branches, 
  cds, 
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

  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
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
    if (invoices.some(i => i.key === val)) {
      setError("NF já bipada.");
      setScannerInput('');
      return;
    }
    const nfNumber = val.substring(25, 34);
    setInvoices([{ key: val, number: nfNumber }, ...invoices]);
    setScannerInput('');
    scannerRef.current?.focus();
  };

  const removeInvoice = (key: string) => setInvoices(invoices.filter(i => i.key !== key));

  const validate = () => {
    if (!formData.branchId || !formData.driverId || !formData.vehicleId || !formData.exitTime || !formData.deliveryDate) return "Preencha todos os campos obrigatórios";
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
      setFormData({ ...formData, manifestNumber: `MC-${Date.now().toString().substr(-6)}`, sealNumber: '', exitTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) });
    } catch (e) { setError("Erro ao salvar."); }
    finally { setIsGenerating(false); }
  };

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
        
        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="space-y-4 lg:col-span-1 border-r border-slate-100 pr-0 lg:pr-10">
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

          <div className="lg:col-span-2 space-y-8">
            <div className="bg-orange-50 p-8 rounded-3xl border border-orange-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10"><Scan size={100} /></div>
              <div className="flex items-center gap-3 mb-6">
                <Scan className="text-orange-600" />
                <h3 className="font-black text-orange-900 uppercase text-xs tracking-widest">Leitura de Notas Fiscais</h3>
              </div>
              <form onSubmit={handleScan} className="relative">
                <input ref={scannerRef} type="text" placeholder="Bipe a Chave de Acesso (44 dígitos)..." className="w-full p-5 pr-20 bg-white border-2 border-orange-200 rounded-2xl focus:ring-4 focus:ring-orange-100 outline-none text-xl font-mono font-bold tracking-tighter" value={scannerInput} onChange={e => setScannerInput(e.target.value)} autoFocus />
                <button type="submit" className="absolute right-2 top-2 bottom-2 px-6 bg-orange-600 text-white rounded-xl font-black uppercase text-xs">OK</button>
              </form>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Itens na Carga ({invoices.length})</span>
                {invoices.length > 0 && <button onClick={() => setInvoices([])} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Zerar Lista</button>}
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <tr><th className="px-6 py-3">NF</th><th className="px-6 py-3">Chave</th><th className="px-6 py-3 text-right">Excluir</th></tr>
                  </thead>
                  <tbody className="divide-y">{invoices.map((inv) => (
                      <tr key={inv.key} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-black text-orange-600">{inv.number}</td>
                        <td className="px-6 py-4 text-slate-400 font-mono text-xs truncate max-w-[200px]">{inv.key}</td>
                        <td className="px-6 py-4 text-right"><button onClick={() => removeInvoice(inv.key)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18} /></button></td>
                      </tr>
                    ))}</tbody>
                </table>
              </div>
            </div>
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
