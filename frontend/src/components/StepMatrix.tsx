import type { KPIs } from "../types";

const STEPS = [
  { label: "Pedido → NF", key: "pedNf" as keyof KPIs, color: "#f97316" },
  { label: "NF → Expedição", key: "nfExp" as keyof KPIs, color: "#8b5cf6" },
  { label: "Expedição → Entrega", key: "expEnt" as keyof KPIs, color: "#10b981" },
  { label: "Lead Time Total", key: "leadTotal" as keyof KPIs, color: "#2563eb" },
];

interface Props {
  kpis: KPIs;
}

export default function StepMatrix({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {STEPS.map((s) => {
        const val = kpis[s.key] as number | null;
        return (
          <div
            key={s.key}
            className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-sm"
            style={{ borderTop: `3px solid ${s.color}` }}
          >
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">
              {s.label}
            </p>
            <p
              className="text-4xl font-extrabold leading-none"
              style={{ color: s.color }}
            >
              {val !== null ? val.toFixed(1) : "—"}
            </p>
            <p className="text-xs text-slate-400 mt-1">dias médios</p>
          </div>
        );
      })}
    </div>
  );
}