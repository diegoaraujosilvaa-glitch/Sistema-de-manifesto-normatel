
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ManifestForm from './components/ManifestForm';
import LoadingManifestForm from './components/LoadingManifestForm';
import { 
  UserProfile, 
  Manifest, 
  LoadingManifest,
  Checker, 
  Driver,
  Vehicle,
  Branch, 
  DistributionCenter 
} from './types';
import { 
  INITIAL_CHECKERS, 
  INITIAL_BRANCHES, 
  INITIAL_CDS,
  INITIAL_VEHICLES
} from './services/mockData';
import { 
  Search, 
  Plus, 
  Trash2, 
  UserPlus, 
  MapPin, 
  Warehouse,
  Lock,
  Truck,
  UserCog,
  User,
  Printer,
  ChevronRight,
  Phone,
  FileBadge,
  Settings2,
  Car,
  CheckCircle2,
  X,
  Building2,
  PlusCircle,
  UserCheck,
  Loader2
} from 'lucide-react';
import { generateManifestPDF, generateLoadingManifestPDF } from './services/pdfGenerator';
import { 
  subscribeToManifests, 
  subscribeToLoadingManifests, 
  saveManifest, 
  saveLoadingManifest,
  subscribeToCheckers,
  subscribeToDrivers,
  subscribeToVehicles,
  subscribeToBranches,
  subscribeToCDs,
  saveChecker,
  saveDriver,
  saveVehicle,
  saveBranch,
  saveCD,
  deleteChecker,
  deleteDriver,
  deleteVehicle,
  deleteBranch,
  deleteCD,
  deleteManifest,
  deleteLoadingManifest,
  subscribeToUsers,
  saveUser,
  deleteUser
} from './services/firestoreService';

const LogoNormatel = ({ size = 40, className = "" }) => (
  <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path d="M20 80 L50 40 L80 40 L50 80 Z" fill="#ea580c" />
      <path d="M20 20 L50 60 L80 60 L50 20 Z" fill="#ea580c" />
      <path d="M50 40 L80 40 L80 60 L50 60" fill="#1e293b" opacity="0.2" />
    </svg>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('logi_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [loadingManifests, setLoadingManifests] = useState<LoadingManifest[]>([]);
  const [checkers, setCheckers] = useState<Checker[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [cds, setCds] = useState<DistributionCenter[]>([]);

  useEffect(() => {
    const unsubManifests = subscribeToManifests(setManifests);
    const unsubLoading = subscribeToLoadingManifests(setLoadingManifests);
    const unsubCheckers = subscribeToCheckers(setCheckers);
    const unsubDrivers = subscribeToDrivers(setDrivers);
    const unsubVehicles = subscribeToVehicles(setVehicles);
    const unsubBranches = subscribeToBranches(setBranches);
    const unsubCDs = subscribeToCDs(setCds);
    const unsubUsers = subscribeToUsers(setAllUsers);

    return () => {
      unsubManifests();
      unsubLoading();
      unsubCheckers();
      unsubDrivers();
      unsubVehicles();
      unsubBranches();
      unsubCDs();
      unsubUsers();
    };
  }, []);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  // UI Control States
  const [showForm, setShowForm] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const seedDatabase = async () => {
    if (confirm('Deseja popular o banco de dados com os dados iniciais (Conferentes e CDs)?')) {
      setIsSeeding(true);
      try {
        // Seed Checkers
        if (checkers.length === 0) {
          for (const c of INITIAL_CHECKERS) {
            const { id, ...data } = c;
            await saveChecker(data);
          }
        }
        // Seed CDs
        if (cds.length === 0) {
          for (const c of INITIAL_CDS) {
            const { id, ...data } = c;
            await saveCD(data);
          }
        }
        // Seed Default Admin if no users
        if (allUsers.length === 0) {
          await saveUser({
            email: 'diego.silva',
            name: 'Diego Silva',
            role: 'ADMIN',
            password: '05171888302'
          });
        }
        alert('Banco de dados populado com sucesso!');
      } catch (e) {
        alert('Erro ao popular banco de dados');
      } finally {
        setIsSeeding(false);
      }
    }
  };

  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'CONFERENTE' as UserProfile['role'] });
  const [newChecker, setNewChecker] = useState({ name: '', externalId: '' });
  const [newDriver, setNewDriver] = useState({ name: '', document: '', phone: '' });
  const [newVehicle, setNewVehicle] = useState({ plate: '', model: '', type: 'TRUCK' });
  const [newBranch, setNewBranch] = useState({ name: '', code: '', city: '', state: '' });
  const [newCD, setNewCD] = useState({ name: '', code: '' });

  useEffect(() => { localStorage.setItem('logi_all_users', JSON.stringify(allUsers)); }, [allUsers]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const emailInput = loginForm.email.toLowerCase();
    const passwordInput = loginForm.password;
    
    // 1. Tenta encontrar nos usuários vindos do Firestore
    let foundUser = allUsers.find(u => ((u.email || '').toLowerCase() === emailInput || u.uid === emailInput) && u.password === passwordInput);
    
    // 2. Fallback para admin padrão caso o banco esteja vazio ou usuário não encontrado (para o primeiro setup)
    if (!foundUser && (emailInput === 'diego.silva' || emailInput === 'u_diego') && passwordInput === '05171888302') {
      foundUser = { 
        uid: 'u_diego', 
        email: 'diego.silva', 
        name: 'Diego Silva', 
        role: 'ADMIN', 
        password: '05171888302' 
      };
    }

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('logi_user', JSON.stringify(foundUser));
    } else {
      setLoginError('Credenciais inválidas.');
    }
  };

  const handleLogout = () => { 
    setUser(null); 
    localStorage.removeItem('logi_user'); 
    setLoginForm({ email: '', password: '' });
  };

  const addUser = async () => {
    if (newUser.name && newUser.email && newUser.password) {
      try {
        await saveUser({ 
          name: newUser.name, 
          email: newUser.email, 
          password: newUser.password, 
          role: newUser.role 
        });
        setNewUser({ name: '', email: '', password: '', role: 'CONFERENTE' });
        setShowForm(false);
      } catch (e) {
        alert('Erro ao salvar usuário no Firebase');
      }
    }
  };

  const addChecker = async () => {
    if (newChecker.name) {
      try {
        await saveChecker({ ...newChecker, status: 'ATIVO' });
        setNewChecker({ name: '', externalId: '' });
        setShowForm(false);
      } catch (e) {
        alert('Erro ao salvar conferente');
      }
    }
  };

  const addDriver = async () => {
    if (newDriver.name && newDriver.document) {
      try {
        await saveDriver({ ...newDriver, status: 'ATIVO' });
        setNewDriver({ name: '', document: '', phone: '' });
        setShowForm(false);
      } catch (e) {
        alert('Erro ao salvar motorista');
      }
    }
  };

  const addVehicle = async () => {
    if (newVehicle.plate) {
      try {
        await saveVehicle({ ...newVehicle, status: 'ATIVO' });
        setNewVehicle({ plate: '', model: '', type: 'TRUCK' });
        setShowForm(false);
      } catch (e) {
        alert('Erro ao salvar veículo');
      }
    }
  };

  const addBranch = async () => {
    if (newBranch.name && newBranch.code) {
      try {
        await saveBranch({ ...newBranch, status: 'ATIVO' });
        setNewBranch({ name: '', code: '', city: '', state: '' });
        setShowForm(false);
      } catch (e) {
        alert('Erro ao salvar filial');
      }
    }
  };

  const addCD = async () => {
    if (newCD.name && newCD.code) {
      try {
        await saveCD(newCD);
        setNewCD({ name: '', code: '' });
        setShowForm(false);
      } catch (e) {
        alert('Erro ao salvar CD');
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-inter">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          <div className="bg-slate-900 p-10 text-center text-white relative">
             <div className="absolute top-0 left-0 w-full h-1 bg-orange-600"></div>
             <LogoNormatel size={64} className="mx-auto mb-4" />
             <h1 className="text-2xl font-black tracking-tighter uppercase italic">Logística <span className="text-orange-600">Normatel</span></h1>
             <p className="text-slate-400 text-xs mt-1 font-medium tracking-widest uppercase">Warehouse Control Center</p>
          </div>
          <form onSubmit={handleLogin} className="p-8 space-y-5">
             {loginError && (
               <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 flex items-center gap-2">
                 <Lock size={14} /> {loginError}
               </div>
             )}
             <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Usuário</label>
               <input className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium" type="text" placeholder="ID de Usuário" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} required />
             </div>
             <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Senha</label>
               <input className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" type="password" placeholder="••••••••" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
             </div>
             <button type="submit" className="w-full py-4 bg-orange-600 text-white font-black rounded-2xl shadow-xl shadow-orange-200 transition-all active:scale-95 hover:bg-orange-700 uppercase tracking-widest text-sm">Entrar no Sistema</button>
          </form>
          <div className="p-6 bg-slate-50 text-center border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">© 2024 NORMATEL LOGISTICA - V1.5.0</p>
          </div>
        </div>
      </div>
    );
  }

  const addLoadingManifest = (m: LoadingManifest) => {
    setLoadingManifests([m, ...loadingManifests]);
    // Update linked pallet manifests status and delivery date
    setManifests(prev => prev.map(manifest => {
      if (m.linkedManifestIds.includes(manifest.id)) {
        return {
          ...manifest,
          status: 'ENTREGUE',
          deliveryDate: m.deliveryDate
        };
      }
      return manifest;
    }));
  };

  const sortedBranches = [...branches].sort((a, b) => {
    const branchOrder = [
      'FILIAL AS', 'FILIAL BM', 'FILIAL VT', 'FILIAL JN', 'FILIAL SD', 
      'FILIAL PJ', 'FILIAL CB', 'FILIAL EB', 'FILIAL JQ', 'FILIAL GM', 
      'FILIAL TZ', 'FILIAL PD', 'FILIAL RB', 'FILIAL AV'
    ];
    const indexA = branchOrder.indexOf(a.code);
    const indexB = branchOrder.indexOf(b.code);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard manifests={manifests} dateRange={dateRange} setDateRange={setDateRange} />;
      case 'generate': return <ManifestForm checkers={checkers} branches={branches} cds={cds} onSave={async m => {
        try {
          await saveManifest(m);
        } catch (e) {
          alert('Erro ao salvar manifesto no Firebase');
        }
      }} currentUser={user} />;
      case 'loading-manifest': 
        return (
          <LoadingManifestForm 
            drivers={drivers} 
            vehicles={vehicles} 
            branches={branches} 
            cds={cds} 
            pendingManifests={manifests.filter(m => m.status === 'PENDENTE')}
            onSave={async m => {
              try {
                await saveLoadingManifest(m);
              } catch (e) {
                alert('Erro ao salvar embarque no Firebase');
              }
            }} 
            currentUser={user} 
          />
        );
      
      case 'pallet-manifests':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="shrink-0">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Manifestos e Paletes Conferidos</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Controle de conferência e status de entrega</p>
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-4 flex-1 justify-end">
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

                <div className="relative w-full md:w-64">
                  <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input className="w-full pl-12 pr-4 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-sm" placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[1200px]">
                <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="p-6">Manifesto</th>
                    <th className="p-6">Tipo</th>
                    <th className="p-6">Destino</th>
                    <th className="p-6">Conferente</th>
                    <th className="p-6">Pedidos</th>
                    <th className="p-6">Origem</th>
                    <th className="p-6 text-center">Paletes</th>
                    <th className="p-6">Status</th>
                    <th className="p-6">Entrega</th>
                    <th className="p-6 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 italic">
                  {manifests.filter(m => {
                    const date = m.createdAt.split('T')[0];
                    const matchesDate = date >= dateRange.start && date <= dateRange.end;
                    const matchesSearch = m.manifestNumber.includes(searchTerm) || 
                                        (m.branchName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        (m.checkerName || '').toLowerCase().includes(searchTerm.toLowerCase());
                    return matchesDate && matchesSearch;
                  }).map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-6 font-black text-orange-600">{m.manifestNumber}</td>
                      <td className="p-6 font-bold text-slate-500 text-[10px]">{m.conferenceType}</td>
                      <td className="p-6 font-black text-slate-800">{m.branchName}</td>
                      <td className="p-6 font-bold text-slate-600">{m.checkerName}</td>
                      <td className="p-6">
                        <div className="max-w-[200px] truncate text-[10px] font-mono text-slate-400" title={m.orders}>{m.orders}</div>
                      </td>
                      <td className="p-6 font-bold text-slate-500 text-[10px]">{m.cdName}</td>
                      <td className="p-6 text-center font-black text-lg">{m.palletsCount}</td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${m.status === 'ENTREGUE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {m.status || 'PENDENTE'}
                        </span>
                      </td>
                      <td className="p-6 font-bold text-slate-400 text-[10px]">
                        {m.deliveryDate ? new Date(m.deliveryDate).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="p-6 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => generateManifestPDF(m)} className="p-2 text-slate-400 hover:text-orange-600 transition-colors" title="Imprimir Etiquetas"><Printer size={18}/></button>
                          <button onClick={async () => {
                            if (confirm('Deseja excluir este manifesto?')) {
                              try {
                                await deleteManifest(m.id);
                              } catch (e) {
                                alert('Erro ao excluir manifesto');
                              }
                            }
                          }} className="p-2 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case 'users':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Usuários do Sistema</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão de acessos internos</p>
              </div>
              <button onClick={() => setShowForm(!showForm)} className={`p-4 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all ${showForm ? 'bg-slate-100 text-slate-500' : 'bg-orange-600 text-white shadow-lg shadow-orange-100'}`}>
                {showForm ? <X size={18} /> : <UserPlus size={18}/>} {showForm ? 'Cancelar' : 'Novo Usuário'}
              </button>
            </div>
            
            {showForm && (
              <div className="p-8 bg-white border border-orange-100 rounded-3xl shadow-xl space-y-6 animate-in slide-in-from-top duration-300">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                    <input className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Nome do colaborador" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuário / Email</label>
                    <input className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Ex: joao.silva" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Temporária</label>
                    <input type="password" className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="••••••••" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Perfil de Acesso</label>
                    <select className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})}>
                      <option value="CONFERENTE">CONFERENTE</option>
                      <option value="ADMINISTRATIVO">ADMINISTRATIVO</option>
                      <option value="ADMIN">ADMINISTRADOR</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={addUser} className="px-8 py-4 bg-orange-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-orange-100">Confirmar Cadastro</button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b tracking-widest">
                    <tr><th className="p-6">Nome</th><th className="p-6">Usuário</th><th className="p-6">Perfil</th><th className="p-6 text-center">Ação</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">{allUsers.map(u => (
                      <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                        <td className="p-6 flex items-center gap-3"><div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center"><User size={20} /></div><span className="font-black text-slate-800 uppercase tracking-tighter text-sm">{u.name}</span></td>
                        <td className="p-6 text-slate-500 font-mono text-sm">{u.email}</td>
                        <td className="p-6"><span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${u.role === 'ADMIN' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>{u.role}</span></td>
                        <td className="p-6 text-center">{u.uid !== user.uid && u.email !== 'diego.silva' && (<button onClick={async () => {
                          if (confirm('Deseja excluir este usuário?')) {
                            try {
                              await deleteUser(u.uid);
                            } catch (e) {
                              alert('Erro ao excluir usuário');
                            }
                          }
                        }} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>)}</td>
                      </tr>
                    ))}</tbody>
               </table>
            </div>
          </div>
        );

      case 'cds':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Centros de Distribuição</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Unidades de Origem Logística</p>
              </div>
              <button onClick={() => setShowForm(!showForm)} className={`p-4 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all ${showForm ? 'bg-slate-100 text-slate-500' : 'bg-orange-600 text-white shadow-lg shadow-orange-100'}`}>
                {showForm ? <X size={18} /> : <Warehouse size={18}/>} {showForm ? 'Cancelar' : 'Novo CD'}
              </button>
            </div>

            {showForm && (
              <div className="p-8 bg-white border border-orange-100 rounded-3xl shadow-xl space-y-6 animate-in slide-in-from-top duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cód. Identificador</label>
                    <input className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-black text-orange-600" placeholder="Ex: CD-FORTALEZA" value={newCD.code} onChange={e => setNewCD({...newCD, code: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Unidade</label>
                    <input className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Ex: Matriz - Maracanaú" value={newCD.name} onChange={e => setNewCD({...newCD, name: e.target.value})} />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={addCD} className="px-8 py-4 bg-orange-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-orange-100">Salvar Unidade</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {cds.map(c => (
                 <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-orange-50 rounded-bl-full flex items-center justify-center -mr-4 -mt-4 opacity-40">
                       <Warehouse size={28} className="text-orange-600 translate-x-[-4px] translate-y-[4px]" />
                    </div>
                    <span className="text-orange-600 font-black text-2xl tracking-tighter mb-2 block">{c.code}</span>
                    <h4 className="font-black text-slate-800 uppercase tracking-tighter text-sm mb-4 leading-tight">{c.name}</h4>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Unidade Operacional</span>
                       <button onClick={async () => {
                         if (confirm('Deseja excluir este CD?')) {
                           try {
                             await deleteCD(c.id);
                           } catch (e) {
                             alert('Erro ao excluir CD');
                           }
                         }
                       }} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        );

      case 'drivers':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Motoristas Cadastrados</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Frota própria e terceirizados</p>
              </div>
              <button onClick={() => setShowForm(!showForm)} className={`p-4 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all ${showForm ? 'bg-slate-100 text-slate-500' : 'bg-orange-600 text-white shadow-lg shadow-orange-100'}`}>
                {showForm ? <X size={18} /> : <Plus size={18}/>} {showForm ? 'Cancelar' : 'Novo Motorista'}
              </button>
            </div>

            {showForm && (
              <div className="p-8 bg-white border border-orange-100 rounded-3xl shadow-xl space-y-6 animate-in slide-in-from-top duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px) font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                    <input className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" placeholder="Nome do motorista" value={newDriver.name} onChange={e => setNewDriver({...newDriver, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF / CNH</label>
                    <input className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-mono" placeholder="Somente números" value={newDriver.document} onChange={e => setNewDriver({...newDriver, document: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp / Contato</label>
                    <input className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-mono" placeholder="(00) 00000-0000" value={newDriver.phone} onChange={e => setNewDriver({...newDriver, phone: e.target.value})} />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={addDriver} className="px-8 py-4 bg-orange-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-orange-100">Salvar Registro</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drivers.map(d => (
                <div key={d.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-orange-200 transition-all group">
                   <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-orange-600 group-hover:text-white transition-all">
                        <User size={24} />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[8px] font-black uppercase tracking-widest mb-1">Ativo</span>
                        <button onClick={async () => {
                          if (confirm('Deseja excluir este motorista?')) {
                            try {
                              await deleteDriver(d.id);
                            } catch (e) {
                              alert('Erro ao excluir motorista');
                            }
                          }
                        }} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                      </div>
                   </div>
                   <h4 className="font-black text-slate-800 uppercase tracking-tighter text-lg leading-none mb-4">{d.name}</h4>
                   <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-500">
                        <FileBadge size={14} className="text-orange-500" />
                        <span className="text-xs font-mono">{d.document}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Phone size={14} className="text-orange-500" />
                        <span className="text-xs font-mono">{d.phone || 'N/A'}</span>
                      </div>
                   </div>
                   <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motorista Frota</span>
                      <ChevronRight size={16} className="text-slate-200" />
                   </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'vehicles':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Gestão de Veículos</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Controle de frota e capacidade</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowForm(!showForm)} className={`p-4 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all ${showForm ? 'bg-slate-100 text-slate-500' : 'bg-orange-600 text-white shadow-lg shadow-orange-100'}`}>
                  {showForm ? <X size={18} /> : <Truck size={18}/>} {showForm ? 'Cancelar' : 'Novo Veículo'}
                </button>
              </div>
            </div>

            {showForm && (
              <div className="p-8 bg-white border border-orange-100 rounded-3xl shadow-xl space-y-6 animate-in slide-in-from-top duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Placa do Veículo</label>
                    <input className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-black text-lg uppercase tracking-tighter" placeholder="AAA-0000" value={newVehicle.plate} onChange={e => setNewVehicle({...newVehicle, plate: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelo / Descrição</label>
                    <input className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Ex: Mercedes Accelo 1016" value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Veículo</label>
                    <select className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" value={newVehicle.type} onChange={e => setNewVehicle({...newVehicle, type: e.target.value})}>
                      <option value="CARRETA">CARRETA</option>
                      <option value="TRUCK">TRUCK</option>
                      <option value="TOCO">TOCO</option>
                      <option value="3/4">3/4</option>
                      <option value="VAN">VAN</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={addVehicle} className="px-8 py-4 bg-orange-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-orange-100">Cadastrar Veículo</button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b tracking-widest">
                    <tr><th className="p-6">Placa</th><th className="p-6">Tipo</th><th className="p-6">Modelo</th><th className="p-6 text-center">Ação</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">{vehicles.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-6"><div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg border-2 border-slate-700 font-mono font-bold text-base inline-block tracking-tighter shadow-sm">{v.plate}</div></td>
                        <td className="p-6"><span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase">{v.type}</span></td>
                        <td className="p-6 font-bold text-slate-700 uppercase text-sm">{v.model}</td>
                        <td className="p-6 text-center">
                          <button onClick={async () => {
                            if (confirm('Deseja excluir este veículo?')) {
                              try {
                                await deleteVehicle(v.id);
                              } catch (e) {
                                alert('Erro ao excluir veículo');
                              }
                            }
                          }} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                        </td>
                      </tr>
                    ))}</tbody>
               </table>
            </div>
          </div>
        );

      case 'branches':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Gestão de Filiais</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Pontos de destino da mercadoria</p>
              </div>
                <button onClick={() => setShowForm(!showForm)} className={`p-4 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all ${showForm ? 'bg-slate-100 text-slate-500' : 'bg-orange-600 text-white shadow-lg shadow-orange-100'}`}>
                  {showForm ? <X size={18} /> : <Building2 size={18}/>} {showForm ? 'Cancelar' : 'Nova Filial'}
                </button>
            </div>

            {showForm && (
              <div className="p-8 bg-white border border-orange-100 rounded-3xl shadow-xl space-y-6 animate-in slide-in-from-top duration-300">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cód. Filial</label>
                    <input className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-black text-orange-600" placeholder="Ex: F01" value={newBranch.code} onChange={e => setNewBranch({...newBranch, code: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Fantasia</label>
                    <input className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Ex: Normatel Washington Soares" value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cidade</label>
                    <input className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Cidade" value={newBranch.city} onChange={e => setNewBranch({...newBranch, city: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado (UF)</label>
                    <input className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="CE" maxLength={2} value={newBranch.state} onChange={e => setNewBranch({...newBranch, state: e.target.value.toUpperCase()})} />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={addBranch} className="px-8 py-4 bg-orange-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-orange-100">Salvar Filial</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {sortedBranches.map(b => (
                 <div key={b.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-bl-full flex items-center justify-center -mr-4 -mt-4 opacity-40 group-hover:bg-orange-100 transition-colors">
                       <MapPin size={24} className="text-orange-600 translate-x-[-4px] translate-y-[4px]" />
                    </div>
                    <span className="text-orange-600 font-black text-2xl tracking-tighter mb-2 block">{b.code}</span>
                    <h4 className="font-black text-slate-800 uppercase tracking-tighter text-sm mb-1 leading-tight">{b.name}</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{b.city} - {b.state}</p>
                    <div className="mt-6 flex justify-between items-center">
                       <span className="flex items-center gap-1 text-[8px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-full"><CheckCircle2 size={10} /> Operando</span>
                       <button onClick={async () => {
                         if (confirm('Deseja excluir esta filial?')) {
                           try {
                             await deleteBranch(b.id);
                           } catch (e) {
                             alert('Erro ao excluir filial');
                           }
                         }
                       }} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="shrink-0">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Histórico de Embarques</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Manifestos de carga finalizados</p>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4 flex-1 justify-end">
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

                <div className="relative w-full md:w-64">
                  <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input className="w-full pl-12 pr-4 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-sm" placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[1000px]">
                <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="p-6">Nº Carga</th>
                    <th className="p-6">Data Saída</th>
                    <th className="p-6">Placa</th>
                    <th className="p-6">Motorista</th>
                    <th className="p-6">Destino</th>
                    <th className="p-6 text-center">NFs</th>
                    <th className="p-6 text-center">Manifestos</th>
                    <th className="p-6 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 italic">
                  {loadingManifests.filter(m => {
                    const date = m.createdAt.split('T')[0];
                    const matchesDate = date >= dateRange.start && date <= dateRange.end;
                    const matchesSearch = m.manifestNumber.includes(searchTerm) || 
                                        m.vehiclePlate.includes(searchTerm) ||
                                        (m.driverName || '').toLowerCase().includes(searchTerm.toLowerCase());
                    return matchesDate && matchesSearch;
                  }).map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-6 font-black text-slate-800 uppercase tracking-tighter">{m.manifestNumber}</td>
                      <td className="p-6 text-slate-500 font-bold text-[10px]">{new Date(m.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td className="p-6"><div className="bg-slate-100 px-3 py-1.5 rounded-lg text-[11px] font-black font-mono inline-block border border-slate-200">{m.vehiclePlate}</div></td>
                      <td className="p-6 font-bold text-slate-600">{m.driverName}</td>
                      <td className="p-6 font-black text-slate-800">{m.branchName}</td>
                      <td className="p-6 text-center font-black text-orange-600">{m.invoices.length}</td>
                      <td className="p-6 text-center font-black text-slate-400">{m.linkedManifestIds?.length || 0}</td>
                      <td className="p-6 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => generateLoadingManifestPDF(m)} className="p-2 text-slate-400 hover:text-orange-600 transition-colors" title="Imprimir Manifesto"><Printer size={18}/></button>
                          <button onClick={async () => {
                            if (confirm('Deseja excluir este embarque?')) {
                              try {
                                await deleteLoadingManifest(m.id);
                              } catch (e) {
                                alert('Erro ao excluir embarque');
                              }
                            }
                          }} className="p-2 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'checkers':
        return (
          <div className="space-y-6">
             <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Equipe de Conferência</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Colaboradores ativos no CD</p>
              </div>
              <button onClick={() => setShowForm(!showForm)} className={`p-4 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all ${showForm ? 'bg-slate-100 text-slate-500' : 'bg-orange-600 text-white shadow-lg shadow-orange-100'}`}>
                {showForm ? <X size={18} /> : <UserCheck size={18}/>} {showForm ? 'Cancelar' : 'Novo Conferente'}
              </button>
            </div>
            {showForm && (
              <div className="p-8 bg-white border border-orange-100 rounded-3xl shadow-xl space-y-6 animate-in slide-in-from-top duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Conferente</label>
                    <input className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" placeholder="Nome Completo" value={newChecker.name} onChange={e => setNewChecker({...newChecker, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Crachá / Matrícula</label>
                    <input className="w-full p-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-mono" placeholder="Ex: CF1001" value={newChecker.externalId} onChange={e => setNewChecker({...newChecker, externalId: e.target.value})} />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={addChecker} className="px-8 py-4 bg-orange-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-orange-100">Registrar Conferente</button>
                </div>
              </div>
            )}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b tracking-widest"><tr><th className="p-6">Nome</th><th className="p-6">ID Matrícula</th><th className="p-6 text-center">Ação</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">{checkers.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-6 font-black text-slate-800 uppercase tracking-tighter text-sm">{c.name}</td>
                      <td className="p-6 text-slate-500 font-mono text-sm tracking-widest">{c.externalId}</td>
                      <td className="p-6 text-center">
                        <button onClick={async () => {
                          if (confirm('Deseja excluir este conferente?')) {
                            try {
                              await deleteChecker(c.id);
                            } catch (e) {
                              alert('Erro ao excluir conferente');
                            }
                          }
                        }} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                      </td>
                    </tr>
                  ))}</tbody>
               </table>
            </div>
          </div>
        );
      default: return <Dashboard manifests={manifests} />;
    }
  };

  return (
    <Layout user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}>
      {renderContent()}
    </Layout>
  );
};

export default App;
