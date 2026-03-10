import { Card, Title, AreaChart } from "@tremor/react";

interface Props {
  data: Record<string, string | number | null>[];
}

export default function TrendChart({ data }: Props) {
  return (
    <Card className="mb-6">
      <Title>Tendência de Lead Time — Mensal</Title>
      <AreaChart
        className="mt-4 h-64"
        data={data}
        index="mes"
        categories={["Lead Total", "Exp→Entrega", "Pedido→NF"]}
        colors={["blue", "emerald", "orange"]}
        valueFormatter={(v) => `${v}d`}
        yAxisWidth={40}
        showLegend
        showAnimation
      />
    </Card>
  );
}