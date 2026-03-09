import { useRef, useState } from "react";
import { Button } from "@tremor/react";

interface Props {
  onUpload: (file: File) => void;
  loading: boolean;
  error: string | null;
}

export default function UploadZone({ onUpload, loading, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    if (!file) return;
    const ok = file.name.match(/\.(xlsx|xls|csv)$/i);
    if (!ok) return alert("Formato inválido. Use .xlsx ou .csv");
    onUpload(file);
  }

  return (
    <div
      className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors
        ${dragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white"}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
    >
      <div className="text-5xl mb-4">📂</div>
      <p className="text-slate-600 font-medium mb-1">
        Arraste sua planilha aqui ou clique para selecionar
      </p>
      <p className="text-slate-400 text-sm mb-6">Formatos aceitos: .xlsx, .xls, .csv</p>

      <Button
        size="lg"
        color="blue"
        loading={loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? "Processando…" : "Selecionar arquivo"}
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {error && (
        <p className="mt-4 text-red-600 text-sm font-medium">{error}</p>
      )}
    </div>
  );
}