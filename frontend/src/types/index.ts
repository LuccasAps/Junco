export interface Row {
  nota: string;
  emissao_nf: string | null;
  emissao_pedido: string | null;
  expedicao: string | null;
  entrega: string | null;
  previsao: string | null;
  cliente: string;
  uf: string;
  regiao: string;
  transportadora: string;
  operacao: string;
  no_prazo: boolean | null;
  ped_to_nf: number | null;
  nf_to_exp: number | null;
  exp_to_ent: number | null;
  nf_to_ent: number | null;
  total: number | null;
  mes_ano: string;
}

export interface Filters {
  ufs: string[];
  transportadoras: string[];
  clientes: string[];
  operacoes: string[];
  regioes: string[];
  dateFrom: string;
  dateTo: string;
}

export interface KPIs {
  totalRecords: number;
  leadTotal: number | null;
  pedNf: number | null;
  nfExp: number | null;
  expEnt: number | null;
  pctPrazo: number | null;
  noPrazoCount: number | null;
  atrasoCount: number | null;
  transportadorasCount: number;
}