export default function Header() {
  return (
    <div className="bg-gradient-to-r from-blue-900 to-blue-600 px-8 py-5 flex items-center gap-4 rounded-2xl mb-6 shadow-md">
      <span className="text-4xl">🚚</span>
      <div>
        <h1 className="text-white text-2xl font-bold tracking-tight">
          LogBI — Lead Time & Performance
        </h1>
        <p className="text-blue-200 text-sm mt-0.5">
          Dashboard analítico de logística · Análise de prazos e transportadoras
        </p>
      </div>
    </div>
  );
}