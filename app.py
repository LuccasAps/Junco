import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime

# ─────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────
st.set_page_config(
    page_title="LogBI — Lead Time Analytics",
    page_icon="🚚",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─────────────────────────────────────────
# CUSTOM CSS (tema claro profissional)
# ─────────────────────────────────────────
st.markdown("""
<style>
    /* Fonte e fundo */
    html, body, [class*="css"] { font-family: 'Segoe UI', sans-serif; }
    .block-container { padding-top: 1.5rem; padding-bottom: 2rem; }

    /* Header customizado */
    .main-header {
        background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
        padding: 1.2rem 2rem;
        border-radius: 12px;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .main-header h1 { color: white; margin: 0; font-size: 1.6rem; font-weight: 700; }
    .main-header p  { color: rgba(255,255,255,0.75); margin: 0; font-size: 0.85rem; }

    /* KPI cards */
    .kpi-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.1rem 1.2rem;
        box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        border-left: 4px solid var(--kpi-color, #2563eb);
    }
    .kpi-label { font-size: 0.72rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
    .kpi-value { font-size: 2rem; font-weight: 800; color: #1e293b; line-height: 1; }
    .kpi-unit  { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }
    .kpi-delta { font-size: 0.72rem; margin-top: 6px; padding: 2px 8px; border-radius: 20px; display: inline-block; font-weight: 600; }
    .delta-ok   { background: #dcfce7; color: #16a34a; }
    .delta-warn { background: #fef9c3; color: #ca8a04; }
    .delta-bad  { background: #fee2e2; color: #dc2626; }

    /* Seção */
    .section-title {
        font-size: 0.7rem;
        font-weight: 700;
        color: #2563eb;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin: 1.4rem 0 0.7rem;
        padding-bottom: 6px;
        border-bottom: 2px solid #e2e8f0;
    }

    /* Upload */
    .upload-area {
        background: #f8fafc;
        border: 2px dashed #cbd5e1;
        border-radius: 12px;
        padding: 2rem;
        text-align: center;
        margin-bottom: 1.5rem;
    }

    /* Sidebar */
    [data-testid="stSidebar"] { background: #f8fafc; border-right: 1px solid #e2e8f0; }
    [data-testid="stSidebar"] .block-container { padding-top: 1rem; }

    /* Metric override */
    [data-testid="metric-container"] {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 0.8rem 1rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
</style>
""", unsafe_allow_html=True)

# ─────────────────────────────────────────
# COLUMN MAP  (planilha → campos internos)
# ─────────────────────────────────────────
COL_MAP = {
    "nota":            ["Nota Fiscal", "NF", "Nota"],
    "emissao_nf":      ["Emissão da Nota", "Emissão Nota", "Emissão NF", "Emissão"],
    "emissao_pedido":  ["Emissão do Pedido", "Emissão Pedido", "Data Pedido", "Pedido"],
    "expedicao":       ["Saída", "Saída Nota Fiscal", "Expedição", "Data Expedição"],
    "entrega":         ["Data de Entrega", "Data Entrega", "Entrega"],
    "previsao":        ["Previsão", "Previsão Nota Fiscal", "Data de Entrega Nota Fiscal", "Previsão Cliente"],
    "cliente":         ["Destinatário", "Cliente", "Tomador"],
    "uf":              ["UF Destino", "UF", "UF Dest"],
    "uf_origem":       ["UF Origem"],
    "regiao":          ["Região Destino", "Região", "Regiao"],
    "cidade_origem":   ["Cidade Origem"],
    "cidade_destino":  ["Cidade Destino"],
    "transportadora":  ["Transportador", "Transportadora"],
    "operacao":        ["Operação Fiscal", "Operação", "Tipo - NF", "Tipo"],
    "no_prazo":        ["Dentro do prazo", "No Prazo"],
    "lead_time_ideal": ["Lead Time Ideal"],
    "lead_time_calc":  ["Lead Time Praticado", "Lead Time"],
    "agendamento":     ["Trabalha com Agendamento"],
}

def find_col(df, candidates):
    for c in candidates:
        if c in df.columns:
            return c
    return None

def to_date(series):
    """Tenta converter coluna para datetime de forma robusta."""
    try:
        return pd.to_datetime(series, dayfirst=True, errors="coerce")
    except Exception:
        return pd.Series(pd.NaT, index=series.index, dtype="datetime64[ns]")

# ─────────────────────────────────────────
# LOAD & PROCESS
# ─────────────────────────────────────────
@st.cache_data(show_spinner=False)
def load_data(file_bytes, file_name):
    if file_name.endswith(".csv"):
        try:
            df_raw = pd.read_csv(file_bytes, sep=";", encoding="utf-8-sig")
        except Exception:
            df_raw = pd.read_csv(file_bytes, sep=",", encoding="utf-8-sig")
    else:
        xl = pd.ExcelFile(file_bytes, engine="openpyxl")
        # Usa a aba que começa com "Base", senão usa a primeira aba
        sheet = next((s for s in xl.sheet_names if s.startswith("Base")), xl.sheet_names[0])
        df_raw = xl.parse(sheet, header=0)

    df = pd.DataFrame()

    for field, candidates in COL_MAP.items():
        col = find_col(df_raw, candidates)
        if col:
            df[field] = df_raw[col]
        else:
            df[field] = None

    # Converter datas
    for d_col in ["emissao_nf", "emissao_pedido", "expedicao", "entrega", "previsao"]:
        df[d_col] = to_date(df[d_col])

    # Calcular intervalos
    def diff_days(a, b):
        result = (b - a).dt.days
        return result.where(result >= 0, other=None)

    df["ped_to_nf"]  = diff_days(df["emissao_pedido"], df["emissao_nf"])
    df["nf_to_exp"]  = diff_days(df["emissao_nf"],    df["expedicao"])
    df["exp_to_ent"] = diff_days(df["expedicao"],      df["entrega"])
    df["nf_to_ent"]  = diff_days(df["emissao_nf"],    df["entrega"])
    df["total"]      = diff_days(df["emissao_pedido"], df["entrega"])

    # Se não há data de pedido, usa o Lead Time já calculado pela planilha
    if df["total"].isna().all() and df["lead_time_calc"].notna().any():
        df["total"] = pd.to_numeric(df["lead_time_calc"], errors="coerce")

    # No Prazo
    if df["no_prazo"].notna().any():
        df["no_prazo"] = df["no_prazo"].astype(str).str.strip().str.lower().isin(
            ["sim", "true", "1", "yes", "s", "dentro do prazo"])
    elif df["previsao"].notna().any() and df["entrega"].notna().any():
        df["no_prazo"] = (df["entrega"] <= df["previsao"]).where(df["entrega"].notna())
    else:
        df["no_prazo"] = None

    df["no_prazo"] = pd.to_numeric(df["no_prazo"], errors="coerce")

    # Mês/ano para tendência
    df["mes_ano"] = df["emissao_nf"].dt.to_period("M").astype(str)

    # Limpar strings
    for c in ["cliente","uf","uf_origem","regiao","cidade_origem","cidade_destino","transportadora","operacao","nota","agendamento"]:
        df[c] = df[c].fillna("N/D").astype(str).str.strip()

    return df.dropna(subset=["emissao_nf"], how="all").reset_index(drop=True)

# ─────────────────────────────────────────
# HEADER
# ─────────────────────────────────────────
st.markdown("""
<div class="main-header">
    <div style="font-size:2.5rem">🚚</div>
    <div>
        <h1>LogBI — Lead Time & Performance</h1>
        <p>Dashboard analítico de logística · Análise de prazos e transportadoras</p>
    </div>
</div>
""", unsafe_allow_html=True)

# ─────────────────────────────────────────
# UPLOAD
# ─────────────────────────────────────────
uploaded = st.file_uploader(
    "📂 Carregue sua planilha de dados logísticos (.xlsx ou .csv)",
    type=["xlsx","xls","csv"],
    help="Colunas esperadas: Nota Fiscal, Emissão da Nota, Emissão do Pedido, Saída, Data de Entrega, Destinatário, UF Destino, Transportador, etc."
)

if not uploaded:
    st.info("⬆️ Faça upload da planilha para iniciar a análise. O dashboard será gerado automaticamente.")
    st.stop()

# ─────────────────────────────────────────
# LOAD
# ─────────────────────────────────────────
with st.spinner("Processando dados..."):
    df_all = load_data(uploaded.read(), uploaded.name)

if df_all.empty:
    st.error("Nenhum dado válido encontrado. Verifique o formato da planilha.")
    st.stop()

st.success(f"✓ {len(df_all):,} registros carregados com sucesso.")

# ─────────────────────────────────────────
# SIDEBAR — FILTROS
# ─────────────────────────────────────────
with st.sidebar:
    st.markdown("### 🔍 Filtros")

    def multiselect_all(label, options, key):
        opts = sorted([x for x in options if x and x != "N/D"])
        return st.multiselect(label, opts, default=[], key=key,
                              placeholder="Todos")

    f_uf     = multiselect_all("UF (Destino)",     df_all["uf"].unique(),             "f_uf")
    f_transp = multiselect_all("Transportadora",   df_all["transportadora"].unique(), "f_transp")
    f_cliente= multiselect_all("Cliente",          df_all["cliente"].unique(),        "f_cliente")
    f_op     = multiselect_all("Operação",         df_all["operacao"].unique(),       "f_op")
    f_regiao = multiselect_all("Região",           df_all["regiao"].unique(),         "f_regiao")

    if df_all["agendamento"].nunique() > 1:
        f_agendamento = multiselect_all("Agendamento", df_all["agendamento"].unique(), "f_agendamento")
    else:
        f_agendamento = []

    st.markdown("#### 📅 Período (Emissão NF)")
    dmin = df_all["emissao_nf"].min().date()
    dmax = df_all["emissao_nf"].max().date()
    f_dt = st.date_input("Intervalo", value=(dmin, dmax), min_value=dmin, max_value=dmax)

    st.markdown("---")
    st.caption(f"Total de registros: **{len(df_all):,}**")

# ─────────────────────────────────────────
# APPLY FILTERS
# ─────────────────────────────────────────
df = df_all.copy()

if f_uf:      df = df[df["uf"].isin(f_uf)]
if f_transp:  df = df[df["transportadora"].isin(f_transp)]
if f_cliente: df = df[df["cliente"].isin(f_cliente)]
if f_op:      df = df[df["operacao"].isin(f_op)]
if f_regiao:      df = df[df["regiao"].isin(f_regiao)]
if f_agendamento: df = df[df["agendamento"].isin(f_agendamento)]

if isinstance(f_dt, (list, tuple)) and len(f_dt) == 2:
    d0, d1 = pd.Timestamp(f_dt[0]), pd.Timestamp(f_dt[1])
    df = df[(df["emissao_nf"] >= d0) & (df["emissao_nf"] <= d1)]

if df.empty:
    st.warning("Nenhum registro para os filtros selecionados.")
    st.stop()

# ─────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────
def safe_mean(series):
    v = series.dropna()
    v = v[v >= 0]
    return round(v.mean(), 1) if len(v) else None

def fmt_days(v):
    return f"{v:.1f}" if v is not None else "—"

_font_color = "#1e293b"
_grid_color = "#f1f5f9"

PLOTLY_THEME = dict(
    paper_bgcolor="white",
    plot_bgcolor="white",
    font=dict(family="Segoe UI, Inter, sans-serif", size=12, color=_font_color),
    margin=dict(l=10, r=10, t=30, b=10),
    hoverlabel=dict(
        bgcolor="white",
        bordercolor="#e2e8f0",
        font=dict(family="Segoe UI, Inter, sans-serif", size=12, color=_font_color),
    ),
)

def apply_theme(fig):
    fig.update_layout(**PLOTLY_THEME)
    fig.update_xaxes(
        gridcolor=_grid_color,
        gridwidth=1,
        showline=False,
        zeroline=False,
        tickfont=dict(size=11, color="#64748b"),
        ticks="",
    )
    fig.update_yaxes(
        gridcolor=_grid_color,
        gridwidth=1,
        showline=False,
        zeroline=False,
        tickfont=dict(size=11, color="#64748b"),
        ticks="",
    )
    return fig

COLOR_SEQ = ["#1d4ed8","#2563eb","#3b82f6","#60a5fa","#93c5fd","#1e40af","#1e3a8a","#475569","#64748b","#94a3b8"]

# ─────────────────────────────────────────
# KPIs
# ─────────────────────────────────────────
st.markdown('<div class="section-title">Indicadores Principais</div>', unsafe_allow_html=True)

total_regs   = len(df)
lead_total   = safe_mean(df["total"])
ped_nf       = safe_mean(df["ped_to_nf"])
nf_exp       = safe_mean(df["nf_to_exp"])
exp_ent      = safe_mean(df["exp_to_ent"])

_prazo_valid = df["no_prazo"].dropna()
no_prazo_ct  = int(_prazo_valid.sum()) if df["no_prazo"].notna().any() else None
atraso_ct    = int((_prazo_valid == False).sum()) if no_prazo_ct is not None else None
pct_prazo    = round(no_prazo_ct / len(_prazo_valid) * 100, 1) if no_prazo_ct is not None and len(_prazo_valid) else None

c1,c2,c3,c4,c5,c6 = st.columns(6)

def kpi_html(label, value, unit, delta_txt=None, delta_cls="delta-ok", border_color="#2563eb"):
    delta_html = f'<div class="kpi-delta {delta_cls}">{delta_txt}</div>' if delta_txt else ""
    return f"""
    <div class="kpi-card" style="border-left-color:{border_color}">
        <div class="kpi-label">{label}</div>
        <div class="kpi-value">{value}</div>
        <div class="kpi-unit">{unit}</div>
        {delta_html}
    </div>"""

c1.markdown(kpi_html("Lead Time Total", fmt_days(lead_total), "dias (Pedido→Entrega)", border_color="#2563eb"), unsafe_allow_html=True)
c2.markdown(kpi_html("Pedido → Emissão NF", fmt_days(ped_nf), "dias médios", border_color="#f97316"), unsafe_allow_html=True)
c3.markdown(kpi_html("NF → Expedição", fmt_days(nf_exp), "dias médios", border_color="#8b5cf6"), unsafe_allow_html=True)
c4.markdown(kpi_html("Expedição → Entrega", fmt_days(exp_ent), "dias médios", border_color="#10b981"), unsafe_allow_html=True)

if pct_prazo is not None:
    cls = "delta-ok" if pct_prazo >= 90 else "delta-warn" if pct_prazo >= 75 else "delta-bad"
    _prazo_base = len(_prazo_valid)
    c5.markdown(kpi_html("Entregas no Prazo", f"{pct_prazo}%", f"{no_prazo_ct:,} de {_prazo_base:,} entregues"), unsafe_allow_html=True)
    c6.markdown(kpi_html("Em Atraso", f"{atraso_ct:,}", "ocorrências", border_color="#dc2626"), unsafe_allow_html=True)
else:
    c5.markdown(kpi_html("Total de Registros", f"{total_regs:,}", "operações no período", border_color="#64748b"), unsafe_allow_html=True)
    c6.markdown(kpi_html("Transportadoras", str(df["transportadora"].nunique()), "ativas no período", border_color="#64748b"), unsafe_allow_html=True)

# ─────────────────────────────────────────
# MATRIX DE LEAD TIME
# ─────────────────────────────────────────
st.markdown('<div class="section-title">Matrix de Intervalos por Etapa</div>', unsafe_allow_html=True)

steps = [
    ("Pedido → NF",           "ped_to_nf",  "#f97316"),
    ("NF → Expedição",        "nf_to_exp",  "#8b5cf6"),
    ("Expedição → Entrega",   "exp_to_ent", "#10b981"),
    ("NF → Entrega",          "nf_to_ent",  "#2563eb"),
    ("Pedido → Entrega",      "total",      "#0f172a"),
]

cols = st.columns(5)
for i, (label, key, color) in enumerate(steps):
    val = safe_mean(df[key])
    vals = df[key].dropna()
    vals = vals[vals >= 0]
    pct_acima = round((vals > (val or 0)).mean() * 100, 0) if len(vals) else 0
    with cols[i]:
        st.markdown(f"""
        <div style="background:white;border:1px solid #e2e8f0;border-top:3px solid {color};
                    border-radius:10px;padding:1rem;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
            <div style="font-size:0.68rem;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">{label}</div>
            <div style="font-size:1.9rem;font-weight:800;color:{color}">{fmt_days(val)}</div>
            <div style="font-size:0.72rem;color:#94a3b8">dias médios</div>
            <div style="font-size:0.68rem;color:#94a3b8;margin-top:4px">{pct_acima:.0f}% acima da média</div>
        </div>""", unsafe_allow_html=True)

# ─────────────────────────────────────────
# TENDÊNCIA MENSAL
# ─────────────────────────────────────────
st.markdown('<div class="section-title">Tendência de Lead Time — Mensal</div>', unsafe_allow_html=True)

trend = df.groupby("mes_ano").agg(
    total=("total","mean"),
    exp_ent=("exp_to_ent","mean"),
    ped_nf=("ped_to_nf","mean"),
    count=("nota","count")
).reset_index().sort_values("mes_ano")

fig_trend = go.Figure()
fig_trend.add_trace(go.Scatter(x=trend["mes_ano"], y=trend["total"].round(1),
    name="Lead Time Total", line=dict(color="#2563eb", width=2.5),
    mode="lines+markers", marker=dict(size=6, symbol="circle"),
    fill="tozeroy", fillcolor="rgba(37,99,235,0.06)"))
fig_trend.add_trace(go.Scatter(x=trend["mes_ano"], y=trend["exp_ent"].round(1),
    name="Expedição→Entrega", line=dict(color="#10b981", width=1.8, dash="dot"),
    mode="lines+markers", marker=dict(size=4, symbol="circle")))
fig_trend.add_trace(go.Scatter(x=trend["mes_ano"], y=trend["ped_nf"].round(1),
    name="Pedido→NF", line=dict(color="#f97316", width=1.8, dash="dot"),
    mode="lines+markers", marker=dict(size=4, symbol="circle")))
apply_theme(fig_trend)
fig_trend.update_layout(
    height=300,
    legend=dict(orientation="h", y=1.14, x=0, font=dict(size=11)),
    yaxis_title="Dias", xaxis_title=None,
    yaxis=dict(gridcolor=_grid_color),
    xaxis=dict(showgrid=False),
)
st.plotly_chart(fig_trend, use_container_width=True)

# ─────────────────────────────────────────
# UF  +  TRANSPORTADORA  +  REGIÃO
# ─────────────────────────────────────────
st.markdown('<div class="section-title">Análise por Dimensão</div>', unsafe_allow_html=True)

col_uf, col_tr, col_reg = st.columns([2, 3, 2])

# UF
with col_uf:
    st.markdown("**Lead Time médio por UF (Destino)**")
    uf_data = (df.groupby("uf")["total"]
               .mean().dropna().sort_values(ascending=False)
               .head(15).reset_index())
    uf_data.columns = ["UF","Dias"]
    uf_data["Dias"] = uf_data["Dias"].round(1)
    fig_uf = px.bar(uf_data, x="Dias", y="UF", orientation="h",
                    color="Dias", color_continuous_scale=["#bfdbfe","#1d4ed8"],
                    text="Dias")
    fig_uf.update_traces(textposition="inside", insidetextanchor="end",
                         texttemplate="%{text}d",
                         textfont=dict(color="white", size=12, family="Segoe UI, Inter, sans-serif"),
                         marker_line_width=0)
    apply_theme(fig_uf)
    fig_uf.update_layout(height=380, coloraxis_showscale=False,
                         yaxis=dict(categoryorder="total ascending", gridcolor="white"),
                         xaxis=dict(gridcolor=_grid_color, showgrid=True))
    st.plotly_chart(fig_uf, use_container_width=True)

# Transportadora
with col_tr:
    st.markdown("**Performance por Transportadora**")
    tr_data = df.groupby("transportadora").agg(
        lead=("exp_to_ent","mean"),
        count=("nota","count")
    ).reset_index()
    if df["no_prazo"].notna().any():
        pct = df.groupby("transportadora")["no_prazo"].mean().reset_index()
        pct.columns = ["transportadora","pct_prazo"]
        tr_data = tr_data.merge(pct, on="transportadora")
    else:
        tr_data["pct_prazo"] = None
    tr_data = tr_data[tr_data["count"] >= 2].sort_values("lead", ascending=False).head(12)
    tr_data["lead"] = tr_data["lead"].round(1)
    _tr_name = tr_data["transportadora"].str.replace(r"^\d+\s*[-–]?\s*", "", regex=True).str.strip()
    tr_data["label"] = _tr_name.str[:32].where(
        _tr_name.str.len() <= 32,
        _tr_name.str[:30] + "…"
    )

    fig_tr = px.bar(tr_data, x="lead", y="label", orientation="h",
                    color="lead", color_continuous_scale=["#1d4ed8","#93c5fd","#fbbf24","#dc2626"],
                    text="lead", labels={"lead":"Dias","label":""},
                    title=None)
    fig_tr.update_traces(texttemplate="%{text}d", textposition="inside",
                         insidetextanchor="end",
                         textfont=dict(color="white", size=12, family="Segoe UI, Inter, sans-serif"),
                         marker_line_width=0)
    apply_theme(fig_tr)
    chart_h = max(320, len(tr_data) * 38 + 60)
    fig_tr.update_layout(height=chart_h, coloraxis_showscale=False,
                         yaxis=dict(categoryorder="total ascending", gridcolor="white"),
                         xaxis=dict(range=[0, tr_data["lead"].max() * 1.08], showgrid=True, gridcolor=_grid_color),
                         margin=dict(l=160, r=20, t=20, b=10))
    st.plotly_chart(fig_tr, use_container_width=True)

# Região
with col_reg:
    st.markdown("**Lead Time por Região**")
    reg_data = (df.groupby("regiao")["total"]
                .mean().dropna().reset_index())
    reg_data.columns = ["Região","Dias"]
    reg_data["Dias"] = reg_data["Dias"].round(1)
    fig_reg = px.pie(reg_data, names="Região", values="Dias",
                     hole=0.45, color_discrete_sequence=COLOR_SEQ)
    fig_reg.update_traces(
        textinfo="label+value",
        texttemplate="%{label}<br><b>%{value}d</b>",
        textfont=dict(size=11, family="Segoe UI, Inter, sans-serif"),
        marker=dict(line=dict(color="white", width=2)),
    )
    apply_theme(fig_reg)
    fig_reg.update_layout(height=380, showlegend=False)
    st.plotly_chart(fig_reg, use_container_width=True)

# ─────────────────────────────────────────
# RANKINGS
# ─────────────────────────────────────────
st.markdown('<div class="section-title">Ranking de Transportadoras</div>', unsafe_allow_html=True)

rank_data = df.groupby("transportadora").agg(
    lead_medio=("exp_to_ent","mean"),
    total_entregas=("nota","count"),
).reset_index()
if df["no_prazo"].notna().any():
    pct = df.groupby("transportadora")["no_prazo"].mean().mul(100).round(1).reset_index()
    pct.columns = ["transportadora","pct_prazo"]
    rank_data = rank_data.merge(pct, on="transportadora")
else:
    rank_data["pct_prazo"] = None

rank_data = rank_data[rank_data["total_entregas"] >= 2]
rank_data["lead_medio"] = rank_data["lead_medio"].round(1)

col_best, col_worst = st.columns(2)

with col_best:
    st.markdown("🏆 **Melhores — Menores Lead Times**")
    best = rank_data.sort_values("lead_medio").head(5).reset_index(drop=True)
    best.index += 1
    best.columns = ["Transportadora","Lead Time (dias)","Entregas","% No Prazo"] if "pct_prazo" in rank_data.columns else ["Transportadora","Lead Time (dias)","Entregas"]
    st.dataframe(best, use_container_width=True,
                 column_config={"Lead Time (dias)": st.column_config.NumberColumn(format="%.1f d")})

with col_worst:
    st.markdown("⚠️ **Atenção — Maiores Lead Times**")
    worst = rank_data.sort_values("lead_medio", ascending=False).head(5).reset_index(drop=True)
    worst.index += 1
    worst.columns = best.columns
    st.dataframe(worst, use_container_width=True,
                 column_config={"Lead Time (dias)": st.column_config.NumberColumn(format="%.1f d")})

# ─────────────────────────────────────────
# PRAZO DONUT
# ─────────────────────────────────────────
if df["no_prazo"].notna().any():
    st.markdown('<div class="section-title">Pontualidade de Entregas</div>', unsafe_allow_html=True)
    on = int(df["no_prazo"].sum())
    off = int((df["no_prazo"] == False).sum())
    fig_donut = go.Figure(go.Pie(
        labels=["No Prazo","Em Atraso"],
        values=[on, off],
        hole=0.6,
        marker_colors=["#16a34a","#dc2626"],
        textinfo="label+percent",
    ))
    apply_theme(fig_donut)
    fig_donut.update_layout(height=280, showlegend=True,
                            legend=dict(orientation="h", y=-0.1))
    st.plotly_chart(fig_donut, use_container_width=True)

# ─────────────────────────────────────────
# TABELA ANALÍTICA
# ─────────────────────────────────────────
st.markdown('<div class="section-title">Tabela Analítica Detalhada</div>', unsafe_allow_html=True)

search = st.text_input("🔍 Buscar (nota, cliente, transportadora...)", placeholder="Digite para filtrar a tabela")

show_cols = {
    "nota": "Nota Fiscal",
    "emissao_pedido": "Emissão Pedido",
    "emissao_nf": "Emissão NF",
    "expedicao": "Expedição",
    "entrega": "Entrega",
    "cliente": "Cliente",
    "uf": "UF",
    "regiao": "Região",
    "transportadora": "Transportadora",
    "ped_to_nf": "Ped→NF (d)",
    "nf_to_exp": "NF→Exp (d)",
    "exp_to_ent": "Exp→Ent (d)",
    "total": "Total (d)",
    "lead_time_ideal": "LT Ideal (d)",
    "lead_time_calc": "LT Praticado (d)",
    "no_prazo": "No Prazo",
}

df_table = df[[c for c in show_cols.keys() if c in df.columns]].copy()
df_table = df_table.rename(columns=show_cols)

for d_col in ["Emissão Pedido","Emissão NF","Expedição","Entrega"]:
    if d_col in df_table.columns:
        df_table[d_col] = df_table[d_col].dt.strftime("%d/%m/%Y").fillna("—")

if search:
    mask = df_table.apply(lambda col: col.astype(str).str.lower().str.contains(search.lower(), na=False, regex=False)).any(axis=1)
    df_table = df_table[mask]

st.dataframe(
    df_table,
    use_container_width=True,
    height=400,
    column_config={
        "No Prazo": st.column_config.CheckboxColumn(),
        "Ped→NF (d)": st.column_config.NumberColumn(format="%d d"),
        "NF→Exp (d)": st.column_config.NumberColumn(format="%d d"),
        "Exp→Ent (d)": st.column_config.NumberColumn(format="%d d"),
        "Total (d)": st.column_config.NumberColumn(format="%d d"),
        "LT Ideal (d)": st.column_config.NumberColumn(format="%d d"),
        "LT Praticado (d)": st.column_config.NumberColumn(format="%d d"),
    }
)

st.markdown(f"**{len(df_table):,}** registros exibidos")

# ─────────────────────────────────────────
# EXPORT CSV
# ─────────────────────────────────────────
csv = df_table.to_csv(index=False, sep=";", encoding="utf-8-sig").encode("utf-8-sig")
st.download_button(
    label="⬇️ Exportar tabela filtrada (.csv)",
    data=csv,
    file_name=f"logbi_export_{datetime.today().strftime('%Y%m%d')}.csv",
    mime="text/csv",
)

st.markdown("---")
st.caption("LogBI · Dashboard de Lead Time Logístico · Desenvolvido com Streamlit + Plotly")
