"""
====================================================================
 DASHBOARD MONITORING PENGELUARAN MATERIAL - PLN UP3
 Dibangun dengan Streamlit + Plotly
====================================================================
Cara menjalankan:
    streamlit run dashboard.py

Pastikan file "Monitoring Data Keluar_Clean.xlsx" berada
di folder yang sama dengan file ini.
====================================================================
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime

# ====================================================================
# 1. KONFIGURASI HALAMAN
# ====================================================================
st.set_page_config(
    page_title="PLN UP3 | Dashboard Monitoring Material",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded",
)

SHEET_ID = "1sM5rnc_bvkNiHctKmeJvvpynMcxlVdRBdF5EQrkukXw"
GID = "1620170752"
SHEET_URL = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={GID}"

# ====================================================================
# 2. CUSTOM CSS - CORPORATE THEME (PLN - Merah, Kuning, Biru Tua)
# ====================================================================
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

    html, body, [class*="css"] {
        font-family: 'Poppins', sans-serif;
    }

    /* ---------- Background utama ---------- */
    .stApp {
        background: linear-gradient(180deg, #f4f6fb 0%, #eef1f8 100%);
    }

    /* ---------- Sembunyikan elemen default streamlit ---------- */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}

    /* ---------- Header / Hero Banner ---------- */
    .hero-banner {
        background: linear-gradient(115deg, #062250 0%, #0b2f66 38%, #12428c 68%, #1a5bb8 100%);
        padding: 34px 40px;
        border-radius: 18px;
        margin-bottom: 26px;
        box-shadow: 0 12px 30px rgba(11, 36, 71, 0.30);
        position: relative;
        overflow: hidden;
        border-bottom: 6px solid #ffcc00;
    }
    .hero-banner::before {
        content: "";
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 42%;
        background: linear-gradient(115deg, rgba(255,204,0,0) 0%, rgba(255,204,0,0.16) 55%, rgba(255,204,0,0.32) 100%);
        clip-path: polygon(35% 0, 100% 0, 100% 100%, 0% 100%);
        pointer-events: none;
    }
    .hero-banner::after {
        content: "";
        position: absolute;
        top: -70px;
        right: -70px;
        width: 260px;
        height: 260px;
        background: radial-gradient(circle, rgba(255,204,0,0.45) 0%, rgba(255,204,0,0) 70%);
        border-radius: 50%;
    }
    .hero-title {
        color: #ffffff;
        font-size: 32px;
        font-weight: 800;
        margin: 0;
        letter-spacing: 0.3px;
        display: flex;
        align-items: center;
        gap: 12px;
        text-shadow: 0 2px 6px rgba(0,0,0,0.35);
        position: relative;
        z-index: 2;
    }
    .hero-subtitle {
        color: #eaf1fc;
        font-size: 15px;
        font-weight: 400;
        margin-top: 8px;
        max-width: 720px;
        line-height: 1.6;
        text-shadow: 0 1px 4px rgba(0,0,0,0.25);
        position: relative;
        z-index: 2;
    }
    .hero-badge {
        display: inline-block;
        background: #ffcc00;
        color: #062250;
        font-weight: 800;
        font-size: 12px;
        padding: 6px 16px;
        border-radius: 20px;
        margin-top: 16px;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 12px rgba(255, 204, 0, 0.35);
        position: relative;
        z-index: 2;
    }

    /* ---------- KPI Cards ---------- */
    .kpi-card {
        background: #ffffff;
        border-radius: 16px;
        padding: 22px 24px;
        box-shadow: 0 6px 18px rgba(20, 40, 80, 0.08);
        border-left: 6px solid #ffcc00;
        transition: transform 0.2s ease;
        height: 100%;
    }
    .kpi-card:hover {
        transform: translateY(-4px);
    }
    .kpi-card.blue { border-left-color: #1e5fa8; }
    .kpi-card.red { border-left-color: #e63946; }
    .kpi-label {
        font-size: 13px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        margin-bottom: 6px;
    }
    .kpi-value {
        font-size: 30px;
        font-weight: 800;
        color: #0b2447;
        margin: 0;
    }
    .kpi-icon {
        font-size: 26px;
        margin-bottom: 8px;
    }

    /* ---------- Section headers ---------- */
    .section-title {
        font-size: 20px;
        font-weight: 700;
        color: #0b2447;
        margin-top: 10px;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .section-desc {
        font-size: 13px;
        color: #6b7280;
        margin-bottom: 16px;
    }

    .chart-card {
        background: #ffffff;
        border-radius: 16px;
        padding: 18px 22px 6px 22px;
        box-shadow: 0 6px 18px rgba(20, 40, 80, 0.07);
        margin-bottom: 22px;
    }

    /* ---------- Sidebar ---------- */
    section[data-testid="stSidebar"] {
        background: linear-gradient(180deg, #0b2447 0%, #123a72 100%);
    }
    section[data-testid="stSidebar"] * {
        color: #ffffff !important;
    }
    section[data-testid="stSidebar"] .stMultiSelect [data-baseweb="tag"] {
        background-color: #ffcc00 !important;
        color: #0b2447 !important;
    }

    /* ---------- Dataframe ---------- */
    .stDataFrame {
        border-radius: 12px;
        overflow: hidden;
    }

    hr {
        border: none;
        border-top: 1px solid #e2e6ee;
        margin: 22px 0;
    }
</style>
""", unsafe_allow_html=True)


# ====================================================================
# 3. LOAD & PREP DATA
# ====================================================================
@st.cache_data(ttl=600)
def load_data(url: str) -> pd.DataFrame:
    # -------- 1. Ambil data langsung dari Google Sheets --------
    df = pd.read_csv(url)

    # -------- 2. Hilangkan spasi pada nama kolom --------
    df.columns = df.columns.str.strip()

    # -------- 3. Hilangkan spasi di awal/akhir isi kolom bertipe object --------
    for col in df.select_dtypes(include="object").columns:
        df[col] = df[col].str.strip()

    # -------- 4. Ubah string kosong menjadi NaN --------
    df.replace(r'^\s*$', np.nan, regex=True, inplace=True)

    # -------- 5. Ubah nilai "#N/A", "nan", "None" menjadi NaN --------
    df.replace(["#N/A", "nan", "None"], np.nan, inplace=True)

    # -------- 6. Konversi JUMLAH menjadi numerik --------
    df["JUMLAH"] = df["JUMLAH"].astype(str).str.replace(",", ".", regex=False)
    df["JUMLAH"] = pd.to_numeric(df["JUMLAH"], errors="coerce")

    # -------- 7. Perbaiki tahun 2005 -> 2025 pada kolom WAKTU --------
    df["WAKTU"] = df["WAKTU"].astype(str).str.replace("2005", "2025", regex=False)

    # -------- 8. Hapus baris kosong / tidak lengkap --------
    df.dropna(how="all", inplace=True)
    df = df[df["NAMA MATERIAL"].notna()]
    df = df[df["WAKTU"].notna()]

    # -------- 9. Isi data kosong --------
    for col in df.columns:
        if col == "JUMLAH":
            df[col] = df[col].fillna(0)
        else:
            df[col] = df[col].fillna("Tidak Diketahui")

    # -------- 10. Hapus duplikat & reset index --------
    df.drop_duplicates(inplace=True)
    df.reset_index(drop=True, inplace=True)

    # -------- 11. Parse tanggal ke datetime untuk analisis --------
    df["WAKTU"] = pd.to_datetime(df["WAKTU"], format="%d/%m/%Y", errors="coerce")
    df = df[df["WAKTU"].notna()]

    df["TAHUN"] = df["WAKTU"].dt.year
    df["BULAN_NUM"] = df["WAKTU"].dt.month

    bulan_map = {
        1: "Januari", 2: "Februari", 3: "Maret", 4: "April",
        5: "Mei", 6: "Juni", 7: "Juli", 8: "Agustus",
        9: "September", 10: "Oktober", 11: "November", 12: "Desember"
    }
    df["BULAN"] = df["BULAN_NUM"].map(bulan_map)

    if "UNIT" not in df.columns:
        df["UNIT"] = "UP3 PADANG"
    df["UNIT"] = df["UNIT"].fillna("Tidak Diketahui")

    return df


try:
    with st.spinner("🔄 Mengambil data terbaru dari Google Sheets..."):
        df = load_data(SHEET_URL)
except Exception as e:
    st.error(
        "⚠️ Gagal mengambil data dari Google Sheets.\n\n"
        "Pastikan spreadsheet memiliki akses **\"Anyone with the link - Viewer\"** "
        "(Bagikan > Akses Umum > Siapa saja yang memiliki link), lalu coba muat ulang halaman.\n\n"
        f"Detail error: `{e}`"
    )
    st.stop()

bulan_urutan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
                "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

# ====================================================================
# 4. SIDEBAR - FILTER
# ====================================================================
with st.sidebar:
    st.markdown("## ⚡ PLN UP3")
    st.markdown("#### Panel Filter Data")

    if st.button("🔄 Refresh Data dari Spreadsheet"):
        st.cache_data.clear()
        st.rerun()

    st.markdown("---")

    tahun_list = sorted(df["TAHUN"].dropna().unique().tolist())
    tahun_pilih = st.multiselect(
        "📅 Tahun",
        options=tahun_list,
        default=tahun_list,
    )

    bulan_list = [b for b in bulan_urutan if b in df["BULAN"].unique()]
    bulan_pilih = st.multiselect(
        "🗓️ Bulan",
        options=bulan_list,
        default=bulan_list,
    )

    unit_list = sorted(df["UNIT"].dropna().unique().tolist())
    unit_pilih = st.multiselect(
        "🏢 Unit",
        options=unit_list,
        default=unit_list,
    )

    st.markdown("---")
    st.caption("Dashboard ini menampilkan monitoring pengeluaran material gudang PLN UP3 berdasarkan data transaksi yang telah dibersihkan.")
    st.caption(f"🕒 Terakhir diperbarui: {datetime.now().strftime('%d %B %Y, %H:%M')}")

# Terapkan filter
df_filtered = df[
    df["TAHUN"].isin(tahun_pilih) &
    df["BULAN"].isin(bulan_pilih) &
    df["UNIT"].isin(unit_pilih)
].copy()

# ====================================================================
# 5. HERO HEADER
# ====================================================================
st.markdown("""
<div class="hero-banner">
    <p class="hero-title">⚡ Dashboard Monitoring Pengeluaran Material</p>
    <p class="hero-subtitle">
        Pantau frekuensi, volume, dan tren pengeluaran material gudang secara real-time.
        Dashboard ini membantu tim PLN UP3 dalam pengambilan keputusan berbasis data terkait
        manajemen persediaan dan distribusi material ke lapangan.
    </p>
    <span class="hero-badge">PLN UP3 &nbsp;•&nbsp; MATERIAL MONITORING SYSTEM</span>
</div>
""", unsafe_allow_html=True)

if df_filtered.empty:
    st.warning("Tidak ada data untuk kombinasi filter yang dipilih. Silakan ubah filter di sidebar.")
    st.stop()

# ====================================================================
# 6. KPI CARDS
# ====================================================================
total_transaksi = len(df_filtered)
total_material_keluar = df_filtered["JUMLAH"].sum()
jumlah_jenis_material = df_filtered["NAMA MATERIAL"].nunique()

col1, col2, col3 = st.columns(3)

with col1:
    st.markdown(f"""
    <div class="kpi-card">
        <div class="kpi-icon">📦</div>
        <div class="kpi-label">Total Transaksi</div>
        <p class="kpi-value">{total_transaksi:,.0f}</p>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown(f"""
    <div class="kpi-card blue">
        <div class="kpi-icon">📤</div>
        <div class="kpi-label">Total Material Keluar</div>
        <p class="kpi-value">{total_material_keluar:,.0f}</p>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown(f"""
    <div class="kpi-card red">
        <div class="kpi-icon">🏷️</div>
        <div class="kpi-label">Jumlah Jenis Material</div>
        <p class="kpi-value">{jumlah_jenis_material:,.0f}</p>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<hr>", unsafe_allow_html=True)

# ====================================================================
# 7. BUSINESS QUESTION 1 - Top 10 Material Paling Sering Dikeluarkan
# ====================================================================
st.markdown('<p class="section-title">🔥 Business Question 1</p>', unsafe_allow_html=True)
st.markdown('<p class="section-desc">Top 10 material yang paling sering dikeluarkan berdasarkan jumlah transaksi</p>', unsafe_allow_html=True)

st.markdown('<div class="chart-card">', unsafe_allow_html=True)

top10_freq = (
    df_filtered["NAMA MATERIAL"]
    .value_counts()
    .head(10)
    .sort_values(ascending=True)
)

fig1_max = float(top10_freq.values.max())

fig1 = go.Figure(go.Bar(
    x=top10_freq.values,
    y=top10_freq.index,
    orientation="h",
    marker=dict(
        color=top10_freq.values,
        colorscale=[[0, "#ffcc00"], [1, "#0b2447"]],
    ),
    text=top10_freq.values,
    textposition="outside",
    cliponaxis=False,
    hovertemplate="<b>%{y}</b><br>Frekuensi: %{x}<extra></extra>",
))
fig1.update_layout(
    height=460,
    margin=dict(l=10, r=60, t=20, b=60),
    xaxis_title=dict(text="Frekuensi Pengeluaran", font=dict(color="#0b2447", size=13), standoff=15),
    yaxis_title="",
    plot_bgcolor="rgba(0,0,0,0)",
    paper_bgcolor="rgba(0,0,0,0)",
    font=dict(family="Poppins, sans-serif", color="#0b2447", size=13),
    xaxis=dict(
        showgrid=True, gridcolor="#eef1f8",
        tickfont=dict(color="#0b2447", size=12),
        range=[0, fig1_max * 1.18],
    ),
    yaxis=dict(
        tickfont=dict(color="#0b2447", size=12, weight="bold"),
        automargin=True,
    ),
    uniformtext_minsize=11,
    uniformtext_mode="show",
)
fig1.update_traces(textfont=dict(color="#0b2447", size=12))
st.plotly_chart(fig1, use_container_width=True, theme=None)
st.markdown('</div>', unsafe_allow_html=True)

# ====================================================================
# 8. BUSINESS QUESTION 2 - Top 10 Material Total Jumlah Terbesar
# ====================================================================
st.markdown('<p class="section-title">📊 Business Question 2</p>', unsafe_allow_html=True)
st.markdown('<p class="section-desc">Top 10 material dengan total jumlah pengeluaran (volume) terbesar</p>', unsafe_allow_html=True)

st.markdown('<div class="chart-card">', unsafe_allow_html=True)

top10_jumlah = (
    df_filtered.groupby("NAMA MATERIAL")["JUMLAH"]
    .sum()
    .sort_values(ascending=False)
    .head(10)
    .sort_values(ascending=True)
)

fig2_max = float(top10_jumlah.values.max())

fig2 = go.Figure(go.Bar(
    x=top10_jumlah.values,
    y=top10_jumlah.index,
    orientation="h",
    marker=dict(
        color=top10_jumlah.values,
        colorscale=[[0, "#e63946"], [1, "#0b2447"]],
    ),
    text=[f"{v:,.0f}" for v in top10_jumlah.values],
    textposition="outside",
    cliponaxis=False,
    hovertemplate="<b>%{y}</b><br>Total Jumlah: %{x:,.0f}<extra></extra>",
))
fig2.update_layout(
    height=460,
    margin=dict(l=10, r=70, t=20, b=60),
    xaxis_title=dict(text="Total Jumlah Pengeluaran", font=dict(color="#0b2447", size=13), standoff=15),
    yaxis_title="",
    plot_bgcolor="rgba(0,0,0,0)",
    paper_bgcolor="rgba(0,0,0,0)",
    font=dict(family="Poppins, sans-serif", color="#0b2447", size=13),
    xaxis=dict(
        showgrid=True, gridcolor="#eef1f8", tickformat=",",
        tickfont=dict(color="#0b2447", size=12),
        range=[0, fig2_max * 1.22],
    ),
    yaxis=dict(
        tickfont=dict(color="#0b2447", size=12, weight="bold"),
        automargin=True,
    ),
    uniformtext_minsize=11,
    uniformtext_mode="show",
)
fig2.update_traces(textfont=dict(color="#0b2447", size=12))
st.plotly_chart(fig2, use_container_width=True, theme=None)
st.markdown('</div>', unsafe_allow_html=True)

# ====================================================================
# 9. BUSINESS QUESTION 3 - Tren Pengeluaran Material
# ====================================================================
st.markdown('<p class="section-title">📈 Business Question 3</p>', unsafe_allow_html=True)
st.markdown('<p class="section-desc">Tren total pengeluaran material dari waktu ke waktu (per bulan)</p>', unsafe_allow_html=True)

st.markdown('<div class="chart-card">', unsafe_allow_html=True)

tren = (
    df_filtered.groupby(df_filtered["WAKTU"].dt.to_period("M"))["JUMLAH"]
    .sum()
    .reset_index()
)
tren["WAKTU"] = tren["WAKTU"].astype(str)

fig3 = go.Figure()
fig3.add_trace(go.Scatter(
    x=tren["WAKTU"],
    y=tren["JUMLAH"],
    mode="lines+markers+text",
    line=dict(color="#1e5fa8", width=3, shape="spline"),
    marker=dict(size=8, color="#ffcc00", line=dict(width=2, color="#0b2447")),
    text=[f"{v:,.0f}" for v in tren["JUMLAH"]],
    textposition="top center",
    textfont=dict(size=10, color="#0b2447"),
    fill="tozeroy",
    fillcolor="rgba(30, 95, 168, 0.08)",
    hovertemplate="<b>%{x}</b><br>Total: %{y:,.0f}<extra></extra>",
))
fig3.update_layout(
    height=480,
    margin=dict(l=70, r=30, t=50, b=100),
    xaxis_title=dict(text="Periode", font=dict(color="#0b2447", size=13), standoff=15),
    yaxis_title=dict(text="Total Pengeluaran Material", font=dict(color="#0b2447", size=13), standoff=15),
    plot_bgcolor="rgba(0,0,0,0)",
    paper_bgcolor="rgba(0,0,0,0)",
    font=dict(family="Poppins, sans-serif", color="#0b2447", size=13),
    xaxis=dict(
        showgrid=False, tickangle=-45,
        tickfont=dict(color="#0b2447", size=12),
        automargin=True,
    ),
    yaxis=dict(
        showgrid=True, gridcolor="#eef1f8", tickformat=",",
        tickfont=dict(color="#0b2447", size=12),
        automargin=True,
    ),
    hovermode="x unified",
)
st.plotly_chart(fig3, use_container_width=True, theme=None)
st.markdown('</div>', unsafe_allow_html=True)

# ====================================================================
# 10. TABEL DATA HASIL FILTER
# ====================================================================
st.markdown('<p class="section-title">🗂️ Tabel Data Transaksi (Hasil Filter)</p>', unsafe_allow_html=True)
st.markdown(f'<p class="section-desc">Menampilkan {len(df_filtered):,} baris data sesuai filter yang dipilih</p>', unsafe_allow_html=True)

st.markdown('<div class="chart-card">', unsafe_allow_html=True)

kolom_tampil = [c for c in [
    "WAKTU", "KODE MATERIAL", "NAMA MATERIAL", "STN", "JUMLAH",
    "UNIT", "VENDOR (PT.)", "No SPK", "RESERVASI", "PEKERJAAN", "DIAMBIL OLEH"
] if c in df_filtered.columns]

df_display = df_filtered[kolom_tampil].sort_values("WAKTU", ascending=False).copy()
df_display["WAKTU"] = df_display["WAKTU"].dt.strftime("%d/%m/%Y")

styled_table = (
    df_display.style
    .set_properties(**{
        "background-color": "#ffffff",
        "color": "#111111",
        "border-color": "#e2e6ee",
    })
    .set_table_styles([
        {"selector": "th", "props": [
            ("background-color", "#0b2447"),
            ("color", "#ffffff"),
            ("font-weight", "700"),
        ]},
    ])
)

st.dataframe(styled_table, use_container_width=True, height=420)

csv = df_display.to_csv(index=False).encode("utf-8")
st.download_button(
    label="⬇️ Unduh Data (CSV)",
    data=csv,
    file_name="data_material_filtered.csv",
    mime="text/csv",
)
st.markdown('</div>', unsafe_allow_html=True)

# ====================================================================
# 11. FOOTER
# ====================================================================
st.markdown("""
<hr>
<div style="text-align:center; padding: 10px 0 30px 0; color:#8a94a6; font-size:12px;">
    © 2026 PLN UP3 Padang - Dashboard Monitoring Pengeluaran Material
    <br>
    by: Mawarni Lubis
</div>
""", unsafe_allow_html=True)