
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  LogOut, 
  Truck,
  Users,
  Building2,
  Menu,
  X,
  UserCheck,
  Car,
  UserCog,
  Warehouse
} from 'lucide-react';
import { UserProfile } from '../types';

const LogoSmall = () => (
  <svg viewBox="0 0 100 100" className="w-8 h-8">
    <path d="M20 80 L50 40 L80 40 L50 80 Z" fill="#ea580c" />
    <path d="M20 20 L50 60 L80 60 L50 20 Z" fill="#ea580c" />
  </svg>
);

interface LayoutProps {
  children: React.ReactNode;
  user: UserProfile;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, activeTab, setActiveTab, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'CONFERENTE', 'ADMINISTRATIVO'] },
    { id: 'generate', label: 'Conferência', icon: PlusCircle, roles: ['ADMIN', 'CONFERENTE', 'ADMINISTRATIVO'] },
    { id: 'loading-manifest', label: 'Carga/Embarque', icon: Truck, roles: ['ADMIN', 'CONFERENTE', 'ADMINISTRATIVO'] },
    { id: 'history', label: 'Histórico', icon: History, roles: ['ADMIN', 'CONFERENTE', 'ADMINISTRATIVO'] },
    { id: 'users', label: 'Usuários', icon: UserCog, roles: ['ADMIN'] },
    { id: 'cds', label: 'Centros de Distribuição', icon: Warehouse, roles: ['ADMIN', 'ADMINISTRATIVO'] },
    { id: 'checkers', label: 'Conferentes', icon: UserCheck, roles: ['ADMIN', 'ADMINISTRATIVO'] },
    { id: 'drivers', label: 'Motoristas', icon: Users, roles: ['ADMIN', 'ADMINISTRATIVO'] },
    { id: 'vehicles', label: 'Veículos', icon: Car, roles: ['ADMIN', 'ADMINISTRATIVO'] },
    { id: 'branches', label: 'Filiais', icon: Building2, roles: ['ADMIN', 'ADMINISTRATIVO'] },
  ];

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-inter">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col no-print transition-transform duration-300 transform lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <LogoSmall />
          <div className="flex flex-col">
            <span className="font-black text-lg text-white leading-none uppercase italic">Normatel</span>
            <span className="text-[8px] text-orange-500 font-bold uppercase tracking-widest">Logística & CD</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            if (!item.roles.includes(user.role)) return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => handleTabChange(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${isActive ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'hover:bg-slate-800 hover:text-white'}`}>
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500'} />
                <span className="font-bold text-xs uppercase tracking-wider">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800 space-y-4">
          <div className="px-4 py-3 bg-slate-800/50 rounded-2xl border border-slate-700/50">
            <p className="text-[8px] text-orange-500 uppercase font-black tracking-widest mb-1">Operador</p>
            <p className="text-xs font-bold text-white truncate">{user.name}</p>
            <p className="text-[10px] text-slate-500 font-medium">{user.role}</p>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-colors">
            <LogOut size={18} />
            <span className="font-bold text-xs uppercase">Sair</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 no-print shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-slate-600" onClick={() => setIsMobileMenuOpen(true)}><Menu size={24} /></button>
            <h1 className="text-sm font-black text-slate-800 uppercase tracking-widest">{menuItems.find(i => i.id === activeTab)?.label || 'Sistema'}</h1>
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
