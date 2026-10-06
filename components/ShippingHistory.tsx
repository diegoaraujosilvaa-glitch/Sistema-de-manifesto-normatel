import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Printer, 
  Trash2, 
  Truck, 
  FileText, 
  Copy, 
  Check, 
  Calendar, 
  Eye, 
  X, 
  Download, 
  Layers, 
  ShieldCheck, 
  MapPin, 
  User, 
  Car, 
  ArrowRight,
  ClipboardList,
  Clock,
  Filter
} from 'lucide-react';
import { LoadingManifest, Manifest, Branch, UserProfile, InvoiceItem } from '../types';
import { generateLoadingManifestPDF } from '../services/pdfGenerator';

interface ShippingHistoryProps {
  loadingManifests: LoadingManifest[];
  manifests: Manifest[];
  branches: Branch[];
  user: UserProfile;
  dateRange: { start: string; end: string };
  setDateRange: React.Dispatch<React.SetStateAction<{ start: string; end: string }>>;
  onDeleteLoadingManifest: (id: string) => Promise<void>;
}

export interface FlattenedInvoice {
  id: string; // unique key for list
  invoiceKey: string;
  invoiceNumber: string;
  manifestPalletNumber: string;
  loadingManifestId: string;
  loadingManifestNumber: string;
  cdName: string;
  branchName: string;
  driverName: string;
  vehiclePlate: string;
  sealNumber: string;
  deliveryDate: string;
  exitTime: string;
  createdAt: string;
  createdBy: string;
  rawManifest: LoadingManifest;
}

export const ShippingHistory: React.FC<ShippingHistoryProps> = ({
  loadingManifests,
  manifests,
  branches,
  user,
  dateRange,
  setDateRange,
  onDeleteLoadingManifest,
}) => {
  const [viewMode, setViewMode] = useState<'CARGAS' | 'NOTAS_FISCAIS'>('CARGAS');
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('TODOS');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedLoadingManifest, setSelectedLoadingManifest] = useState<LoadingManifest | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<FlattenedInvoice | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Flatten all invoices from all loading manifests
  const allFlattenedInvoices = useMemo(() => {
    const list: FlattenedInvoice[] = [];
    loadingManifests.forEach(m => {
      (m.invoices || []).forEach((inv, index) => {
        list.push({
          id: `${m.id}_${inv.key || inv.number}_${index}`,
          invoiceKey: inv.key,
          invoiceNumber: inv.number,
          manifestPalletNumber: inv.manifestNumber || '-',
          loadingManifestId: m.id,
          loadingManifestNumber: m.manifestNumber,
          cdName: m.cdName,
          branchName: m.branchName,
          driverName: m.driverName,
          vehiclePlate: m.vehiclePlate,
          sealNumber: m.sealNumber || 'N/A',
          deliveryDate: m.deliveryDate,
          exitTime: m.exitTime,
          createdAt: m.createdAt,
          createdBy: m.createdBy,
          rawManifest: m,
        });
      });
    });
    return list;
  }, [loadingManifests]);

  // Filtered Cargas / Loading Manifests
  const filteredLoadingManifests = useMemo(() => {
    return loadingManifests.filter(m => {
      const date = (m.createdAt || '').split('T')[0];
      const matchesDate = date >= dateRange.start && date <= dateRange.end;
      const matchesBranch = branchFilter === 'TODOS' || m.branchName === branchFilter;
      
      const term = searchTerm.trim().toLowerCase();
      if (!term) return matchesDate && matchesBranch;

      const matchesBasic = 
        (m.manifestNumber || '').toLowerCase().includes(term) ||
        (m.vehiclePlate || '').toLowerCase().includes(term) ||
        (m.driverName || '').toLowerCase().includes(term) ||
        (m.branchName || '').toLowerCase().includes(term) ||
        (m.sealNumber || '').toLowerCase().includes(term);

      // Also match if any invoice inside this carga matches search (NF number or access key)
      const matchesInvoice = (m.invoices || []).some(inv => 
        (inv.number || '').toLowerCase().includes(term) ||
        (inv.key || '').toLowerCase().includes(term) ||
        (inv.manifestNumber || '').toLowerCase().includes(term)
      );

      return matchesDate && matchesBranch && (matchesBasic || matchesInvoice);
    });
  }, [loadingManifests, dateRange, branchFilter, searchTerm]);

  // Filtered Invoices (Level of Nota Fiscal)
  const filteredInvoices = useMemo(() => {
    return allFlattenedInvoices.filter(item => {
      const date = (item.createdAt || '').split('T')[0];
      const matchesDate = date >= dateRange.start && date <= dateRange.end;
      const matchesBranch = branchFilter === 'TODOS' || item.branchName === branchFilter;

      const term = searchTerm.trim().toLowerCase();
      if (!term) return matchesDate && matchesBranch;

      const matchesSearch = 
        item.invoiceNumber.toLowerCase().includes(term) ||
        item.invoiceKey.toLowerCase().includes(term) ||
        item.loadingManifestNumber.toLowerCase().includes(term) ||
        item.manifestPalletNumber.toLowerCase().includes(term) ||
        item.vehiclePlate.toLowerCase().includes(term) ||
        item.driverName.toLowerCase().includes(term) ||
        item.branchName.toLowerCase().includes(term) ||
        item.sealNumber.toLowerCase().includes(term);

      return matchesDate && matchesBranch && matchesSearch;
    });
  }, [allFlattenedInvoices, dateRange, branchFilter, searchTerm]);

  // Quick stats
  const totalCargas = filteredLoadingManifests.length;
  const totalNFs = filteredInvoices.length;
  const distinctBranches = useMemo(() => {
    const set = new Set<string>();
    filteredLoadingManifests.forEach(m => {
      if (m.branchName) set.add(m.branchName);
    });
    return set.size;
  }, [filteredLoadingManifests]);

  // Export filtered NFs to CSV
  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      alert('Nenhuma nota fiscal encontrada no filtro atual.');
      return;
    }
    const headers = ['Numero_NF', 'Chave_Acesso', 'Carga_Embarque', 'Manifesto_Palete', 'Destino_Filial', 'Data_Saida', 'Horario', 'Placa', 'Motorista', 'Lacre', 'Emissor'];
    const rows = filteredInvoices.map(inv => [
      inv.invoiceNumber,
      inv.invoiceKey,
      inv.loadingManifestNumber,
      inv.manifestPalletNumber,
      `"${inv.branchName}"`,
      new Date(inv.createdAt).toLocaleDateString('pt-BR'),
      inv.exitTime,
      inv.vehiclePlate,
      `"${inv.driverName}"`,
      inv.sealNumber,
      `"${inv.createdBy}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Consulta_Notas_Fiscais_Embarque_${dateRange.start}_a_${dateRange.end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-black">
                <Truck size={22} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">
                  Histórico de Embarques
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  Manifestos de carga finalizados e consulta analítica de NFs
                </p>
              </div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start lg:self-auto shadow-inner">
            <button
              onClick={() => setViewMode('CARGAS')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                viewMode === 'CARGAS'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Truck size={16} />
              Visão por Cargas ({totalCargas})
            </button>
            <button
              onClick={() => setViewMode('NOTAS_FISCAIS')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                viewMode === 'NOTAS_FISCAIS'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText size={16} />
              Consulta por Nota Fiscal ({totalNFs})
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 pt-4 border-t border-slate-100">
          {/* Quick Metrics */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 xl:pb-0">
            <div className="px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargas:</span>
              <span className="text-sm font-black text-slate-800 font-mono">{totalCargas}</span>
            </div>
            <div className="px-4 py-2 bg-orange-50/70 rounded-2xl border border-orange-100 flex items-center gap-2.5 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">Total NFs:</span>
              <span className="text-sm font-black text-orange-600 font-mono">{totalNFs}</span>
            </div>
            <div className="px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filiais:</span>
              <span className="text-sm font-black text-slate-800 font-mono">{distinctBranches}</span>
            </div>
          </div>

          {/* Controls: Date range, branch selector, search */}
          <div className="flex flex-wrap items-center gap-3 flex-1 justify-end">
            {/* Date Range */}
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
              <div className="flex flex-col px-2">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Início</span>
                <input 
                  type="date" 
                  className="bg-transparent border-0 p-0 text-[10px] font-bold outline-none cursor-pointer" 
                  value={dateRange.start} 
                  onChange={e => setDateRange({ ...dateRange, start: e.target.value })} 
                />
              </div>
              <div className="w-px h-8 bg-slate-200 mx-1"></div>
              <div className="flex flex-col px-2">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fim</span>
                <input 
                  type="date" 
                  className="bg-transparent border-0 p-0 text-[10px] font-bold outline-none cursor-pointer" 
                  value={dateRange.end} 
                  onChange={e => setDateRange({ ...dateRange, end: e.target.value })} 
                />
              </div>
            </div>

            {/* Branch Filter */}
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
              <div className="flex flex-col px-2">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Destino</span>
                <select 
                  className="bg-transparent border-0 p-0 text-[10px] font-bold outline-none max-w-[150px] cursor-pointer"
                  value={branchFilter}
                  onChange={e => setBranchFilter(e.target.value)}
                >
                  <option value="TODOS">TODAS AS FILIAIS</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input 
                className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-xs text-slate-800 placeholder-slate-400 transition-all" 
                placeholder={
                  viewMode === 'NOTAS_FISCAIS' 
                    ? "Consultar por Nº NF, Chave 44 dígitos, Placa, Carga..." 
                    : "Pesquisar por Carga, NF, Placa, Motorista..."
                } 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Export CSV button (Active especially for NFs) */}
            <button
              onClick={handleExportCSV}
              className="p-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl border border-slate-200 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-wider"
              title="Exportar consulta para planilha (CSV)"
            >
              <Download size={16} />
              <span className="hidden md:inline">Exportar NFs</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: NOTAS FISCAIS (CONSULTA A NÍVEL DE NOTA FISCAL) */}
      {viewMode === 'NOTAS_FISCAIS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                Consulta Analítica de Notas Fiscais
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                ({filteredInvoices.length} nota(s) encontrada(s))
              </span>
            </div>
            {searchTerm && (
              <span className="text-[10px] bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-bold">
                Filtrado por: "{searchTerm}"
              </span>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[1100px]">
              <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="p-5">Número da NF</th>
                  <th className="p-5">Chave de Acesso (44 dígitos)</th>
                  <th className="p-5">Carga (Embarque)</th>
                  <th className="p-5">Manif. Palete</th>
                  <th className="p-5">Destino / Filial</th>
                  <th className="p-5">Data Embarque</th>
                  <th className="p-5">Veículo / Placa</th>
                  <th className="p-5">Motorista</th>
                  <th className="p-5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText size={36} className="text-slate-300" />
                        <p className="font-bold text-sm text-slate-500 uppercase tracking-wider">
                          Nenhuma nota fiscal encontrada
                        </p>
                        <p className="text-xs text-slate-400">
                          Tente ajustar as datas do filtro ou o termo de busca pesquisado.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const isKeyCopied = copiedKey === inv.id;
                    return (
                      <tr 
                        key={inv.id} 
                        className="hover:bg-orange-50/40 transition-colors group cursor-pointer"
                        onClick={() => setSelectedInvoice(inv)}
                      >
                        {/* NF Number */}
                        <td className="p-5 font-black">
                          <div className="inline-flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100 text-orange-700 font-mono text-sm tracking-tight shadow-sm">
                            <FileText size={14} className="text-orange-500" />
                            NF {inv.invoiceNumber}
                          </div>
                        </td>

                        {/* Access Key */}
                        <td className="p-5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2 max-w-[280px]">
                            <span 
                              className="font-mono text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 truncate select-all"
                              title={inv.invoiceKey}
                            >
                              {inv.invoiceKey ? `${inv.invoiceKey.substring(0, 4)}...${inv.invoiceKey.substring(inv.invoiceKey.length - 8)}` : '-'}
                            </span>
                            {inv.invoiceKey && (
                              <button
                                onClick={() => handleCopy(inv.invoiceKey, inv.id)}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  isKeyCopied 
                                    ? 'bg-green-100 border-green-300 text-green-700' 
                                    : 'bg-white border-slate-200 text-slate-400 hover:text-orange-600 hover:border-orange-200'
                                }`}
                                title={isKeyCopied ? 'Chave copiada!' : 'Copiar chave completa de 44 dígitos'}
                              >
                                {isKeyCopied ? <Check size={14} /> : <Copy size={14} />}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Loading Manifest */}
                        <td className="p-5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLoadingManifest(inv.rawManifest);
                            }}
                            className="font-black text-slate-800 uppercase tracking-tighter hover:text-orange-600 hover:underline flex items-center gap-1.5"
                            title="Ver detalhes desta carga"
                          >
                            <Truck size={14} className="text-slate-400" />
                            {inv.loadingManifestNumber}
                          </button>
                        </td>

                        {/* Pallet Manifest */}
                        <td className="p-5">
                          <span className="font-mono font-bold text-[11px] text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                            {inv.manifestPalletNumber}
                          </span>
                        </td>

                        {/* Branch Destination */}
                        <td className="p-5 font-black text-slate-800">
                          {inv.branchName}
                        </td>

                        {/* Date and Exit Time */}
                        <td className="p-5 text-slate-600 font-medium">
                          <div>{new Date(inv.createdAt).toLocaleDateString('pt-BR')}</div>
                          <div className="text-[10px] text-slate-400 font-bold">{inv.exitTime || '-'}</div>
                        </td>

                        {/* Vehicle */}
                        <td className="p-5">
                          <div className="bg-slate-100 px-2.5 py-1 rounded-lg text-[11px] font-mono font-black text-slate-700 inline-block border border-slate-200">
                            {inv.vehiclePlate}
                          </div>
                        </td>

                        {/* Driver */}
                        <td className="p-5 text-slate-600 font-bold max-w-[140px] truncate" title={inv.driverName}>
                          {inv.driverName}
                        </td>

                        {/* Actions */}
                        <td className="p-5 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                              title="Visualizar Detalhes da Nota Fiscal"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => generateLoadingManifestPDF(inv.rawManifest)}
                              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                              title="Imprimir Manifesto da Carga"
                            >
                              <Printer size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: CARGAS / EMBARQUES */}
      {viewMode === 'CARGAS' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[1000px]">
            <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="p-6">Nº Carga</th>
                <th className="p-6">Data Saída</th>
                <th className="p-6">Placa</th>
                <th className="p-6">Motorista</th>
                <th className="p-6">Destino</th>
                <th className="p-6 text-center">Nº Lacre</th>
                <th className="p-6 text-center">Notas Fiscais</th>
                <th className="p-6 text-center">Manifestos</th>
                <th className="p-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLoadingManifests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400 font-bold uppercase tracking-wider">
                    Nenhum manifesto de carga encontrado para os filtros selecionados
                  </td>
                </tr>
              ) : (
                filteredLoadingManifests.map(m => (
                  <tr 
                    key={m.id} 
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedLoadingManifest(m)}
                  >
                    <td className="p-6 font-black text-slate-800 uppercase tracking-tighter text-sm">
                      <div className="flex items-center gap-2">
                        <Truck size={16} className="text-orange-600" />
                        <span>{m.manifestNumber}</span>
                      </div>
                    </td>
                    <td className="p-6 text-slate-500 font-bold text-xs">
                      <div>{new Date(m.createdAt).toLocaleDateString('pt-BR')}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{m.exitTime || '-'}</div>
                    </td>
                    <td className="p-6">
                      <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-[11px] font-black font-mono inline-block border border-slate-200">
                        {m.vehiclePlate}
                      </div>
                    </td>
                    <td className="p-6 font-bold text-slate-700">{m.driverName}</td>
                    <td className="p-6 font-black text-slate-800">{m.branchName}</td>
                    <td className="p-6 text-center font-mono font-bold text-slate-600">
                      {m.sealNumber ? (
                        <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px]">
                          {m.sealNumber}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-6 text-center" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedLoadingManifest(m)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-full font-black text-xs transition-all border border-orange-200"
                        title="Ver lista de Notas Fiscais desta carga"
                      >
                        <FileText size={13} />
                        {m.invoices?.length || 0} NF{m.invoices?.length !== 1 ? 's' : ''}
                      </button>
                    </td>
                    <td className="p-6 text-center font-black text-slate-400">
                      {m.linkedManifestIds?.length || 0}
                    </td>
                    <td className="p-6 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => setSelectedLoadingManifest(m)} 
                          className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all" 
                          title="Consultar Detalhes e NFs"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => generateLoadingManifestPDF(m)} 
                          className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all" 
                          title="Imprimir Manifesto"
                        >
                          <Printer size={18} />
                        </button>
                        {(user.role === 'ADMIN' || user.role === 'ADMINISTRATIVO' || m.createdBy === user.email) && (
                          <button 
                            onClick={async () => {
                              if (confirm(`Deseja excluir o embarque ${m.manifestNumber} PERMANENTEMENTE?`)) {
                                await onDeleteLoadingManifest(m.id);
                              }
                            }} 
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" 
                            title="Excluir Embarque"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: DETALHES DE UMA NOTA FISCAL ESPECÍFICA */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-600 flex items-center justify-center text-white">
                  <FileText size={20} />
                </div>
                <div>
                  <span className="text-[10px] text-orange-400 font-black uppercase tracking-widest">
                    Consulta de Nota Fiscal
                  </span>
                  <h3 className="text-xl font-black uppercase tracking-tight">
                    NF Nº {selectedInvoice.invoiceNumber}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Access Key Banner */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Chave de Acesso da NF-e (44 dígitos)
                  </span>
                  <button
                    onClick={() => handleCopy(selectedInvoice.invoiceKey, 'modal-key')}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-orange-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
                  >
                    {copiedKey === 'modal-key' ? (
                      <>
                        <Check size={14} className="text-green-600" />
                        <span className="text-green-600">Copiada!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} className="text-orange-600" />
                        <span>Copiar Chave</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-xs text-slate-800 break-all select-all tracking-wide">
                  {selectedInvoice.invoiceKey || 'Chave não informada'}
                </div>
              </div>

              {/* Grid with Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Embarque Info */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex items-center gap-2 text-orange-600 font-black text-xs uppercase tracking-wider">
                    <Truck size={16} />
                    Dados do Embarque
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Nº Carga:</span>
                      <span className="font-black text-slate-800">{selectedInvoice.loadingManifestNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Manif. Palete:</span>
                      <span className="font-mono font-bold text-slate-700">{selectedInvoice.manifestPalletNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Data de Saída:</span>
                      <span className="font-bold text-slate-800">{new Date(selectedInvoice.createdAt).toLocaleDateString('pt-BR')} às {selectedInvoice.exitTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Lacre:</span>
                      <span className="font-mono font-bold text-slate-700">{selectedInvoice.sealNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Logistica Info */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex items-center gap-2 text-orange-600 font-black text-xs uppercase tracking-wider">
                    <MapPin size={16} />
                    Rota & Transporte
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Destino:</span>
                      <span className="font-black text-slate-800">{selectedInvoice.branchName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Origem:</span>
                      <span className="font-bold text-slate-700">{selectedInvoice.cdName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Veículo:</span>
                      <span className="font-mono font-black text-slate-800">{selectedInvoice.vehiclePlate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Motorista:</span>
                      <span className="font-bold text-slate-700">{selectedInvoice.driverName}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Invoices in Same Shipment */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Demais Notas nesta mesma Carga ({selectedInvoice.rawManifest.invoices?.length || 0})
                  </span>
                  <button
                    onClick={() => {
                      const manifest = selectedInvoice.rawManifest;
                      setSelectedInvoice(null);
                      setSelectedLoadingManifest(manifest);
                    }}
                    className="text-xs font-bold text-orange-600 hover:underline"
                  >
                    Ver Carga Completa →
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                  {(selectedInvoice.rawManifest.invoices || []).map((inv, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between p-2 rounded-xl text-xs ${
                        inv.number === selectedInvoice.invoiceNumber 
                          ? 'bg-orange-100 text-orange-900 font-black border border-orange-200' 
                          : 'bg-white text-slate-700 border border-slate-200/60'
                      }`}
                    >
                      <span className="font-mono font-bold">NF {inv.number}</span>
                      <span className="font-mono text-[10px] text-slate-400 truncate max-w-[200px]">{inv.key}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">{inv.manifestNumber || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-2xl text-xs uppercase tracking-wider transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => generateLoadingManifestPDF(selectedInvoice.rawManifest)}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-orange-200"
              >
                <Printer size={16} />
                Imprimir Manifesto Completo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETALHES DE UMA CARGA COMPLETA (COM LISTA DE NOTAS FISCAIS) */}
      {selectedLoadingManifest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-600 flex items-center justify-center text-white">
                  <Truck size={20} />
                </div>
                <div>
                  <span className="text-[10px] text-orange-400 font-black uppercase tracking-widest">
                    Detalhes do Embarque
                  </span>
                  <h3 className="text-xl font-black uppercase tracking-tight">
                    {selectedLoadingManifest.manifestNumber}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLoadingManifest(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Header Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Destino</span>
                  <span className="text-xs font-black text-slate-800 truncate block">{selectedLoadingManifest.branchName}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Veículo / Placa</span>
                  <span className="text-xs font-mono font-black text-slate-800 block">{selectedLoadingManifest.vehiclePlate}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Motorista</span>
                  <span className="text-xs font-bold text-slate-800 truncate block">{selectedLoadingManifest.driverName}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Lacre</span>
                  <span className="text-xs font-mono font-bold text-slate-800 block">{selectedLoadingManifest.sealNumber || 'N/A'}</span>
                </div>
              </div>

              {/* Relação de Notas Fiscais */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-orange-600" />
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-800">
                      Relação de Notas Fiscais ({selectedLoadingManifest.invoices?.length || 0})
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Expedidas nesta carga
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Número NF</th>
                        <th className="p-3">Manifesto Palete</th>
                        <th className="p-3">Chave de Acesso</th>
                        <th className="p-3 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedLoadingManifest.invoices || []).map((inv, idx) => {
                        const isCopied = copiedKey === `carga_${inv.key || idx}`;
                        return (
                          <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                            <td className="p-3 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                            <td className="p-3 font-black text-slate-800 font-mono text-xs">NF {inv.number}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-mono text-[10px]">
                                {inv.manifestNumber || '-'}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="font-mono text-[10px] text-slate-500 truncate max-w-[280px]" title={inv.key}>
                                {inv.key}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              {inv.key && (
                                <button
                                  onClick={() => handleCopy(inv.key, `carga_${inv.key || idx}`)}
                                  className={`p-1 rounded-lg border text-[10px] font-bold ${
                                    isCopied
                                      ? 'bg-green-100 text-green-700 border-green-300'
                                      : 'bg-white text-slate-500 border-slate-200 hover:text-orange-600'
                                  }`}
                                  title="Copiar Chave"
                                >
                                  {isCopied ? <Check size={12} /> : <Copy size={12} />}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedLoadingManifest(null)}
                className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-2xl text-xs uppercase tracking-wider transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => generateLoadingManifestPDF(selectedLoadingManifest)}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-orange-200"
              >
                <Printer size={16} />
                Imprimir Manifesto de Carga
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingHistory;
