
import React, { useState, useEffect } from 'react';
import { 
  FileDown, 
  Eye, 
  AlertCircle,
  X,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Download,
  Printer,
  Package,
  Layers,
  ClipboardList
} from 'lucide-react';
import { 
  Checker, 
  Branch, 
  DistributionCenter, 
  Manifest 
} from '../types';
import { generateManifestPDF } from '../services/pdfGenerator';

interface ManifestFormProps {
  checkers: Checker[];
  branches: Branch[];
  cds: DistributionCenter[];
  onSave: (manifest: Manifest) => void;
  currentUser: { name: string; uid: string };
}

const CONFERENCE_TYPES = [
  'ABASTECIMENTO LOJA',
  'VENDAS LOJA',
  'MOSTRUARIO',
  'AVARIA',
  'OCORRÊNCIA'
];

const SPECIAL_PRODUCTS = [
  'TUBOS', 'TELHAS', 'CX DAGUA', 'PORTAS', 'RODAPÉS', 'PERFIL', 'ESCADAS', 'ARGAMASSA', 'BETONEIRAS', 'OUTROS'
];

const ManifestForm: React.FC<ManifestFormProps> = ({ 
  checkers, 
  branches, 
  cds, 
  onSave,
  currentUser
}) => {
  const [formData, setFormData] = useState({
    manifestNumber: '',
    orders: '',
    conferenceDate: new Date().toISOString().split('T')[0],
    cdId: cds[0]?.id || '',
    branchId: '',
    checkerId: '',
    palletsCount: 1,
    conferenceType: 'ABASTECIMENTO LOJA',
    specialProducts: [] as string[]
  });

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const activeCheckers = checkers.filter(c => c.status === 'ATIVO');
  const activeBranches = branches.filter(b => b.status === 'ATIVO');

  const toggleSpecialProduct = (prod: string) => {
    setFormData(prev => ({
      ...prev,
      specialProducts: prev.specialProducts.includes(prod)
        ? prev.specialProducts.filter(p => p !== prod)
        : [...prev.specialProducts, prod]
    }));
  };

  const validate = () => {
    if (!formData.manifestNumber) return "Nº Manifesto obrigatório";
    if (!formData.orders) return "Lista de pedidos obrigatória";
    if (!formData.branchId) return "Filial obrigatória";
    if (!formData.checkerId) return "Conferente obrigatório";
    return null;
  };

  const constructManifest = (): Manifest => {
    const cd = cds.find(c => c.id === formData.cdId);
    const branch = branches.find(b => b.id === formData.branchId);
    const checker = checkers.find(c => c.id === formData.checkerId);
    return {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
      cdName: cd?.name || '',
      branchName: branch?.name || '',
      checkerName: checker?.name || ''
    };
  };

  const handlePreview = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setIsGenerating(true);
    try {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const manifest = constructManifest();
      const url = await generateManifestPDF(manifest, true);
      setPreviewUrl(url);
      setIsPreviewing(true);
    } catch (e) { setError("Erro ao gerar PDF."); }
    finally { setIsGenerating(false); }
  };

  const handleDownload = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setIsGenerating(true);
    try {
      const manifest = constructManifest();
      await generateManifestPDF(manifest, false);
      onSave(manifest);
      setFormData({ 
        ...formData, 
        manifestNumber: '', 
        orders: '', 
        palletsCount: 1, 
        specialProducts: [] 
      });
    } catch (e) { setError("Erro ao salvar."); }
    finally { setIsGenerating(false); }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <ClipboardList className="text-orange-600 shrink-0" />
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Conferência de Palete / Volumes</h2>
          </div>
          <div className="px-4 py-1.5 bg-orange-50 rounded-xl border border-orange-100">
             <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Procedimento Normatel</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-bold border border-red-100">
            <AlertCircle size={18} /> <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Número do Manifesto *</label>
                <input type="text" placeholder="EX: 990123" className="w-full px-5 py-4 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-black text-slate-700 uppercase" value={formData.manifestNumber} onChange={e => setFormData({ ...formData, manifestNumber: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipo de Conferência *</label>
                <select className="w-full px-5 py-4 bg-slate-900 text-white rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold uppercase text-xs" value={formData.conferenceType} onChange={e => setFormData({ ...formData, conferenceType: e.target.value })}>
                  {CONFERENCE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Filial de Destino *</label>
                <select className="w-full px-5 py-4 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" value={formData.branchId} onChange={e => setFormData({ ...formData, branchId: e.target.value })}>
                  <option value="">Selecione a Filial...</option>
                  {activeBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Conferente Responsável *</label>
                <select className="w-full px-5 py-4 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold" value={formData.checkerId} onChange={e => setFormData({ ...formData, checkerId: e.target.value })}>
                  <option value="">Selecione...</option>
                  {activeCheckers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Relação de Pedidos / Notas *</label>
              <textarea rows={4} placeholder="Digite os números dos pedidos separados por espaço..." className="w-full px-5 py-4 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none text-sm font-bold font-mono" value={formData.orders} onChange={e => setFormData({ ...formData, orders: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Unidade de Origem (CD)</label>
                <select className="w-full px-5 py-4 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" value={formData.cdId} onChange={e => setFormData({ ...formData, cdId: e.target.value })}>
                  {cds.map(cd => <option key={cd.id} value={cd.id}>{cd.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quantidade de Paletes *</label>
                <div className="flex items-center bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                  <button onClick={() => setFormData(f => ({...f, palletsCount: Math.max(1, f.palletsCount - 1)}))} className="p-4 hover:bg-slate-200 transition-colors text-slate-400 font-black">-</button>
                  <input type="number" min="1" className="flex-1 bg-transparent text-center focus:outline-none font-black text-xl text-slate-700" value={formData.palletsCount} onChange={e => setFormData({ ...formData, palletsCount: parseInt(e.target.value) || 1 })} />
                  <button onClick={() => setFormData(f => ({...f, palletsCount: f.palletsCount + 1}))} className="p-4 hover:bg-slate-200 transition-colors text-slate-400 font-black">+</button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <Package className="text-orange-600" size={18} />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Produtos Especiais (Volumes Fora de Palete)</h3>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mb-4">Selecione os itens que compõem este manifesto e não estão em paletes padrão:</p>
              
              <div className="grid grid-cols-2 gap-2">
                {SPECIAL_PRODUCTS.map(prod => {
                  const isSelected = formData.specialProducts.includes(prod);
                  return (
                    <button
                      key={prod}
                      onClick={() => toggleSpecialProduct(prod)}
                      className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                        isSelected 
                        ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-100' 
                        : 'bg-white border-slate-200 text-slate-400 hover:border-orange-200 hover:text-orange-500'
                      }`}
                    >
                      {prod}
                    </button>
                  );
                })}
              </div>
              
              {formData.specialProducts.length > 0 && (
                <div className="mt-6 p-4 bg-white rounded-2xl border border-orange-100 animate-in fade-in duration-300">
                   <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1">Selecionados:</p>
                   <p className="text-xs font-bold text-slate-600 uppercase italic">{formData.specialProducts.join(' • ')}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={handlePreview} disabled={isGenerating} className="w-full flex items-center justify-center gap-2 py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-xs shadow-xl shadow-slate-200">
                {isGenerating ? <Loader2 className="animate-spin" /> : <Eye size={18} />} Prévia das Etiquetas
              </button>
              <button onClick={handleDownload} disabled={isGenerating} className="w-full flex items-center justify-center gap-2 py-5 bg-orange-600 text-white font-black rounded-2xl hover:bg-orange-700 shadow-xl shadow-orange-200 transition-all uppercase tracking-widest text-xs">
                {isGenerating ? <Loader2 className="animate-spin" /> : <FileDown size={18} />} Gerar e Salvar Manifesto
              </button>
            </div>
          </div>
        </div>
      </div>

      {isPreviewing && previewUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest text-xs"><Eye size={16} className="text-orange-600" /> Etiquetas Geradas</h3>
              <button onClick={() => setIsPreviewing(false)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 bg-slate-200 p-4">
              <div className="w-full h-full bg-white shadow-inner rounded-xl overflow-hidden">
                <object data={previewUrl} type="application/pdf" className="w-full h-full">
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                    <Printer size={48} className="text-slate-400" />
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="px-8 py-3 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs">Visualizar Etiquetas</a>
                  </div>
                </object>
              </div>
            </div>
            <div className="p-5 bg-white border-t flex justify-end gap-3">
              <button onClick={() => setIsPreviewing(false)} className="px-8 py-3 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs">Fechar</button>
              <button onClick={() => { const link = document.createElement('a'); link.href = previewUrl; link.download = `Etiquetas_${formData.manifestNumber}.pdf`; link.click(); }} className="px-8 py-3 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-orange-100">Download PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManifestForm;
