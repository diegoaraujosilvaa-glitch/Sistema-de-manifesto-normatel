
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { FileText, Layers, TrendingUp, Calendar } from 'lucide-react';
import { Manifest } from '../types';

interface DashboardProps {
  manifests: Manifest[];
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ manifests, dateRange, setDateRange }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const filteredManifests = manifests.filter(m => {
    const date = m.createdAt.split('T')[0];
    return date >= dateRange.start && date <= dateRange.end;
  });

  const manifestsToday = manifests.filter(m => m.createdAt.startsWith(today));
  const palletsToday = manifestsToday.reduce((acc, m) => acc + m.palletsCount, 0);

  const dailyData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const count = manifests.filter(m => m.createdAt.startsWith(dateStr)).length;
    return {
      name: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
      date: dateStr,
      count
    };
  });

  const stats = [
    { label: 'CONFERÊNCIAS HOJE', value: manifestsToday.length, icon: FileText, color: 'bg-orange-600' },
    { label: 'PALETES EXPEDIDOS', value: palletsToday, icon: Layers, color: 'bg-slate-800' },
    { label: 'TOTAL NO PERÍODO', value: filteredManifests.length, icon: TrendingUp, color: 'bg-orange-500' },
    { label: 'MÉDIA SEMANAL', value: dailyData.reduce((a, b) => a + b.count, 0), icon: Calendar, color: 'bg-slate-700' },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Visão Geral do Sistema</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Indicadores de performance e fluxo</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <div className="flex flex-col px-2">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Início</span>
            <input type="date" className="bg-transparent border-0 p-0 text-[10px] font-bold outline-none" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
          </div>
          <div className="w-px h-8 bg-slate-200 mx-1"></div>
          <div className="flex flex-col px-2">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fim</span>
            <input type="date" className="bg-transparent border-0 p-0 text-[10px] font-bold outline-none" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5 transition-transform hover:scale-[1.02]">
              <div className={`${stat.color} p-4 rounded-2xl text-white shadow-xl shadow-slate-200`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Fluxo de Manifestos (Últimos 7 Dias)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 700 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={32}>
                {dailyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 6 ? '#ea580c' : '#334155'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Atividades Recentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b">
              <tr><th className="px-6 py-4">Manifesto</th><th className="px-6 py-4">Destino</th><th className="px-6 py-4">Paletes</th><th className="px-6 py-4">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredManifests.slice(0, 10).map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-black text-orange-600">{m.manifestNumber}</td>
                  <td className="px-6 py-4 text-slate-700 font-bold">{m.branchName}</td>
                  <td className="px-6 py-4 text-slate-500">{m.palletsCount} un</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${m.status === 'ENTREGUE' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                      {m.status || 'PENDENTE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
