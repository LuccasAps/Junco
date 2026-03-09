import { useState, useMemo } from "react";
import type { Row, Filters } from "./types";
import { uploadFile } from "./api/client";
import {
  applyFilters,
  computeKPIs,
  computeTrend,
  computeByUf,
  computeByTransportadora,
  computeByRegiao,
  computeRankings,
  computePrazo,
  getFilterOptions,
} from "./lib/analytics";

import Header from "./components/Header";
import UploadZone from "./components/UploadZone";
import Sidebar from "./components/Sidebar";
import KpiRow from "./components/KpiRow";
import StepMatrix from "./components/StepMatrix";
import TrendChart from "./components/TrendChart";
import DimensionCharts from "./components/DimensionCharts";
import RankingTables from "./components/RankingTables";
import DataTable from "./components/DataTable";

export default function App() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    ufs: [], transportadoras: [], clientes: [], operacoes: [], regioes: [],
    dateFrom: "", dateTo: "",
  });

  async function handleUpload(file: File) {
    setLoading(true);
    setError(null);
    try {
      const data = await uploadFile(file);
      setRows(data);
      const opts = getFilterOptions(data);
      setFilters({
        ufs: [], transportadoras: [], clientes: [], operacoes: [], regioes: [],
        dateFrom: opts.dateMin, dateTo: opts.dateMax,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }

  const options = useMemo(() => getFilterOptions(rows), [rows]);
  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const kpis = useMemo(() => computeKPIs(filtered), [filtered]);
  const trend = useMemo(() => computeTrend(filtered), [filtered]);
  const byUf = useMemo(() => computeByUf(filtered), [filtered]);
  const byTransportadora = useMemo(() => computeByTransportadora(filtered), [filtered]);
  const byRegiao = useMemo(() => computeByRegiao(filtered), [filtered]);
  const { best, worst } = useMemo(() => computeRankings(filtered), [filtered]);
  const prazo = useMemo(() => computePrazo(filtered), [filtered]);

  function resetFilters() {
    setFilters({
      ufs: [], transportadoras: [], clientes: [], operacoes: [], regioes: [],
      dateFrom: options.dateMin, dateTo: options.dateMax,
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-6">
        <Header />

        {rows.length === 0 ? (
          <UploadZone onUpload={handleUpload} loading={loading} error={error} />
        ) : (
          <div className="flex gap-6 items-start">
            <Sidebar
              options={options}
              filters={filters}
              totalRecords={rows.length}
              filteredRecords={filtered.length}
              onChange={setFilters}
              onReset={resetFilters}
            />

            <div className="flex-1 min-w-0">
              {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
                  Nenhum registro encontrado para os filtros selecionados.
                </div>
              ) : (
                <>
                  <KpiRow kpis={kpis} />
                  <StepMatrix kpis={kpis} />
                  <TrendChart data={trend} />
                  <DimensionCharts byUf={byUf} byTransportadora={byTransportadora} byRegiao={byRegiao} />
                  <RankingTables best={best} worst={worst} prazo={prazo} />
                  <DataTable rows={filtered} />
                </>
              )}

              <div className="mt-4 text-center">
                <button
                  onClick={() => { setRows([]); setError(null); }}
                  className="text-sm text-slate-400 hover:text-blue-600 underline underline-offset-2"
                >
                  Carregar outro arquivo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
