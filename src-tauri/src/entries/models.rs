use chrono::NaiveDateTime;
use diesel::prelude::*;
use diesel::sql_types::*;

// ── IPC types ─────────────────────────────────────────────────────────────────

#[taurpc::ipc_type]
pub struct MonthlyEntries {
    pub month: String,
    pub quantity: f64,
}

#[taurpc::ipc_type]
pub struct EntriesSummary {
    pub product_id: String,
    pub quantity_purchased: f64,
    pub total_value: f64,
    pub monthly_entries: Vec<MonthlyEntries>,
}

// ── DB-only types ─────────────────────────────────────────────────────────────

#[derive(QueryableByName)]
pub struct EntryItemRow {
    #[diesel(sql_type = Nullable<Timestamp>)]
    pub entry_date: Option<NaiveDateTime>,
    #[diesel(sql_type = Nullable<Double>)]
    pub quantity_emb: Option<f64>,
    #[diesel(sql_type = Nullable<Double>)]
    pub units_emb: Option<f64>,
    #[diesel(sql_type = Nullable<Double>)]
    pub total_value: Option<f64>,
}
