import type { Row } from "../types";

const BASE = "http://localhost:8000";

export async function uploadFile(file: File): Promise<Row[]> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${BASE}/api/upload`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Erro ao processar arquivo.");
  }
  const data = await res.json();
  return data.records as Row[];
}