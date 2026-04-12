use chrono::NaiveDateTime;
use diesel::prelude::*;

// ── IPC types ─────────────────────────────────────────────────────────────────

#[taurpc::ipc_type]
pub struct VendaMediaMensal {
    pub mes: String,
    pub quantidade: f64,
}

#[taurpc::ipc_type]
pub struct ResumoVendas {
    pub produto_id: String,
    pub quantidade_vendida: f64,
    pub total_venda: f64,
    pub total_custo: f64,
    pub venda_media_mensal: Vec<VendaMediaMensal>,
}

// ── DB-only types ─────────────────────────────────────────────────────────────

#[derive(Queryable, Selectable)]
#[diesel(table_name = crate::schema::itevda)]
pub struct ItemVendaRow {
    pub id: i32,
    pub trndat: NaiveDateTime,
    pub procod: Option<String>,
    pub itvqtdvda: Option<f64>,
    pub itvvlruni: Option<f64>,
    pub itvvlrdcn: Option<f64>,
    pub itvvlracr: Option<f64>,
    pub itvvlrtot: Option<f64>,
    pub itvprccst: Option<f64>,
}
