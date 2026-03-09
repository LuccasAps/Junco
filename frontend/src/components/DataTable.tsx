import { useState } from "react";
import { Card, Title, TextInput, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, Button } from "@tremor/react";
import type { Row } from "../types";

interface Props {
  rows: Row[];
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function fmtDays(v: number | null): string {
  return v !== null ? `${v}d` : "—";
}

export default function DataTable({ rows }: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const filtered = search
    ? rows.filter((r) =>
        [r.nota, r.cliente, r.transportadora, r.uf, r.regiao, r.operacao]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : rows;

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  function exportCsv() {
    const headers = ["Nota Fiscal", "Emissão Pedido", "Emissão NF", "Expedição", "Entrega", "Cliente", "UF", "Região", "Transportadora", "Ped→NF", "NF→Exp", "Exp→Ent", "Total", "No Prazo"];
    const body = filtered.map((r) =>
      [r.nota, fmtDate(r.emissao_pedido), fmtDate(r.emissao_nf), fmtDate(r.expedicao), fmtDate(r.entrega), r.cliente, r.uf, r.regiao, r.transportadora, r.ped_to_nf ?? "", r.nf_to_exp ?? "", r.exp_to_ent ?? "", r.total ?? "", r.no_prazo === null ? "" : r.no_prazo ? "Sim" : "Não"].join(";")
    );
    const blob = new Blob(["\uFEFF" + [headers.join(";"), ...body].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logbi_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4 gap-3">
        <Title>Tabela Analítica Detalhada</Title>
        <div className="flex items-center gap-2">
          <TextInput
            placeholder="Buscar por nota, cliente, transportadora…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-72"
          />
          <Button size="sm" variant="secondary" onClick={exportCsv}>
            ⬇️ Exportar CSV
          </Button>
        </div>
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Nota</TableHeaderCell>
            <TableHeaderCell>Emissão NF</TableHeaderCell>
            <TableHeaderCell>Expedição</TableHeaderCell>
            <TableHeaderCell>Entrega</TableHeaderCell>
            <TableHeaderCell>Cliente</TableHeaderCell>
            <TableHeaderCell>UF</TableHeaderCell>
            <TableHeaderCell>Transportadora</TableHeaderCell>
            <TableHeaderCell>Ped→NF</TableHeaderCell>
            <TableHeaderCell>NF→Exp</TableHeaderCell>
            <TableHeaderCell>Exp→Ent</TableHeaderCell>
            <TableHeaderCell>Total</TableHeaderCell>
            <TableHeaderCell>No Prazo</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paged.map((r, i) => (
            <TableRow key={i}>
              <TableCell className="font-mono text-xs">{r.nota}</TableCell>
              <TableCell>{fmtDate(r.emissao_nf)}</TableCell>
              <TableCell>{fmtDate(r.expedicao)}</TableCell>
              <TableCell>{fmtDate(r.entrega)}</TableCell>
              <TableCell className="max-w-[140px] truncate text-sm">{r.cliente}</TableCell>
              <TableCell>{r.uf}</TableCell>
              <TableCell className="max-w-[140px] truncate text-sm">{r.transportadora}</TableCell>
              <TableCell>{fmtDays(r.ped_to_nf)}</TableCell>
              <TableCell>{fmtDays(r.nf_to_exp)}</TableCell>
              <TableCell>{fmtDays(r.exp_to_ent)}</TableCell>
              <TableCell className="font-semibold">{fmtDays(r.total)}</TableCell>
              <TableCell>
                {r.no_prazo === null ? (
                  <span className="text-slate-300">—</span>
                ) : (
                  <Badge color={r.no_prazo ? "green" : "red"} size="xs">
                    {r.no_prazo ? "Sim" : "Não"}
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
        <span>
          {filtered.length.toLocaleString("pt-BR")} registros
          {search && ` (filtrado de ${rows.length.toLocaleString("pt-BR")})`}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              ←
            </button>
            <span>{page + 1} / {totalPages}</span>
            <button
              className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              →
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}