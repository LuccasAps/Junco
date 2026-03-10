import { Card, Title, BarChart, DonutChart, Legend } from "@tremor/react";

interface Props {
  byUf: { uf: string; "Dias Médios": number }[];
  byTransportadora: { transportadora: string; "Dias (Exp→Ent)": number }[];
  byRegiao: { regiao: string; "Dias Médios": number }[];
}

export default function DimensionCharts({ byUf, byTransportadora, byRegiao }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      {/* UF */}
      <Card>
        <Title>Lead Time por UF (Destino)</Title>
        <BarChart
          className="mt-4 h-80"
          data={byUf}
          index="uf"
          categories={["Dias Médios"]}
          colors={["blue"]}
          valueFormatter={(v) => `${v}d`}
          layout="vertical"
          showLegend={false}
          showAnimation
        />
      </Card>

      {/* Transportadora */}
      <Card>
        <Title>Performance por Transportadora</Title>
        <BarChart
          className="mt-4 h-80"
          data={byTransportadora}
          index="transportadora"
          categories={["Dias (Exp→Ent)"]}
          colors={["indigo"]}
          valueFormatter={(v) => `${v}d`}
          layout="vertical"
          showLegend={false}
          showAnimation
        />
      </Card>

      {/* Região */}
      <Card>
        <Title>Lead Time por Região</Title>
        <DonutChart
          className="mt-6 h-52"
          data={byRegiao}
          index="regiao"
          category="Dias Médios"
          colors={["blue", "indigo", "violet", "purple", "fuchsia", "pink"]}
          valueFormatter={(v) => `${v}d`}
          showAnimation
        />
        <Legend
          className="mt-4"
          categories={byRegiao.map((r) => r.regiao)}
          colors={["blue", "indigo", "violet", "purple", "fuchsia", "pink"]}
        />
      </Card>
    </div>
  );
}