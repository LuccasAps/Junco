import { Card, Title, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, DonutChart } from "@tremor/react";

interface RankRow {
  Transportadora: string;
  "Lead Time (d)": number;
  Entregas: number;
  "% No Prazo": number | null;
}

interface PrazoItem {
  name: string;
  value: number;
}

interface Props {
  best: RankRow[];
  worst: RankRow[];
  prazo: PrazoItem[] | null;
}

function RankTable({ rows, title, icon }: { rows: RankRow[]; title: string; icon: string }) {
  return (
    <Card>
      <Title>{icon} {title}</Title>
      <Table className="mt-4">
        <TableHead>
          <TableRow>
            <TableHeaderCell>#</TableHeaderCell>
            <TableHeaderCell>Transportadora</TableHeaderCell>
            <TableHeaderCell>Lead (d)</TableHeaderCell>
            <TableHeaderCell>Entregas</TableHeaderCell>
            <TableHeaderCell>% Prazo</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={r.Transportadora}>
              <TableCell className="text-slate-400 font-medium">{i + 1}</TableCell>
              <TableCell className="font-medium text-slate-700 max-w-[160px] truncate">
                {r.Transportadora}
              </TableCell>
              <TableCell>
                <span className="font-semibold text-slate-800">{r["Lead Time (d)"]}</span>
                <span className="text-slate-400 text-xs ml-0.5">d</span>
              </TableCell>
              <TableCell>{r.Entregas.toLocaleString("pt-BR")}</TableCell>
              <TableCell>
                {r["% No Prazo"] !== null ? (
                  <Badge
                    color={
                      r["% No Prazo"] >= 90 ? "green" : r["% No Prazo"] >= 75 ? "yellow" : "red"
                    }
                    size="xs"
                  >
                    {r["% No Prazo"]}%
                  </Badge>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export default function RankingTables({ best, worst, prazo }: Props) {
  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <RankTable rows={best} title="Melhores — Menor Lead Time" icon="🏆" />
        <RankTable rows={worst} title="Atenção — Maior Lead Time" icon="⚠️" />
      </div>

      {prazo && (
        <Card>
          <Title>Pontualidade de Entregas</Title>
          <div className="flex items-center justify-center gap-12 mt-4">
            <DonutChart
              className="h-40 w-40"
              data={prazo}
              index="name"
              category="value"
              colors={["emerald", "red"]}
              valueFormatter={(v) => v.toLocaleString("pt-BR")}
              showAnimation
            />
            <div className="space-y-3">
              {prazo.map((p, i) => {
                const total = prazo.reduce((a, b) => a + b.value, 0);
                const pct = total ? ((p.value / total) * 100).toFixed(1) : "0";
                return (
                  <div key={p.name} className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${i === 0 ? "bg-emerald-500" : "bg-red-500"}`}
                    />
                    <span className="text-sm font-medium text-slate-700">{p.name}</span>
                    <span className="text-sm text-slate-400">
                      {p.value.toLocaleString("pt-BR")} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}