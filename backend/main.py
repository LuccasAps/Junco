from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from etl import process_file

app = FastAPI(title="LogBI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Nenhum arquivo enviado.")
    allowed = (".xlsx", ".xls", ".csv")
    if not file.filename.lower().endswith(allowed):
        raise HTTPException(status_code=400, detail="Formato inválido. Use .xlsx ou .csv")
    content = await file.read()
    try:
        records = process_file(content, file.filename)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Erro ao processar arquivo: {e}")
    if not records:
        raise HTTPException(status_code=422, detail="Nenhum dado válido encontrado na planilha.")
    return {"records": records, "count": len(records)}