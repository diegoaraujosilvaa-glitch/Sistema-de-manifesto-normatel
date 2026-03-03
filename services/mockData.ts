
import { Checker, Branch, DistributionCenter, Vehicle } from '../types';

export const INITIAL_CHECKERS: Checker[] = [
  { id: 'c1', externalId: 'CONF001', name: 'João Silva', status: 'ATIVO' },
  { id: 'c2', externalId: 'CONF002', name: 'Maria Santos', status: 'ATIVO' },
];

export const INITIAL_BRANCHES: Branch[] = [
  { id: 'b1', code: 'FILIAL AS', name: 'ANTONIO SALES', city: 'FORTALEZA', state: 'CE', status: 'ATIVO' },
  { id: 'b2', code: 'FILIAL BM', name: 'BEZERRA ED MENEZES', city: 'FORTALEZA', state: 'CE', status: 'ATIVO' },
  { id: 'b3', code: 'FILIAL VT', name: 'PREMIUM', city: 'FORTALEZA', state: 'CE', status: 'ATIVO' },
  { id: 'b4', code: 'FILIAL JN', name: 'JUAZEIRO DO NORTE', city: 'JUAZEIRO', state: 'CE', status: 'ATIVO' },
  { id: 'b5', code: 'FILIAL SD', name: 'SANTOS DUMONT', city: 'FORTALEZA', state: 'CE', status: 'ATIVO' },
  { id: 'b6', code: 'FILIAL PJ', name: 'PAJUÇARA', city: 'FORTALEZA', state: 'CE', status: 'ATIVO' },
  { id: 'b7', code: 'FILIAL CB', name: 'CAMBEBA', city: 'FORTALEZA', state: 'CE', status: 'ATIVO' },
  { id: 'b8', code: 'FILIAL EB', name: 'EUSÉBIO', city: 'FORTALEZA', state: 'CE', status: 'ATIVO' },
  { id: 'b9', code: 'FILIAL JQ', name: 'JOQUEI', city: 'FORTALEZA', state: 'CE', status: 'ATIVO' },
  { id: 'b10', code: 'FILIAL GM', name: 'GODOFREDO MACIEL', city: 'FORTALEZA', state: 'CE', status: 'ATIVO' },
  { id: 'b11', code: 'FILIAL TZ', name: 'TERRAZO', city: 'FORTALEZA', state: 'CE', status: 'ATIVO' },
  { id: 'b12', code: 'FILIAL PD', name: 'PORTO DAS DUNAS', city: 'FORTALEZA', state: 'CE', status: 'ATIVO' },
  { id: 'b13', code: 'FILIAL RB', name: 'RUI BARBOSA', city: 'FORTALEZA', state: 'CE', status: 'ATIVO' },
];

export const INITIAL_CDS: DistributionCenter[] = [
  { id: 'cd1', code: 'CD/AV', name: 'CD ANEL VIARIO' },
];

export const INITIAL_VEHICLES: Vehicle[] = [
  { id: 'v1', plate: 'PNZ4406', type: 'TRUCK', model: 'MB08', status: 'ATIVO' },
  { id: 'v2', plate: 'ORZ0465', type: 'TRUCK', model: 'MB09', status: 'ATIVO' },
  { id: 'v3', plate: 'HWL7403', type: 'TRUCK', model: 'MB18', status: 'ATIVO' },
  { id: 'v4', plate: 'HXY7945', type: 'TRUCK', model: 'MB19', status: 'ATIVO' },
  { id: 'v5', plate: 'OSA6711', type: 'TRUCK', model: 'MB20', status: 'ATIVO' },
  { id: 'v6', plate: 'OSL9998', type: 'CARRETA', model: 'MB21', status: 'ATIVO' },
  { id: 'v7', plate: 'PMH9219', type: 'TRUCK', model: 'MB23', status: 'ATIVO' },
  { id: 'v8', plate: 'OCF9681', type: 'TOCO', model: 'MB24', status: 'ATIVO' },
  { id: 'v9', plate: 'OSU7145', type: 'TOCO', model: 'MB49', status: 'ATIVO' },
  { id: 'v10', plate: 'POW9495', type: 'TOCO', model: 'MB51', status: 'ATIVO' },
  { id: 'v11', plate: 'PNR2C84', type: 'TOCO', model: 'MB55', status: 'ATIVO' },
  { id: 'v12', plate: 'POR0C93', type: 'TOCO', model: 'MB56', status: 'ATIVO' },
  { id: 'v13', plate: 'POZ5F66', type: 'TOCO', model: 'MB59', status: 'ATIVO' },
  { id: 'v14', plate: 'OIM0086', type: 'TOCO', model: 'MB60', status: 'ATIVO' },
  { id: 'v15', plate: 'SBK9I25', type: 'TOCO', model: 'MB62', status: 'ATIVO' },
  { id: 'v16', plate: 'SBV7I66', type: 'TOCO', model: 'MB63', status: 'ATIVO' },
  { id: 'v17', plate: 'SBD9F47', type: 'TOCO', model: 'MB65', status: 'ATIVO' },
  { id: 'v18', plate: 'SAX9B97', type: 'TOCO', model: 'MB66', status: 'ATIVO' },
  { id: 'v19', plate: 'SBT6A94', type: 'TOCO', model: 'MB67', status: 'ATIVO' },
  { id: 'v20', plate: 'NIU2I54', type: 'TOCO', model: 'MB69', status: 'ATIVO' },
  { id: 'v21', plate: 'THN6F19', type: 'TOCO', model: 'MB71', status: 'ATIVO' },
  { id: 'v22', plate: 'TIM8C08', type: '3/4', model: 'MB72', status: 'ATIVO' },
  { id: 'v23', plate: 'PNY8C03', type: 'TOCO', model: 'MB73', status: 'ATIVO' },
];
