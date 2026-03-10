import { Card, Metric, Text, Badge } from "@tremor/react";
import type { KPIs } from "../types";

interface Props {
  kpis: KPIs;
}

function fmt(v: number | null): string {
  return v !== null ? v.toFixed(1) : "—";
}

function KpiCard({
  label,
  value,
  unit,
  badge,
  badgeColor,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  badge?: string;
  badgeColor?: "green" | "yellow" | "red" | "blue" | "gray";
  accent?: string;
}) {
  return (
    <Card className={`border-l-4 ${accent ?? "border-l-blue-600"}`} decoration="left" decorationColor="blue">
      <Text className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">
        {label}
      </Text>
      <Metric className="text-slate-800 leading-none">{value}</Metric>
      <Text className="text-xs text-slate-400 mt-0.5">{unit}</Text>
      {badge && (
        <Badge color={badgeColor ?? "blue"} size="xs" className="mt-2">
          {badge}
        </Badge>
      )}
    </Card>
  );
}

export default function KpiRow({ kpis }: Props) {
  const prazoColor =
    kpis.pctPrazo === null
      ? undefined
      : kpis.pctPrazo >= 90
      ? "green"
      : kpis.pctPrazo >= 75
      ? "yellow"
      : "red";

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      <KpiCard
        label="Lead Time Total"
        value={fmt(kpis.leadTotal)}
        unit="dias · Pedido→Entrega"
        accent="border-l-blue-600"
      />
      <KpiCard
        label="Pedido → Emissão NF"
        value={fmt(kpis.pedNf)}
        unit="dias médios"
        accent="border-l-orange-500"
      />
      <KpiCard
        label="NF → Expedição"
        value={fmt(kpis.nfExp)}
        unit="dias médios"
        accent="border-l-purple-500"
      />
      <KpiCard
        label="Expedição → Entrega"
        value={fmt(kpis.expEnt)}
        unit="dias médios"
        accent="border-l-emerald-500"
      />

      {kpis.pctPrazo !== null ? (
        <>
          <KpiCard
            label="Entregas no Prazo"
            value={`${kpis.pctPrazo}%`}
            unit={`${kpis.noPrazoCount?.toLocaleString("pt-BR")} de ${(kpis.noPrazoCount! + kpis.atrasoCount!).toLocaleString("pt-BR")}`}
            badge={prazoColor === "green" ? "Ótimo" : prazoColor === "yellow" ? "Atenção" : "Crítico"}
            badgeColor={prazoColor}
            accent={
              prazoColor === "green"
                ? "border-l-green-500"
                : prazoColor === "yellow"
                ? "border-l-yellow-500"
                : "border-l-red-500"
            }
          />
          <KpiCard
            label="Em Atraso"
            value={kpis.atrasoCount?.toLocaleString("pt-BR") ?? "—"}
            unit="ocorrências"
            accent="border-l-red-500"
          />
        </>
      ) : (
        <>
          <KpiCard
            label="Total de Registros"
            value={kpis.totalRecords.toLocaleString("pt-BR")}
            unit="operações no período"
            accent="border-l-slate-400"
          />
          <KpiCard
            label="Transportadoras"
            value={String(kpis.transportadorasCount)}
            unit="ativas no período"
            accent="border-l-slate-400"
          />
        </>
      )}
    </div>
  );
}