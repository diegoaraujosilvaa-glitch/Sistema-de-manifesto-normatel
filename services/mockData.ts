
import { Checker, Branch, DistributionCenter, Manifest } from '../types';

export const INITIAL_CHECKERS: Checker[] = [
  { id: 'c1', externalId: 'CONF001', name: 'João Silva', status: 'ATIVO' },
  { id: 'c2', externalId: 'CONF002', name: 'Maria Santos', status: 'ATIVO' },
];

export const INITIAL_BRANCHES: Branch[] = [
  { id: 'b1', code: 'FIL01', name: 'Filial São Paulo', city: 'São Paulo', state: 'SP', status: 'ATIVO' },
  { id: 'b2', code: 'FIL02', name: 'Filial Rio de Janeiro', city: 'Rio de Janeiro', state: 'RJ', status: 'ATIVO' },
];

export const INITIAL_CDS: DistributionCenter[] = [
  { id: 'cd1', code: 'CD-SUL', name: 'Centro de Distribuição Sul' },
  { id: 'cd2', code: 'CD-NORTE', name: 'Centro de Distribuição Norte' },
];
