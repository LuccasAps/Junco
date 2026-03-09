import type { Row, Filters, KPIs } from "../types";

// ─── Utilities ────────────────────────────────────────────────────────────────

function safeMean(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null && v >= 0);
  return valid.length ? parseFloat((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1)) : null;
}

function round1(v: number | null): number | null {
  return v !== null ? parseFloat(v.toFixed(1)) : null;
}

// ─── Filter ───────────────────────────────────────────────────────────────────

export function applyFilters(rows: Row[], filters: Filters): Row[] {
  return rows.filter((r) => {
    if (filters.ufs.length && !filters.ufs.includes(r.uf)) return false;
    if (filters.transportadoras.length && !filters.transportadoras.includes(r.transportadora)) return false;
    if (filters.clientes.length && !filters.clientes.includes(r.cliente)) return false;
    if (filters.operacoes.length && !filters.operacoes.includes(r.operacao)) return false;
    if (filters.regioes.length && !filters.regioes.includes(r.regiao)) return false;
    if (filters.dateFrom && r.emissao_nf && r.emissao_nf < filters.dateFrom) return false;
    if (filters.dateTo && r.emissao_nf && r.emissao_nf > filters.dateTo) return false;
    return true;
  });
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export function computeKPIs(rows: Row[]): KPIs {
  const prazoRows = rows.filter((r) => r.no_prazo !== null);
  const noPrazoCount = prazoRows.filter((r) => r.no_prazo === true).length;
  const atrasoCount = prazoRows.filter((r) => r.no_prazo === false).length;
  const pctPrazo =
    prazoRows.length > 0
      ? parseFloat(((noPrazoCount / prazoRows.length) * 100).toFixed(1))
      : null;

  return {
    totalRecords: rows.length,
    leadTotal: safeMean(rows.map((r) => r.total)),
    pedNf: safeMean(rows.map((r) => r.ped_to_nf)),
    nfExp: safeMean(rows.map((r) => r.nf_to_exp)),
    expEnt: safeMean(rows.map((r) => r.exp_to_ent)),
    pctPrazo,
    noPrazoCount: prazoRows.length > 0 ? noPrazoCount : null,
    atrasoCount: prazoRows.length > 0 ? atrasoCount : null,
    transportadorasCount: new Set(rows.map((r) => r.transportadora)).size,
  };
}

// ─── Trend ────────────────────────────────────────────────────────────────────

export function computeTrend(rows: Row[]) {
  const map = new Map<string, number[][]>();
  for (const r of rows) {
    if (!r.mes_ano) continue;
    if (!map.has(r.mes_ano)) map.set(r.mes_ano, [[], [], []]);
    const [totals, expEnts, pedNfs] = map.get(r.mes_ano)!;
    if (r.total !== null && r.total >= 0) totals.push(r.total);
    if (r.exp_to_ent !== null && r.exp_to_ent >= 0) expEnts.push(r.exp_to_ent);
    if (r.ped_to_nf !== null && r.ped_to_nf >= 0) pedNfs.push(r.ped_to_nf);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, [totals, expEnts, pedNfs]]) => ({
      mes,
      "Lead Total": round1(safeMean(totals)),
      "Exp→Entrega": round1(safeMean(expEnts)),
      "Pedido→NF": round1(safeMean(pedNfs)),
    }));
}

// ─── By UF ────────────────────────────────────────────────────────────────────

export function computeByUf(rows: Row[]) {
  const map = new Map<string, number[]>();
  for (const r of rows) {
    if (r.uf === "N/D") continue;
    if (!map.has(r.uf)) map.set(r.uf, []);
    if (r.total !== null && r.total >= 0) map.get(r.uf)!.push(r.total);
  }
  return Array.from(map.entries())
    .map(([uf, vals]) => ({ uf, "Dias Médios": round1(safeMean(vals)) ?? 0 }))
    .filter((d) => d["Dias Médios"] > 0)
    .sort((a, b) => b["Dias Médios"] - a["Dias Médios"])
    .slice(0, 15);
}

// ─── By Transportadora ────────────────────────────────────────────────────────

export function computeByTransportadora(rows: Row[]) {
  const map = new Map<string, { days: number[]; count: number; prazo: boolean[] }>();
  for (const r of rows) {
    if (r.transportadora === "N/D") continue;
    if (!map.has(r.transportadora)) map.set(r.transportadora, { days: [], count: 0, prazo: [] });
    const entry = map.get(r.transportadora)!;
    entry.count++;
    if (r.exp_to_ent !== null && r.exp_to_ent >= 0) entry.days.push(r.exp_to_ent);
    if (r.no_prazo !== null) entry.prazo.push(r.no_prazo);
  }

  return Array.from(map.entries())
    .filter(([, v]) => v.count >= 2)
    .map(([transportadora, v]) => {
      const label =
        transportadora.length > 32 ? transportadora.slice(0, 30) + "…" : transportadora;
      const pct =
        v.prazo.length > 0
          ? parseFloat(((v.prazo.filter(Boolean).length / v.prazo.length) * 100).toFixed(1))
          : null;
      return {
        transportadora: label,
        "Dias (Exp→Ent)": round1(safeMean(v.days)) ?? 0,
        "% No Prazo": pct,
        entregas: v.count,
      };
    })
    .sort((a, b) => b["Dias (Exp→Ent)"] - a["Dias (Exp→Ent)"])
    .slice(0, 12);
}

// ─── By Região ────────────────────────────────────────────────────────────────

export function computeByRegiao(rows: Row[]) {
  const map = new Map<string, number[]>();
  for (const r of rows) {
    if (r.regiao === "N/D") continue;
    if (!map.has(r.regiao)) map.set(r.regiao, []);
    if (r.total !== null && r.total >= 0) map.get(r.regiao)!.push(r.total);
  }
  return Array.from(map.entries())
    .map(([regiao, vals]) => ({ regiao, "Dias Médios": round1(safeMean(vals)) ?? 0 }))
    .filter((d) => d["Dias Médios"] > 0);
}

// ─── Rankings ─────────────────────────────────────────────────────────────────

export function computeRankings(rows: Row[]) {
  const map = new Map<string, { days: number[]; count: number; prazo: boolean[] }>();
  for (const r of rows) {
    if (r.transportadora === "N/D") continue;
    if (!map.has(r.transportadora)) map.set(r.transportadora, { days: [], count: 0, prazo: [] });
    const entry = map.get(r.transportadora)!;
    entry.count++;
    if (r.exp_to_ent !== null && r.exp_to_ent >= 0) entry.days.push(r.exp_to_ent);
    if (r.no_prazo !== null) entry.prazo.push(r.no_prazo);
  }

  const all = Array.from(map.entries())
    .filter(([, v]) => v.count >= 2)
    .map(([name, v]) => ({
      Transportadora: name,
      "Lead Time (d)": round1(safeMean(v.days)) ?? 0,
      Entregas: v.count,
      "% No Prazo":
        v.prazo.length > 0
          ? parseFloat(((v.prazo.filter(Boolean).length / v.prazo.length) * 100).toFixed(1))
          : null,
    }))
    .sort((a, b) => a["Lead Time (d)"] - b["Lead Time (d)"]);

  return { best: all.slice(0, 5), worst: all.slice(-5).reverse() };
}

// ─── Prazo Donut ──────────────────────────────────────────────────────────────

export function computePrazo(rows: Row[]) {
  const valid = rows.filter((r) => r.no_prazo !== null);
  if (!valid.length) return null;
  const on = valid.filter((r) => r.no_prazo === true).length;
  const off = valid.filter((r) => r.no_prazo === false).length;
  return [
    { name: "No Prazo", value: on },
    { name: "Em Atraso", value: off },
  ];
}

// ─── Filter Options ───────────────────────────────────────────────────────────

export function getFilterOptions(rows: Row[]) {
  const unique = (vals: string[]) =>
    [...new Set(vals)].filter((v) => v && v !== "N/D").sort();
  const dates = rows.map((r) => r.emissao_nf).filter(Boolean) as string[];
  return {
    ufs: unique(rows.map((r) => r.uf)),
    transportadoras: unique(rows.map((r) => r.transportadora)),
    clientes: unique(rows.map((r) => r.cliente)),
    operacoes: unique(rows.map((r) => r.operacao)),
    regioes: unique(rows.map((r) => r.regiao)),
    dateMin: dates.length ? dates.sort()[0] : "",
    dateMax: dates.length ? dates.sort().at(-1)! : "",
  };
}