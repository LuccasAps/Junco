import pandas as pd
from io import BytesIO

COL_MAP = {
    "nota":           ["Nota Fiscal", "NF", "Nota"],
    "emissao_nf":     ["Emissão da Nota", "Emissão Nota", "Emissão NF", "Data NF"],
    "emissao_pedido": ["Emissão do Pedido", "Emissão Pedido", "Data Pedido", "Pedido"],
    "expedicao":      ["Saída", "Saída Nota Fiscal", "Expedição", "Data Expedição"],
    "entrega":        ["Data de Entrega", "Data Entrega", "Entrega"],
    "previsao":       ["Previsão", "Previsão Nota Fiscal", "Data Previsão", "Previsão Cliente"],
    "cliente":        ["Destinatário", "Cliente", "Tomador"],
    "uf":             ["UF Destino", "UF", "UF Dest"],
    "regiao":         ["Região Destino", "Região", "Regiao"],
    "transportadora": ["Transportador", "Transportadora"],
    "operacao":       ["Operação Fiscal", "Operação", "Tipo"],
    "no_prazo":       ["No Prazo"],
}


def find_col(df: pd.DataFrame, candidates: list[str]) -> str | None:
    for c in candidates:
        if c in df.columns:
            return c
    return None


def to_date(series: pd.Series) -> pd.Series:
    try:
        return pd.to_datetime(series, dayfirst=True, errors="coerce")
    except Exception:
        return pd.Series(pd.NaT, index=series.index, dtype="datetime64[ns]")


def diff_days(a: pd.Series, b: pd.Series) -> pd.Series:
    result = (b - a).dt.days
    return result.where(result >= 0, other=None)


def process_file(file_bytes: bytes, file_name: str) -> list[dict]:
    bio = BytesIO(file_bytes)

    if file_name.lower().endswith(".csv"):
        try:
            df_raw = pd.read_csv(bio, sep=";", encoding="utf-8-sig")
        except Exception:
            bio.seek(0)
            df_raw = pd.read_csv(bio, sep=",", encoding="utf-8-sig")
    else:
        df_raw = pd.read_excel(bio, engine="openpyxl")

    df = pd.DataFrame()
    for field, candidates in COL_MAP.items():
        col = find_col(df_raw, candidates)
        df[field] = df_raw[col] if col else None

    for d_col in ["emissao_nf", "emissao_pedido", "expedicao", "entrega", "previsao"]:
        df[d_col] = to_date(df[d_col])

    df["ped_to_nf"]  = diff_days(df["emissao_pedido"], df["emissao_nf"])
    df["nf_to_exp"]  = diff_days(df["emissao_nf"],     df["expedicao"])
    df["exp_to_ent"] = diff_days(df["expedicao"],       df["entrega"])
    df["nf_to_ent"]  = diff_days(df["emissao_nf"],     df["entrega"])
    df["total"]      = diff_days(df["emissao_pedido"],  df["entrega"])

    if df["no_prazo"].notna().any():
        df["no_prazo"] = (
            df["no_prazo"].astype(str).str.strip().str.lower()
            .isin(["sim", "true", "1", "yes", "s"])
        )
    elif df["previsao"].notna().any() and df["entrega"].notna().any():
        df["no_prazo"] = (df["entrega"] <= df["previsao"]).where(df["entrega"].notna())
    else:
        df["no_prazo"] = None

    df["mes_ano"] = df["emissao_nf"].dt.to_period("M").astype(str)

    for c in ["cliente", "uf", "regiao", "transportadora", "operacao", "nota"]:
        df[c] = df[c].fillna("N/D").astype(str).str.strip()

    df = df.dropna(subset=["emissao_nf"], how="all").reset_index(drop=True)

    for d_col in ["emissao_nf", "emissao_pedido", "expedicao", "entrega", "previsao"]:
        df[d_col] = df[d_col].dt.strftime("%Y-%m-%d").where(df[d_col].notna())

    df = df.where(pd.notnull(df), None)

    return df.to_dict(orient="records")