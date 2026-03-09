# LogBI — Dashboard de Lead Time Logístico

Stack: **FastAPI** (Python) + **React + TypeScript + Tailwind CSS + Tremor**

## Estrutura

```
Junco/
├── backend/          # FastAPI — processa o Excel e serve JSON
│   ├── main.py       # API endpoints
│   ├── etl.py        # lógica pandas (extraída do app.py original)
│   └── requirements.txt
│
└── frontend/         # React + Tremor — dashboard visual
    └── src/
        ├── api/          # chamadas HTTP para o backend
        ├── lib/          # analytics: filtros, KPIs, agregações
        ├── types/        # interfaces TypeScript
        └── components/   # Header, Sidebar, KpiRow, gráficos, tabela
```

## Como rodar

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Ou clique duas vezes em `start-backend.bat`

### 2. Frontend (outro terminal)
```bash
cd frontend
npm install   # apenas primeira vez
npm run dev
```
Ou clique duas vezes em `start-frontend.bat`

Acesse: **http://localhost:5173**

## Uso
1. Faça upload da planilha `.xlsx` ou `.csv`
2. Use os filtros da sidebar (UF, Transportadora, Região, Período…)
3. Todos os gráficos e KPIs atualizam em tempo real no browser
4. Exporte a tabela filtrada via botão CSV
