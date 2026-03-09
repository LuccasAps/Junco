import { MultiSelect, MultiSelectItem, DateRangePicker } from "@tremor/react";
import type { DateRangePickerValue } from "@tremor/react";
import type { Filters } from "../types";

interface Options {
  ufs: string[];
  transportadoras: string[];
  clientes: string[];
  operacoes: string[];
  regioes: string[];
  dateMin: string;
  dateMax: string;
}

interface Props {
  options: Options;
  filters: Filters;
  totalRecords: number;
  filteredRecords: number;
  onChange: (f: Filters) => void;
  onReset: () => void;
}

export default function Sidebar({ options, filters, totalRecords, filteredRecords, onChange, onReset }: Props) {
  function set(key: keyof Filters, value: string[]) {
    onChange({ ...filters, [key]: value });
  }

  function setDateRange(val: DateRangePickerValue) {
    onChange({
      ...filters,
      dateFrom: val.from ? val.from.toISOString().slice(0, 10) : options.dateMin,
      dateTo: val.to ? val.to.toISOString().slice(0, 10) : options.dateMax,
    });
  }

  const dateValue: DateRangePickerValue = {
    from: filters.dateFrom ? new Date(filters.dateFrom + "T00:00:00") : undefined,
    to: filters.dateTo ? new Date(filters.dateTo + "T00:00:00") : undefined,
  };

  return (
    <aside className="w-64 shrink-0 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm self-start sticky top-4">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">
          Filtros
        </h2>
        <button
          onClick={onReset}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Limpar
        </button>
      </div>

      <div className="space-y-4">
        <Field label="Período (Emissão NF)">
          <DateRangePicker
            value={dateValue}
            onValueChange={setDateRange}
            selectPlaceholder="Selecionar"
            className="w-full"
          />
        </Field>

        <Field label="UF (Destino)">
          <MultiSelect
            placeholder="Todas"
            value={filters.ufs}
            onValueChange={(v) => set("ufs", v)}
          >
            {options.ufs.map((v) => <MultiSelectItem key={v} value={v}>{v}</MultiSelectItem>)}
          </MultiSelect>
        </Field>

        <Field label="Transportadora">
          <MultiSelect
            placeholder="Todas"
            value={filters.transportadoras}
            onValueChange={(v) => set("transportadoras", v)}
          >
            {options.transportadoras.map((v) => (
              <MultiSelectItem key={v} value={v}>{v}</MultiSelectItem>
            ))}
          </MultiSelect>
        </Field>

        <Field label="Região">
          <MultiSelect
            placeholder="Todas"
            value={filters.regioes}
            onValueChange={(v) => set("regioes", v)}
          >
            {options.regioes.map((v) => <MultiSelectItem key={v} value={v}>{v}</MultiSelectItem>)}
          </MultiSelect>
        </Field>

        <Field label="Operação">
          <MultiSelect
            placeholder="Todas"
            value={filters.operacoes}
            onValueChange={(v) => set("operacoes", v)}
          >
            {options.operacoes.map((v) => <MultiSelectItem key={v} value={v}>{v}</MultiSelectItem>)}
          </MultiSelect>
        </Field>

        <Field label="Cliente">
          <MultiSelect
            placeholder="Todos"
            value={filters.clientes}
            onValueChange={(v) => set("clientes", v)}
          >
            {options.clientes.map((v) => <MultiSelectItem key={v} value={v}>{v}</MultiSelectItem>)}
          </MultiSelect>
        </Field>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 space-y-0.5">
        <p>Total: <span className="text-slate-600 font-medium">{totalRecords.toLocaleString("pt-BR")}</span></p>
        <p>Filtrados: <span className="text-slate-600 font-medium">{filteredRecords.toLocaleString("pt-BR")}</span></p>
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}