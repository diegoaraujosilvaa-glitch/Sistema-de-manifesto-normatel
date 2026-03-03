
export type UserRole = 'ADMIN' | 'CONFERENTE' | 'ADMINISTRATIVO';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string; // Opcional para persistência local
}

export interface Checker {
  id: string;
  externalId: string;
  name: string;
  status: 'ATIVO' | 'INATIVO';
}

export interface Driver {
  id: string;
  name: string;
  document: string; // CPF or CNH
  phone: string;
  status: 'ATIVO' | 'INATIVO';
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  type: string;
  status: 'ATIVO' | 'INATIVO';
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  status: 'ATIVO' | 'INATIVO';
}

export interface DistributionCenter {
  id: string;
  code: string;
  name: string;
}

export interface InvoiceItem {
  key: string;
  number: string;
  manifestNumber?: string; // Opcional para legibilidade
}

export interface Manifest {
  id: string;
  manifestNumber: string;
  orders: string;
  conferenceDate: string;
  cdId: string;
  branchId: string;
  checkerId: string;
  palletsCount: number;
  conferenceType: string;
  specialProducts: string[];
  status: 'PENDENTE' | 'ENTREGUE';
  deliveryDate?: string;
  createdAt: string;
  createdBy: string;
  cdName: string;
  branchName: string;
  checkerName: string;
}

export interface LoadingManifest {
  id: string;
  manifestNumber: string;
  cdId: string;
  branchId: string;
  driverId: string;
  vehicleId: string;
  sealNumber: string;
  deliveryDate: string;
  exitTime: string;
  linkedManifestIds: string[];
  invoices: InvoiceItem[];
  createdAt: string;
  createdBy: string;
  // Denormalized
  cdName: string;
  branchName: string;
  driverName: string;
  vehiclePlate: string;
}

export interface DashboardStats {
  totalManifestsToday: number;
  totalPalletsToday: number;
  dailyVolume: { date: string; count: number }[];
}
