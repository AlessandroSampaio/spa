use chrono::NaiveDateTime;
use diesel::prelude::*;

// ── IPC types ─────────────────────────────────────────────────────────────────

#[taurpc::ipc_type]
pub struct MonthlySales {
    pub month: String,
    pub quantity: f64,
}

#[taurpc::ipc_type]
pub struct SalesSummary {
    pub product_id: String,
    pub quantity_sold: f64,
    pub total_sales: f64,
    pub total_cost: f64,
    pub monthly_sales: Vec<MonthlySales>,
}

// ── DB-only types ─────────────────────────────────────────────────────────────

#[derive(Queryable, Selectable)]
#[diesel(table_name = crate::schema::itevda)]
pub struct SaleItemRow {
    #[diesel(column_name = "trndat")]
    pub date: NaiveDateTime,
    #[diesel(column_name = "itvqtdvda")]
    pub quantity_sold: Option<f64>,
    #[diesel(column_name = "itvvlrtot")]
    pub total_value: Option<f64>,
    #[diesel(column_name = "itvprccst")]
    pub cost_price: Option<f64>,
}
